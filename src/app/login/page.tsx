'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Heart, Mail, Lock, Chrome } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('正しいメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上です'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('ログインしました');
      router.push('/dashboard');
    } catch (err: any) {
      const code = err?.code ?? '';
      const msg =
        code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found'
          ? 'メールアドレスまたはパスワードが違います'
          : code === 'auth/too-many-requests'
          ? 'ログイン試行回数が多すぎます。しばらく時間をおいてください'
          : code === 'auth/network-request-failed'
          ? 'ネットワークエラーが発生しました。接続を確認してください'
          : code === 'auth/user-disabled'
          ? 'このアカウントは無効化されています'
          : 'ログインに失敗しました';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Googleでログインしました');
      router.push('/dashboard');
    } catch (err: any) {
      const code = err?.code ?? '';
      const msg =
        code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request'
          ? 'ログインがキャンセルされました'
          : code === 'auth/network-request-failed'
          ? 'ネットワークエラーが発生しました'
          : code === 'auth/too-many-requests'
          ? 'しばらく時間をおいてから再試行してください'
          : 'Googleログインに失敗しました';
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 radial-glow flex items-center justify-center px-4 pt-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 shadow-xl shadow-primary-500/30 mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">ログイン</h1>
          <p className="text-white/40 text-sm mt-1">婚活AI診断へようこそ</p>
        </div>

        <div className="glass rounded-3xl p-8">
          {/* Google Login */}
          <Button
            variant="outline"
            fullWidth
            onClick={handleGoogle}
            loading={googleLoading}
            className="mb-6"
            icon={<Chrome className="w-4 h-4" />}
          >
            Googleでログイン
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs text-white/30 uppercase">
              <span className="bg-transparent px-3">または</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="メールアドレス"
              type="email"
              placeholder="example@email.com"
              icon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="パスワード"
              type="password"
              placeholder="6文字以上"
              icon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="text-right">
              <Link href="/reset-password" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                パスワードをお忘れの方
              </Link>
            </div>

            <Button type="submit" fullWidth loading={loading} size="lg">
              ログイン
            </Button>
          </form>

          <p className="text-center text-sm text-white/40 mt-6">
            アカウントをお持ちでない方は{' '}
            <Link href="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              無料登録
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
