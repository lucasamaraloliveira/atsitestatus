import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";

// IMPORTANTE: Substitua pelos seus dados do console do Firebase
// IMPORTANTE: Use variáveis de ambiente para segurança (Vercel/Local)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

// Inicializa o Firestore com cache persistente (suporta reconexão offline e múltiplas abas)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence); // Garante que a sessão se mantenha após recarregar abas

export const googleProvider = new GoogleAuthProvider();
