import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push, set, update, remove, get, off } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAnmX0ePc5HjQSuYdfZdOwRwDTyf_HL1rQ",
  authDomain: "sj-medipoint.firebaseapp.com",
  databaseURL: "https://sj-medipoint-default-rtdb.firebaseio.com",
  projectId: "sj-medipoint",
  storageBucket: "sj-medipoint.firebasestorage.app",
  messagingSenderId: "1032983983606",
  appId: "1:1032983983606:web:056e0e52b7194d2c9e03d7",
  measurementId: "G-8BN0G1E912"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

export { ref, onValue, push, set, update, remove, get, off };
