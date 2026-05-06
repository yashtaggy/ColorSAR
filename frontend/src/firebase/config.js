import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Replace with your actual Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyADPe3r4GO_MvsWJkhWMTSOuSmyTU7jL3I",
    authDomain: "colorsar-310d1.firebaseapp.com",
    projectId: "colorsar-310d1",
    storageBucket: "colorsar-310d1.firebasestorage.app",
    messagingSenderId: "169811356225",
    appId: "1:169811356225:web:dab4bbb5ed668f784ab4c0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
