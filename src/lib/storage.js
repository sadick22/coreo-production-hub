import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyARbPucKQEcaGScfy6OkxVPlhEDm553AcQ",
  authDomain: "coreo-production-hub.firebaseapp.com",
  projectId: "coreo-production-hub",
  storageBucket: "coreo-production-hub.firebasestorage.app",
  messagingSenderId: "815032334935",
  appId: "1:815032334935:web:a7691fc77d3bc804750112"
});

const db = getFirestore(app);

export const storage = {
  async get(key) {
    try {
      const snap = await getDoc(doc(db, "hub", key));
      if (!snap.exists()) return null;
      return { value: snap.data().value };
    } catch (e) {
      console.error("storage.get error:", e);
      return null;
    }
  },
  async set(key, value) {
    try {
      await setDoc(doc(db, "hub", key), { value });
      return { value };
    } catch (e) {
      console.error("storage.set error:", e);
      return null;
    }
  },
};
