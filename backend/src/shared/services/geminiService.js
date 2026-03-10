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

    const prompt = `You are a professional Indian Identity Document OCR system. Analyze this Aadhaar Card image:
    1. EXTRACT "name": The person's full name in English.
    2. EXTRACT "aadhaar_no": The 12-digit number (format: XXXX XXXX XXXX or similar). Search all parts of the image.
    3. EXTRACT "dob": Date of Birth. If full date (DD/MM/YYYY) is missing, find "Year of Birth" (YYYY) and return it.
    4. EXTRACT "gender": MALE or FEMALE.
    5. EXTRACT "address": Full address including Pincode.
    6. EXTRACT "phone": Any 10-digit mobile number.
    
    IMPORTANT: If the front side is uploaded, name and Aadhaar number are easy. If the back side is uploaded, address and phone are available.
    Return valid JSON.`;

    const ocrSchema = {
        type: SchemaType.OBJECT,
        properties: {
            name: { type: SchemaType.STRING, description: "Full name on the card" },
            aadhaar_no: { type: SchemaType.STRING, description: "12 digit number" },
            dob: { type: SchemaType.STRING, description: "DD/MM/YYYY or YYYY" },
            gender: { type: SchemaType.STRING },
            address: { type: SchemaType.STRING },
            pincode: { type: SchemaType.STRING },
            phone: { type: SchemaType.STRING }
        },
        required: ["name"]
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
                    name: aiData.name || '',
                    aadharNumber: (aiData.aadhaar_no || '').replace(/\D/g, ''),
                    phone: (aiData.phone || '').replace(/\D/g, ''),
                    phoneNumber: (aiData.phone || '').replace(/\D/g, ''),
                    dob: aiData.dob || '',
                    gender: aiData.gender || '',
                    address: aiData.address || '',
                    pincode: aiData.pincode || '',
                    age: ''
                };

                // Fallback for Aadhaar number if pattern found in raw text but not in JSON
                if (!data.aadharNumber || data.aadharNumber.length < 12) {
                    const match = rawText.match(/\d{4}[\s-]?\d{4}[\s-]?\d{4}/);
                    if (match) data.aadharNumber = match[0].replace(/\D/g, '');
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
