require('dotenv').config();
const admin = require('firebase-admin');

if (!admin.apps.length) {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function fixUserData(uid) {
    try {
        console.log(`Fixing user data for ${uid}...`);
        
        // 1. Give the user a name
        await db.collection('users').doc(uid).update({
            fullName: 'Vijay Customer',
            phone: '+919876543210' // Assuming standard test number
        });
        console.log('✓ Added fullName to user document');

        // 2. Fix 'Invalid Date' on orders by ensuring createdAt is a proper timestamp/string
        const ordersSnap = await db.collection('orders').where('customerId', '==', uid).get();
        const batch = db.batch();
        let orderCount = 0;
        
        ordersSnap.forEach(doc => {
            const data = doc.data();
            // In SellSathi, dates are often stored as Firestore Timestamps or ISO strings.
            // If it's missing or invalid, let's set it to now.
            if (!data.createdAt || data.createdAt === 'Invalid Date' || data.createdAt.seconds === undefined) {
                batch.update(doc.ref, { 
                    createdAt: admin.firestore.FieldValue.serverTimestamp() 
                });
                orderCount++;
            }
        });
        
        if (orderCount > 0) {
            await batch.commit();
            console.log(`✓ Fixed 'Invalid Date' for ${orderCount} orders`);
        } else {
            console.log(`✓ Order dates already valid`);
        }
        
    } catch (e) {
        console.error("Error:", e);
    }
}

fixUserData('AOiXmhIJtTUZugxlY3ajx3JmJsW2');
