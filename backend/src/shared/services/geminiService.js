'use strict';
const { GoogleGenerativeAI, SchemaType, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

/**
 * GEMINI SERVICE (DIAGNOSTIC VERSION V3)
 * 
 * Optimized for high-precision Identity Document OCR.
 * Added local file logging to debug-gemini.log for audit.
 */

const logFile = path.join(__dirname, '../../../../debug-gemini.log');

function logDebug(msg) {
    const timestamp = new Date().toISOString();
    const formattedMsg = `[${timestamp}] ${msg}\n`;
    fs.appendFileSync(logFile, formattedMsg);
    console.log(`[GEMINI_DEBUG] ${msg}`);
}

if (!process.env.GEMINI_API_KEY) {
    logDebug('CRITICAL: GEMINI_API_KEY is not defined in environment variables.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Models prioritized by verified stability for this specific API key
const GEMINI_MODELS = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-2.0-flash-exp',
    'gemini-1.5-pro'
];

// Safety settings - Crucial for ID docs which contain sensitive strings that trigger filters
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function extractAadhaarData(imageBuffer, mimeType, retries = 2) {
    logDebug(`--- START NEW EXTRACTION (MIME: ${mimeType}) ---`);

    const prompt = `You are a professional Indian Identity Document OCR system. Analyze this Aadhaar Card image and extract the following fields EXACTLY as named:
    - fullName: The person's full name in English.
    - aadhaarNumber: The 12-digit number (format: XXXX XXXX XXXX). Do not include spaces or dashes.
    - age: Calculate current age based on Date of Birth (DD/MM/YYYY) or Year of Birth (YYYY) found on the card.
    - dob: Date of Birth as DD/MM/YYYY.
    - gender: MALE or FEMALE.
    - address: Full address including Pincode.
    - phoneNumber: 10-digit mobile number if found.
    
    IMPORTANT: Return valid JSON with these EXACT keys. If a value is missing, return an empty string.`;

    const ocrSchema = {
        type: SchemaType.OBJECT,
        properties: {
            fullName: { type: SchemaType.STRING, description: "Full name on the card" },
            aadhaarNumber: { type: SchemaType.STRING, description: "12 digit number without spaces" },
            age: { type: SchemaType.STRING, description: "Calculated current age" },
            dob: { type: SchemaType.STRING, description: "DD/MM/YYYY" },
            gender: { type: SchemaType.STRING },
            address: { type: SchemaType.STRING },
            phoneNumber: { type: SchemaType.STRING }
        },
        required: ["fullName"]
    };

    let lastError = null;

    for (const modelName of GEMINI_MODELS) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                logDebug(`Attempt with: ${modelName} | Attempt: ${attempt}`);

                const model = genAI.getGenerativeModel({ model: modelName.trim(), safetySettings });
                const generationConfig = {
                    temperature: 0,
                    responseMimeType: "application/json",
                    responseSchema: ocrSchema
                };

                const imgPart = { inlineData: { data: imageBuffer.toString("base64"), mimeType } };

                const result = await model.generateContent({
                    contents: [{ role: 'user', parts: [imgPart, { text: prompt }] }],
                    generationConfig
                });

                const rawText = result.response.text();
                logDebug(`RAW AI RESPONSE: ${rawText.substring(0, 500)}`);

                const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
                const aiData = JSON.parse(cleanJson);

                // --- POST-PROCESSING & MAPPING ---
                const data = {
                    fullName: aiData.fullName || aiData.name || '',
                    aadhaarNumber: (aiData.aadhaarNumber || aiData.aadhaar_no || '').replace(/\D/g, ''),
                    phoneNumber: (aiData.phoneNumber || aiData.phone || '').replace(/\D/g, ''),
                    dob: aiData.dob || '',
                    gender: aiData.gender || '',
                    address: aiData.address || '',
                    age: aiData.age || ''
                };

                // Fallback for Aadhaar number if pattern found in raw text but not in JSON
                if (!data.aadhaarNumber || data.aadhaarNumber.length < 12) {
                    const match = rawText.match(/\d{4}[\s-]?\d{4}[\s-]?\d{4}/);
                    if (match) data.aadhaarNumber = match[0].replace(/\D/g, '');
                }

                // Fallback for Phone
                if (!data.phone || data.phone.length < 10) {
                    const match = rawText.match(/[6-9]\d{9}/) || rawText.match(/[6-9]\d{4}\s?\d{5}/);
                    if (match) data.phone = match[0].replace(/\D/g, '');
                }

                // --- AGE CALCULATION ---
                if (data.dob) {
                    try {
                        let birthYear = null;
                        if (data.dob.includes('/')) {
                            const parts = data.dob.split('/');
                            birthYear = parseInt(parts[2] || parts[0]); // Handles DD/MM/YYYY or YYYY/MM/DD
                        } else if (data.dob.length === 4 && /^\d{4}$/.test(data.dob)) {
                            birthYear = parseInt(data.dob);
                        } else {
                            const date = new Date(data.dob);
                            if (!isNaN(date.getTime())) birthYear = date.getFullYear();
                        }

                        if (birthYear && birthYear > 1900 && birthYear <= new Date().getFullYear()) {
                            data.age = (new Date().getFullYear() - birthYear).toString();
                        }
                    } catch (e) { logDebug(`Age calc error: ${e.message}`); }
                }

                // Final fallback for age: look for a year in the text if age is missing
                if (!data.age) {
                    const yearMatch = rawText.match(/\b(19|20)\d{2}\b/);
                    if (yearMatch) {
                        const year = parseInt(yearMatch[0]);
                        data.age = (new Date().getFullYear() - year).toString();
                    }
                }

                logDebug(`FINAL PARSED: ${JSON.stringify(data)}`);
                return data;

            } catch (err) {
                lastError = err;
                logDebug(`ERROR with ${modelName}: ${err.message}`);

                if (err.status === 404) break;
                if (err.status === 429) { await delay(2000); continue; }
                await delay(1000);
            }
        }
    }
    throw lastError || new Error("ID extraction failed completely.");
}

module.exports = { extractAadhaarData };
