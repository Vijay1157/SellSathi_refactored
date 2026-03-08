require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase Admin (adjust path to service account if needed, or use default app if env is set)
// Assuming we are running this in the backend directory where process.env works
if (!admin.apps.length) {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function checkUser(uid) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            console.log("User Document Data:", userDoc.data());
        } else {
            console.log("User document not found for UID:", uid);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

checkUser('AOiXmhIJtTUZugxlY3ajx3JmJsW2');
