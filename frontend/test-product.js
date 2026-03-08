import { readFileSync } from 'fs';
import { resolve } from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  try {
    const docSnap = await getDoc(doc(db, 'products', 'aQIW235rnoWaOcJWafzY'));
    if (docSnap.exists()) {
      console.log('Product:', docSnap.data().name);
      console.log('Seller ID:', docSnap.data().sellerId);
      
      const sellerId = docSnap.data().sellerId;
      if (sellerId) {
          const sellerSnap = await getDoc(doc(db, 'sellers', sellerId));
          console.log('Seller Doc Exists:', sellerSnap.exists());
          if (sellerSnap.exists()) {
              console.log('Seller Status:', sellerSnap.data().sellerStatus);
              console.log('Seller Category:', sellerSnap.data().category);
              console.log('Seller Shop Name:', sellerSnap.data().shopName);
          }
      }
    } else {
      console.log('No such product!');
    }
  } catch(e) {
    console.error(e);
  }
}

check();
