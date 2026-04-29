import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  UserProfile,
  DiagnosisResult,
  FashionSuggestion,
  DatePlan,
  GeneratedProfile,
  UploadedImage,
} from '@/types';

// ============================================================
// User Profile
// ============================================================
export async function saveUserProfile(uid: string, data: Partial<UserProfile>) {
  await setDoc(
    doc(db, 'users', uid),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    ...d,
    createdAt: d.createdAt?.toDate(),
    updatedAt: d.updatedAt?.toDate(),
  } as UserProfile;
}

// ============================================================
// Diagnosis
// ============================================================
export async function saveDiagnosisResult(result: Omit<DiagnosisResult, 'id'>) {
  const ref = await addDoc(collection(db, 'diagnoses'), {
    ...result,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getDiagnosisResult(id: string): Promise<DiagnosisResult | null> {
  const snap = await getDoc(doc(db, 'diagnoses', id));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    ...d,
    createdAt: d.createdAt?.toDate(),
  } as DiagnosisResult;
}

export async function getUserDiagnoses(userId: string, limitCount = 20): Promise<DiagnosisResult[]> {
  const q = query(
    collection(db, 'diagnoses'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate(),
  })) as DiagnosisResult[];
}

// ============================================================
// Fashion Suggestions
// ============================================================
export async function saveFashionSuggestion(data: Omit<FashionSuggestion, 'id'>) {
  const ref = await addDoc(collection(db, 'fashion'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getLatestFashionSuggestion(userId: string): Promise<FashionSuggestion | null> {
  const q = query(
    collection(db, 'fashion'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return {
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate(),
  } as FashionSuggestion;
}

// ============================================================
// Date Plans
// ============================================================
export async function saveDatePlan(data: Omit<DatePlan, 'id'>) {
  const ref = await addDoc(collection(db, 'dateplans'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getUserDatePlans(userId: string): Promise<DatePlan[]> {
  const q = query(
    collection(db, 'dateplans'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(10)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate(),
  })) as DatePlan[];
}

// ============================================================
// Generated Profiles
// ============================================================
export async function saveGeneratedProfile(data: Omit<GeneratedProfile, 'id'>) {
  const ref = await addDoc(collection(db, 'profiles', data.userId, 'generated'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getLatestGeneratedProfile(userId: string): Promise<GeneratedProfile | null> {
  const q = query(
    collection(db, 'profiles', userId, 'generated'),
    orderBy('createdAt', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return {
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate(),
  } as GeneratedProfile;
}

// ============================================================
// Admin: All users
// ============================================================
export async function getAllUsers(limitCount = 100) {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

export async function getAllDiagnoses(limitCount = 100) {
  const q = query(collection(db, 'diagnoses'), orderBy('createdAt', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ============================================================
// Delete user data
// ============================================================
export async function deleteUserData(uid: string) {
  await deleteDoc(doc(db, 'users', uid));
}
