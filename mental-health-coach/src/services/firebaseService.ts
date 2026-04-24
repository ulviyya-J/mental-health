import { initializeApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import dayjs from "dayjs";

// ✅ Native SDK üçün: parametrsiz initializeApp
if (!initializeApp().apps?.length) {
  initializeApp();
  console.log("✅ Firebase native SDK başladıldı (GoogleService-Info.plist oxunur)");
}

// Auth və Firestore instance-ları
const authentication = auth();
const firestoreDb = firestore();

// --- AUTH FUNKSİYALARI ---
export const loginUser = async (email: string, password: string) => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();
  const userCredential = await authentication.signInWithEmailAndPassword(cleanEmail, cleanPassword);
  return userCredential.user;
};

export const registerUser = async (email: string, password: string) => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();
  const userCredential = await authentication.createUserWithEmailAndPassword(cleanEmail, cleanPassword);
  return userCredential.user;
};

export const logoutUser = async () => {
  await authentication.signOut();
};

export const resetPassword = async (email: string) => {
  const cleanEmail = email.trim().toLowerCase();
  await authentication.sendPasswordResetEmail(cleanEmail);
  return true;
};

export const deleteUserAccount = async () => {
  const user = authentication.currentUser;
  if (user) {
    await firestoreDb.collection("users").doc(user.uid).delete();
    await user.delete();
  }
};

// --- DATA (FIRESTORE) FUNKSİYALARI ---
export const saveUserData = async (uid: string, userData: any) => {
  try {
    const finalNextTestDate = userData.nextTestDate || dayjs().toISOString();
    await firestoreDb.collection("users").doc(uid).set({
      ...userData,
      nextTestDate: finalNextTestDate,
      nextTestType: 'projective_a',
      isFirstDualTestDone: false,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("Save user data error:", error);
    throw error;
  }
};

export const getUserData = async (uid: string) => {
  const userDocSnap = await firestoreDb.collection("users").doc(uid).get();
  return userDocSnap.exists ? userDocSnap.data() : null;
};

export const updateProfileImage = async (uid: string, imageUrl: string) => {
  try {
    await firestoreDb.collection("users").doc(uid).update({
      profileImage: imageUrl,
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error("Update profile image error:", error);
    throw error;
  }
};

export const saveAssessmentText = async (uid: string, assessmentText: string) => {
  try {
    await firestoreDb.collection("users").doc(uid).set({
      assessmentText,
      assessmentDate: new Date().toISOString(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("Save assessment error:", error);
    throw error;
  }
};

export const saveTestResult = async (uid: string, testData: any) => {
  try {
    await firestoreDb.collection("users").doc(uid).update({
      psychologicalTests: firestore.FieldValue.arrayUnion({
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
  await firestoreDb.collection("users").doc(uid).update({
    nextTestDate: newDate
  });
};

export const updateLastTestDate = async (uid: string, date: Date) => {
  try {
    await firestoreDb.collection("users").doc(uid).update({
      lastTestDate: date.toISOString()
    });
  } catch (error) {
    console.error("Update last test date error:", error);
  }
};

export const getLastTestDate = async (uid: string): Promise<Date | null> => {
  try {
    const userDoc = await firestoreDb.collection("users").doc(uid).get();
    const data = userDoc.data();
    return data?.lastTestDate ? new Date(data.lastTestDate) : null;
  } catch (error) {
    return null;
  }
};

export const updateNextTestType = async (uid: string, nextType: string) => {
  try {
    await firestoreDb.collection("users").doc(uid).update({
      nextTestType: nextType
    });
  } catch (error) {
    console.error("Update next test type error:", error);
  }
};

export const getNextTestType = async (uid: string): Promise<string> => {
  try {
    const userDoc = await firestoreDb.collection("users").doc(uid).get();
    return userDoc.data()?.nextTestType || 'projective_a';
  } catch (error) {
    return 'projective_a';
  }
};

export const saveJournalNote = async (uid: string, noteText: string) => {
  const userRef = firestoreDb.collection("users").doc(uid);
  const userDoc = await userRef.get();
  let updatedNotes = noteText;
  if (userDoc.exists) {
    const currentNotes = userDoc.data()?.dailyJournalAccumulator || "";
    updatedNotes = currentNotes ? `${currentNotes}\n${noteText}` : noteText;
  }
  await userRef.set({
    dailyJournalAccumulator: updatedNotes,
    lastNoteTimestamp: firestore.FieldValue.serverTimestamp()
  }, { merge: true });
};

export const startAISessionUpdate = async (uid: string) => {
  await firestoreDb.collection("users").doc(uid).update({
    lastSessionTimestamp: firestore.FieldValue.serverTimestamp(),
    dailyJournalAccumulator: ""
  });
};

// --- BİLDİRİŞ (NOTIFICATION) FUNKSİYALARI ---
export const addNotification = async (uid: string, notification: { title: string; body: string; screen?: string | null }) => {
  try {
    await firestoreDb.collection("users").doc(uid).collection("notifications").add({
      ...notification,
      timestamp: new Date().toISOString(),
      read: false,
    });
  } catch (error) {
    console.error("Add notification error:", error);
  }
};

export const getNotifications = async (uid: string) => {
  try {
    const snapshot = await firestoreDb.collection("users").doc(uid).collection("notifications")
      .orderBy("timestamp", "desc").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    return [];
  }
};

export const deleteNotification = async (uid: string, notificationId: string) => {
  try {
    await firestoreDb.collection("users").doc(uid).collection("notifications").doc(notificationId).delete();
  } catch (error) {
    console.error("Delete notification error:", error);
  }
};

export const getUnreadCount = async (uid: string): Promise<number> => {
  try {
    const snapshot = await firestoreDb.collection("users").doc(uid).collection("notifications")
      .where("read", "==", false).get();
    return snapshot.size;
  } catch (error) {
    return 0;
  }
};

export const markAllAsRead = async (uid: string) => {
  try {
    const snapshot = await firestoreDb.collection("users").doc(uid).collection("notifications")
      .where("read", "==", false).get();
    const batch = firestoreDb.batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });
    await batch.commit();
  } catch (error) {
    console.error("Mark all as read error:", error);
  }
};

export { authentication as auth };