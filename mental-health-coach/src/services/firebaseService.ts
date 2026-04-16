// services/firebaseService.ts (DÜZƏLDİLMİŞ - isFirstDualTestDone ƏLAVƏ EDİLDİ)
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  initializeAuth,
  getReactNativePersistence,
  getAuth,
  signOut
} from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  getDoc,
  serverTimestamp,
  deleteDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  writeBatch
} from "firebase/firestore";
import dayjs from "dayjs";

const firebaseConfig = {
  apiKey: "AIzaSyDYmc1wJuG77Rnvec8811Ltv1fG83UsEok",
  authDomain: "mental-health-coach-19f5b.firebaseapp.com",
  projectId: "mental-health-coach-19f5b",
  storageBucket: "mental-health-coach-19f5b.firebasestorage.app",
  messagingSenderId: "686867171752",
  appId: "1:686867171752:web:ef2c5daab3ec49f2dab59d",
  measurementId: "G-5GTHMVSENE",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: any;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} catch (e) {
  auth = getAuth(app);
}

let db: any;
try {
  db = getFirestore(app);
} catch (e) {
  db = initializeFirestore(app, {
    localCache: memoryLocalCache()
  });
}

// --- AUTH FUNKSİYALARI ---
export const loginUser = async (email: string, password: string) => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();
  const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
  return userCredential.user;
};

export const registerUser = async (email: string, password: string) => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();
  const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
  return userCredential.user;
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const resetPassword = async (email: string) => {
  const cleanEmail = email.trim().toLowerCase();
  await sendPasswordResetEmail(auth, cleanEmail);
  return true;
};

export const deleteUserAccount = async () => {
  const user = auth.currentUser;
  if (user) {
    await deleteDoc(doc(db, "users", user.uid));
    await user.delete();
  }
};

// --- DATA FUNKSİYALARI ---
export const saveUserData = async (uid: string, userData: any) => {
  try {
    const finalNextTestDate = userData.nextTestDate || dayjs().toISOString();
    await setDoc(doc(db, "users", uid), {
      ...userData,
      nextTestDate: finalNextTestDate,
      nextTestType: 'projective_a',
      isFirstDualTestDone: false, // ✅ İkili test edilməyib
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("Save user data error:", error);
    throw error;
  }
};

export const getUserData = async (uid: string) => {
  const userDocSnap = await getDoc(doc(db, "users", uid));
  return userDocSnap.exists() ? userDocSnap.data() : null;
};

export const updateProfileImage = async (uid: string, imageUrl: string) => {
  try {
    await updateDoc(doc(db, "users", uid), {
      profileImage: imageUrl,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Update profile image error:", error);
    throw error;
  }
};

export const saveAssessmentText = async (uid: string, assessmentText: string) => {
  try {
    await setDoc(doc(db, "users", uid), {
      assessmentText,
      assessmentDate: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error("Save assessment error:", error);
    throw error;
  }
};

export const saveTestResult = async (uid: string, testData: any) => {
  try {
    await updateDoc(doc(db, "users", uid), {
      psychologicalTests: arrayUnion({
        ...testData,
        createdAt: dayjs().toISOString(),
      }),
    });
  } catch (error) {
    console.error("Save test result error:", error);
    throw error;
  }
};

export const updateNextTestDate = async (uid: string, amount: number = 1, unit: 'hour' | 'minute' = 'minute') => {
  const newDate = dayjs().add(amount, unit).toISOString();
  await updateDoc(doc(db, "users", uid), {
    nextTestDate: newDate
  });
};

export const updateLastTestDate = async (uid: string, date: Date) => {
  try {
    await updateDoc(doc(db, "users", uid), {
      lastTestDate: date.toISOString()
    });
    console.log(`✅ Son test tarixi yeniləndi: ${date.toISOString()}`);
  } catch (error) {
    console.error("Update last test date error:", error);
  }
};

export const getLastTestDate = async (uid: string): Promise<Date | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    const data = userDoc.data();
    return data?.lastTestDate ? new Date(data.lastTestDate) : null;
  } catch (error) {
    console.error("Get last test date error:", error);
    return null;
  }
};

export const updateNextTestType = async (uid: string, nextType: 'projective_a' | 'projective_b' | 'imagination_slider') => {
  try {
    await updateDoc(doc(db, "users", uid), {
      nextTestType: nextType
    });
    console.log(`✅ Növbəti test tipi yeniləndi: ${nextType}`);
  } catch (error) {
    console.error("Update next test type error:", error);
  }
};

export const getNextTestType = async (uid: string): Promise<'projective_a' | 'projective_b' | 'imagination_slider'> => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    const data = userDoc.data();
    return data?.nextTestType || 'projective_a';
  } catch (error) {
    console.error("Get next test type error:", error);
    return 'projective_a';
  }
};

export const saveJournalNote = async (uid: string, noteText: string) => {
  const userRef = doc(db, "users", uid);
  const userDoc = await getDoc(userRef);
  let updatedNotes = noteText;
  if (userDoc.exists()) {
    const currentNotes = userDoc.data().dailyJournalAccumulator || "";
    updatedNotes = currentNotes ? `${currentNotes}\n${noteText}` : noteText;
  }
  await setDoc(userRef, {
    dailyJournalAccumulator: updatedNotes,
    lastNoteTimestamp: serverTimestamp()
  }, { merge: true });
};

export const startAISessionUpdate = async (uid: string) => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    lastSessionTimestamp: serverTimestamp(),
    dailyJournalAccumulator: ""
  });
};

// --- BİLDİRİŞ FUNKSİYALARI ---
export const addNotification = async (uid: string, notification: {
  title: string;
  body: string;
  screen?: string;
}) => {
  try {
    await addDoc(collection(db, "users", uid, "notifications"), {
      ...notification,
      timestamp: new Date().toISOString(),
      read: false,
    });
    console.log("✅ Bildiriş Firestore-a əlavə edildi");
  } catch (error) {
    console.error("Add notification error:", error);
  }
};

// services/firebaseService.ts (YALNIZ bu hissəni dəyiş)

export const getNotifications = async (uid: string) => {
  try {
    const q = query(
      collection(db, "users", uid, "notifications"),
      orderBy("timestamp", "desc")
    );
    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("📦 Firestore-dan oxunan bildirişlər:", notifications.length);
    return notifications;
  } catch (error) {
    console.error("Get notifications error:", error);
    return [];
  }
};

export const deleteNotification = async (uid: string, notificationId: string) => {
  try {
    await deleteDoc(doc(db, "users", uid, "notifications", notificationId));
    console.log("✅ Bildiriş silindi");
  } catch (error) {
    console.error("Delete notification error:", error);
  }
};

export const getUnreadCount = async (uid: string): Promise<number> => {
  try {
    const q = query(
      collection(db, "users", uid, "notifications"),
      where("read", "==", false)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Get unread count error:", error);
    return 0;
  }
};

export const markAllAsRead = async (uid: string) => {
  try {
    const q = query(
      collection(db, "users", uid, "notifications"),
      where("read", "==", false)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });
    await batch.commit();
    console.log("✅ Bütün bildirişlər oxundu olaraq işarələndi");
  } catch (error) {
    console.error("Mark all as read error:", error);
  }
};

export { auth, db };