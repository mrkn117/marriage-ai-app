'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireProfile?: boolean;
}

export function AuthGuard({ children, requireProfile = false }: AuthGuardProps) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (requireProfile && !userProfile?.age) {
      router.push('/onboarding');
    }
  }, [user, userProfile, loading, router, requireProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-primary-500/20"></div>
            <Loader2 className="w-16 h-16 text-primary-500 animate-spin absolute inset-0" />
          </div>
          <p className="text-white/40 text-sm">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;
  if (requireProfile && !userProfile?.age) return null;

  return <>{children}</>;
}
