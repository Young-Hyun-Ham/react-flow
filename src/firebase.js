import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 1. .env 파일에서 Vite 환경 변수를 가져옵니다.
// Vite에서는 `import.meta.env` 객체를 통해 접근합니다.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// 2. Firebase 앱을 초기화합니다.
const app = initializeApp(firebaseConfig);

// 3. 다른 컴포넌트에서 사용할 수 있도록 Firestore 인스턴스를 초기화하고 내보냅니다.
export const db = getFirestore(app);
