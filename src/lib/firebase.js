import { initializeApp } from 'firebase/app'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCsz7pF8FAfnLhwceasjn-s9qwih-RnGj4",
  authDomain: "plantsourcing-app.firebaseapp.com",
  projectId: "plantsourcing-app",
  storageBucket: "plantsourcing-app.firebasestorage.app",
  messagingSenderId: "417344730126",
  appId: "1:417344730126:web:f722c9c14d0cc0419af85f"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firestore with offline persistence
export const db = getFirestore(app)

// Enable offline persistence
enableIndexedDbPersistence(db)
  .then(() => {
    console.log('✅ Firestore offline persistence enabled')
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('⚠️ Offline persistence failed: multiple tabs open')
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️ Offline persistence not supported by browser')
    }
  })

// Initialize Auth
export const auth = getAuth(app)

export default app
