'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Heart, Mail, Lock, User, Chrome, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

const schema = z.object({
  nickname: z.string().min(1, 'ニックネームを入力してください').max(20, '20文字以内で入力してください'),
  email: z.string().email('正しいメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で設定してください'),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine((v) => v, '利用規約への同意が必要です'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerAuth, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await registerAuth(data.email, data.password, data.nickname);
      toast.success('登録が完了しました！');
      router.push('/onboarding');
    } catch (err: any) {
      const code = err?.code ?? '';
      const msg =
        code === 'auth/email-already-in-use'
          ? 'このメールアドレスは既に登録されています'
          : code === 'auth/weak-password'
          ? 'パスワードが弱すぎます。8文字以上で設定してください'
          : code === 'auth/invalid-email'
          ? 'メールアドレスの形式が正しくありません'
          : code === 'auth/network-request-failed'
          ? 'ネットワークエラーが発生しました。接続を確認してください'
          : '登録に失敗しました。もう一度お試しください';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      toast.success('登録しました！');
      router.push('/onboarding');
    } catch (err: any) {
      const code = err?.code ?? '';
      const msg =
        code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request'
          ? '登録がキャンセルされました'
          : code === 'auth/network-request-failed'
          ? 'ネットワークエラーが発生しました'
          : 'Google登録に失敗しました';
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 radial-glow flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 shadow-xl shadow-primary-500/30 mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">無料登録</h1>
          <p className="text-white/40 text-sm mt-1">AI婚活診断を始めましょう</p>
        </div>

        <div className="glass rounded-3xl p-8">
          <Button
            variant="outline"
            fullWidth
            onClick={handleGoogle}
            loading={googleLoading}
            className="mb-6"
            icon={<Chrome className="w-4 h-4" />}
          >
            Googleで登録
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs text-white/30 uppercase">
              <span className="bg-transparent px-3">または</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="ニックネーム"
              type="text"
              placeholder="例：たろう"
              icon={<User className="w-4 h-4" />}
              error={errors.nickname?.message}
              hint="アプリ内で表示される名前です"
              {...register('nickname')}
            />
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
              placeholder="8文字以上"
              icon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="パスワード（確認）"
              type="password"
              placeholder="パスワードを再入力"
              icon={<Lock className="w-4 h-4" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {/* Terms agreement */}
            <div className="flex items-start gap-3 pt-1">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  id="terms"
                  className="sr-only"
                  {...register('agreeToTerms')}
                />
                <label
                  htmlFor="terms"
                  className="flex items-center justify-center w-5 h-5 rounded border border-white/20 bg-white/5 cursor-pointer hover:border-primary-500/50 transition-colors"
                >
                  {watch('agreeToTerms') && <CheckCircle className="w-3.5 h-3.5 text-primary-400" />}
                </label>
              </div>
              <label htmlFor="terms" className="text-sm text-white/60 cursor-pointer leading-snug">
                <Link href="/terms" className="text-primary-400 hover:underline">利用規約</Link>
                {' '}および{' '}
                <Link href="/privacy" className="text-primary-400 hover:underline">プライバシーポリシー</Link>
                {' '}に同意します
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="text-xs text-red-400">{errors.agreeToTerms.message}</p>
            )}

            <Button type="submit" fullWidth loading={loading} size="lg">
              無料で登録する
            </Button>
          </form>

          <p className="text-center text-sm text-white/40 mt-6">
            すでにアカウントをお持ちの方は{' '}
            <Link href="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
