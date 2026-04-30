'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  Heart,
  LogOut,
  User,
  History,
  Shirt,
  MapPin,
  LayoutDashboard,
  Menu,
  X,
  Settings,
  ChevronDown,
} from 'lucide-react';

const navItems = [
  { href: '/diagnosis', label: '診断', icon: Heart },
  { href: '/fashion', label: '服装提案', icon: Shirt },
  { href: '/dateplan', label: 'デートプラン', icon: MapPin },
  { href: '/history', label: '履歴', icon: History },
];

export function Header() {
  const { user, userProfile, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (!user) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm hidden sm:block">
              婚活AI診断
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  pathname.startsWith(href)
                    ? 'bg-primary-500/15 text-primary-300'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Profile */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 text-white/80 hover:text-white"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                  {userProfile?.nickname?.[0] ?? user.email?.[0] ?? 'U'}
                </div>
                <span className="text-sm hidden sm:block max-w-[80px] truncate">
                  {userProfile?.nickname ?? 'プロフィール'}
                </span>
                <ChevronDown className="w-3 h-3 hidden sm:block" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-dark-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-3 border-b border-white/5">
                    <p className="text-white text-sm font-medium truncate">
                      {userProfile?.nickname ?? 'ユーザー'}
                    </p>
                    <p className="text-white/40 text-xs truncate">{user.email}</p>
                  </div>
                  <div className="p-1">
                    <Link
                      href="/onboarding"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                      onClick={() => setProfileOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      プロフィール設定
                    </Link>
                    {user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                        onClick={() => setProfileOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        管理画面
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 rounded-lg transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      ログアウト
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-white/60 hover:text-white"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/5 bg-dark-900/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                  pathname.startsWith(href)
                    ? 'bg-primary-500/15 text-primary-300'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )}
                onClick={() => setMenuOpen(false)}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
