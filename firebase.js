// ============================================
// MOBILE STORE — FIREBASE CONFIGURATION
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAnalytics
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================
// FIREBASE CONFIG
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyDJtBCrc4tMrlod2Cz282_qWHLO6-etiRs", 
  authDomain: "mobile-store-3453d.firebaseapp.com",
  projectId: "mobile-store-3453d",
  storageBucket: "mobile-store-3453d.firebasestorage.app",
  messagingSenderId: "832138417240",
  appId: "1:832138417240:web:9a38f5b0542238a788662d",
  measurementId: "G-4F931CDMEL"
};


// ============================================
// INITIALIZE FIREBASE
// ============================================

const app = initializeApp(firebaseConfig);


// ============================================
// GOOGLE ANALYTICS
// ============================================

const analytics = getAnalytics(app);


// ============================================
// FIRESTORE
// ============================================

const db = getFirestore(app);


// ============================================
// EXPORT
// ============================================

export {
  app,
  analytics,
  db,

  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,

  collection,
  addDoc,

  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,

  serverTimestamp,
  increment
};