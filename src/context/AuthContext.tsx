'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { saveUserProfile, getUserProfile, deleteUserData } from '@/lib/firestore';
import type { UserProfile } from '@/types';

interface AuthContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
        } catch (e) {
          console.error('Failed to load profile:', e);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const profile = await getUserProfile(result.user.uid);
    if (!profile) {
      await saveUserProfile(result.user.uid, {
        uid: result.user.uid,
        email: result.user.email ?? '',
        nickname: result.user.displayName ?? 'ユーザー',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Partial<UserProfile>);
    }
  };

  const register = async (email: string, password: string, nickname: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: nickname });
    await saveUserProfile(result.user.uid, {
      uid: result.user.uid,
      email,
      nickname,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Partial<UserProfile>);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error('Not authenticated');
    await saveUserProfile(user.uid, data);
    const updated = await getUserProfile(user.uid);
    setUserProfile(updated);
  };

  const deleteAccount = async () => {
    if (!user) throw new Error('Not authenticated');
    await deleteUserData(user.uid);
    await deleteUser(user);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const profile = await getUserProfile(user.uid);
    setUserProfile(profile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        resetPassword,
        updateUserProfile,
        deleteAccount,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
