'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, BarChart2, AlertTriangle, Loader2, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card } from '@/components/ui/Card';
import { formatDate, getScoreLevel } from '@/lib/utils';

interface AdminData {
  users: any[];
  diagnoses: any[];
}

export default function AdminPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.email) {
      setLoading(false);
      setError('管理者権限が必要です');
      return;
    }
    const email = user.email;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    fetch('/api/admin', {
      headers: { 'x-admin-email': email },
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error(`アクセス拒否（HTTP ${r.status}）`);
        return r.json();
      })
      .then(setData)
      .catch((err: any) => {
        if (err?.name === 'AbortError') return;
        setError(err?.message ?? '読み込みに失敗しました');
      })
      .finally(() => {
        clearTimeout(timer);
        setLoading(false);
      });
    return () => { controller.abort(); clearTimeout(timer); };
  }, [user]);

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-dark-900 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
          <div className="text-center">
            <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-white font-bold text-xl mb-2">アクセス拒否</h2>
            <p className="text-white/50 text-sm">管理者権限が必要です</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const avgScore = data?.diagnoses?.length
    ? Math.round(
        (data.diagnoses?.reduce((sum: number, d: any) => sum + (d.scores?.total ?? 0), 0) ?? 0) /
        data.diagnoses.length
      )
    : 0;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-dark-900 radial-glow pt-20 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">管理画面</h1>
            <p className="text-white/40 text-sm">婚活AI診断 管理ダッシュボード</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: '総ユーザー数', value: data?.users?.length ?? 0, icon: Users, color: 'text-blue-400' },
              { label: '総診断数', value: data?.diagnoses?.length ?? 0, icon: BarChart2, color: 'text-green-400' },
              { label: '平均スコア', value: `${avgScore}点`, icon: BarChart2, color: 'text-yellow-400' },
              {
                label: '低スコア（<50）',
                value: data?.diagnoses?.filter((d: any) => (d.scores?.total ?? 0) < 50).length ?? 0,
                icon: AlertTriangle,
                color: 'text-red-400'
              },
            ].map((stat) => (
              <Card key={stat.label} variant="glass">
                <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-white/40 text-xs">{stat.label}</p>
              </Card>
            ))}
          </div>

          {/* Recent Diagnoses */}
          <Card variant="glass" className="mb-6">
            <h2 className="text-white font-bold text-lg mb-4">最近の診断</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/40 text-xs">
                    <th className="text-left pb-3 pr-4">ユーザーID</th>
                    <th className="text-left pb-3 pr-4">スコア</th>
                    <th className="text-left pb-3 pr-4">ランク</th>
                    <th className="text-left pb-3">日時</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(data?.diagnoses ?? []).slice(0, 20).map((d: any) => {
                    const level = getScoreLevel(d.scores?.total ?? 0);
                    return (
                      <tr key={d.id} className="text-white/70">
                        <td className="py-2.5 pr-4 font-mono text-xs">
                          {d.userId?.slice(0, 12)}...
                        </td>
                        <td className="py-2.5 pr-4 font-bold">{d.scores?.total ?? '—'}点</td>
                        <td className={`py-2.5 pr-4 font-bold ${level.color}`}>{level.label}</td>
                        <td className="py-2.5 text-white/40 text-xs">
                          {d.createdAt?.seconds
                            ? formatDate(new Date(d.createdAt.seconds * 1000))
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Recent Users */}
          <Card variant="glass">
            <h2 className="text-white font-bold text-lg mb-4">登録ユーザー</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/40 text-xs">
                    <th className="text-left pb-3 pr-4">UID</th>
                    <th className="text-left pb-3 pr-4">ニックネーム</th>
                    <th className="text-left pb-3 pr-4">性別/年齢</th>
                    <th className="text-left pb-3">登録日</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(data?.users ?? []).slice(0, 20).map((u: any) => (
                    <tr key={u.uid} className="text-white/70">
                      <td className="py-2.5 pr-4 font-mono text-xs">{u.uid?.slice(0, 12)}...</td>
                      <td className="py-2.5 pr-4">{u.nickname ?? '—'}</td>
                      <td className="py-2.5 pr-4">
                        {u.gender === 'male' ? '男性' : u.gender === 'female' ? '女性' : u.gender ?? '—'}
                        {u.age ? ` / ${u.age}歳` : ''}
                      </td>
                      <td className="py-2.5 text-white/40 text-xs">
                        {u.createdAt?.seconds
                          ? formatDate(new Date(u.createdAt.seconds * 1000))
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
