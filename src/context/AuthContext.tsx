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
  signInAnonymously,
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
      if (!firebaseUser) {
        // Auto sign in anonymously
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.error('Anonymous sign in failed:', e);
          setLoading(false);
        }
        return;
      }
      setUser(firebaseUser);
      try {
        const profile = await Promise.race([
          getUserProfile(firebaseUser.uid),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('Profile load timeout')), 8_000)
          ),
        ]);
        setUserProfile(profile);
      } catch (e) {
        console.error('Failed to load profile:', e);
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
    try {
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
    } catch (e) {
      console.error('Failed to save Google profile:', e);
    }
  };

  const register = async (email: string, password: string, nickname: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: nickname });
    try {
      await saveUserProfile(result.user.uid, {
        uid: result.user.uid,
        email,
        nickname,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Partial<UserProfile>);
    } catch (e) {
      console.error('Failed to save profile after register:', e);
    }
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
    try {
      const updated = await Promise.race([
        getUserProfile(user.uid),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Profile fetch timeout')), 8_000)
        ),
      ]);
      setUserProfile(updated);
    } catch (e) {
      console.error('Failed to refresh profile after update:', e);
    }
  };

  const deleteAccount = async () => {
    if (!user) throw new Error('Not authenticated');
    await deleteUserData(user.uid);
    await deleteUser(user);
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    } catch (e) {
      console.error('Failed to refresh profile:', e);
    }
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
