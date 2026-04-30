'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Heart, Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('正しいメールアドレスを入力してください'),
});

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await resetPassword(data.email);
      setSent(true);
      toast.success('パスワードリセットメールを送信しました');
    } catch (err: any) {
      const code = err?.code ?? '';
      const msg =
        code === 'auth/user-not-found' || code === 'auth/invalid-email'
          ? 'このメールアドレスは登録されていません'
          : code === 'auth/too-many-requests'
          ? 'リクエストが多すぎます。しばらく時間をおいてください'
          : code === 'auth/network-request-failed'
          ? 'ネットワークエラーが発生しました'
          : '送信に失敗しました。メールアドレスを確認してください';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 radial-glow flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 shadow-xl shadow-primary-500/30 mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">パスワードリセット</h1>
        </div>

        <div className="glass rounded-3xl p-8">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h2 className="text-white font-bold text-lg mb-2">送信しました</h2>
              <p className="text-white/60 text-sm mb-6">
                入力したメールアドレスにリセット用のリンクを送信しました。
                メールをご確認ください。
              </p>
              <Link href="/login">
                <Button variant="outline" fullWidth>
                  <ArrowLeft className="w-4 h-4" />
                  ログインへ戻る
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <p className="text-white/60 text-sm mb-6">
                登録済みのメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="メールアドレス"
                  type="email"
                  placeholder="example@email.com"
                  icon={<Mail className="w-4 h-4" />}
                  error={errors.email?.message}
                  {...register('email')}
                />
                <Button type="submit" fullWidth loading={loading}>
                  リセットメールを送信
                </Button>
              </form>
              <div className="text-center mt-4">
                <Link href="/login" className="text-sm text-white/40 hover:text-white/70 transition-colors inline-flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> ログインへ戻る
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
