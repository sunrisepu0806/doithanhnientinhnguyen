import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Kiểm tra lỗi "Bệnh nền": Nếu thiếu API Key, báo ngay ở Console
if (!firebaseConfig.apiKey) {
  console.error("❌ LỖI: Chưa tìm thấy Firebase API Key. Phú hãy kiểm tra lại file .env.local hoặc Vercel Settings!");
}

// Khởi tạo Firebase theo mô hình Singleton của Next.js
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Khởi tạo các dịch vụ
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };