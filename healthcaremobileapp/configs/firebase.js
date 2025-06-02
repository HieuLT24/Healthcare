import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// import { getAuth } from 'firebase/auth';

// Cấu hình Firebase - Bạn cần thay thế bằng config từ Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDPO-cEP_OwIahWyKBL6O4KO7OnHFg8KME",
  authDomain: "healthcare-chat-82e04.firebaseapp.com",
  projectId: "healthcare-chat-82e04",
  storageBucket: "healthcare-chat-82e04.firebasestorage.app",
  messagingSenderId: "861407425904",
  appId: "1:861407425904:android:b1adda4734c6610f1b0bb5"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo Firestore Database
export const db = getFirestore(app);

// Khởi tạo Firebase Auth
// export const auth = getAuth(app);

// export default app; 