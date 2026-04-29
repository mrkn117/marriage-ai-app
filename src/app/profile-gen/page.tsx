'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserCircle,
  Copy,
  CheckCircle,
  Sparkles,
  Loader2,
  Star,
  MessageSquare,
  Camera,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import type { GeneratedProfile } from '@/types';

export default function ProfileGenPage() {
  const { user, userProfile } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [profile, setProfile] = useState<GeneratedProfile | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!userProfile?.age) {
      toast.error('先にプロフィールを設定してください');
      return;
    }
    setGenerating(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile: { ...userProfile, uid: user!.uid },
        }),
      });
      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      setProfile(data);
      toast.success('プロフィールを生成しました！');
    } catch (err) {
      toast.error('生成に失敗しました');
    } finally {
      setGenerating(false);
    }
  };

  const copyText = (text: string, section: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSection(section);
      toast.success('コピーしました');
      setTimeout(() => setCopiedSection(null), 2000);
    });
  };

  return (
    <AuthGuard requireProfile>
      <div className="min-h-screen bg-dark-900 radial-glow pt-20 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              婚活プロフィール生成
            </h1>
            <p className="text-white/50 text-sm">
              あなたの情報をもとに、マッチングアプリで反応をもらいやすいプロフィール文を自動生成します。
            </p>
          </div>

          {!profile && (
            <Card variant="glass" className="text-center py-12 mb-6">
              <UserCircle className="w-16 h-16 text-primary-400/50 mx-auto mb-4" />
              <h3 className="text-white font-semibold text-lg mb-2">
                AIがあなたのプロフィールを作成します
              </h3>
              <p className="text-white/40 text-sm max-w-sm mx-auto mb-8">
                プロフィール設定の情報から、相手に刺さる自己紹介文・アピールポイント・
                最初のメッセージ文例を生成します
              </p>
              <Button
                size="lg"
                onClick={handleGenerate}
                loading={generating}
                className="mx-auto"
              >
                {generating ? 'AI生成中...' : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    プロフィールを生成する
                  </>
                )}
              </Button>
            </Card>
          )}

          {profile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Title */}
              <Card variant="highlighted">
                <p className="text-white/50 text-sm mb-1">プロフィールタイトル</p>
                <h2 className="text-white font-bold text-xl">{profile.title}</h2>
              </Card>

              {/* Self Introduction */}
              <Card variant="glass">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-primary-400" />
                    自己紹介文
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyText(profile.selfIntroduction, 'intro')}
                    icon={copiedSection === 'intro' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  >
                    コピー
                  </Button>
                </div>
                <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
                  {profile.selfIntroduction}
                </p>
                <p className="text-white/30 text-xs mt-2">{profile.selfIntroduction.length}文字</p>
              </Card>

              {/* Appeal Points */}
              <Card variant="glass">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  アピールポイント
                </h3>
                <div className="space-y-2">
                  {profile.appealPoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-yellow-400 text-xs font-bold">{i + 1}</span>
                      </div>
                      <p className="text-white/80 text-sm">{point}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Hobby Description */}
              <Card variant="glass">
                <h3 className="text-white font-semibold mb-3">趣味・休日の過ごし方</h3>
                <p className="text-white/80 text-sm leading-relaxed">{profile.hobbyDescription}</p>
              </Card>

              {/* Partner Preference */}
              <Card variant="glass">
                <h3 className="text-white font-semibold mb-3">求める相手像</h3>
                <p className="text-white/80 text-sm leading-relaxed">{profile.partnerPreference}</p>
              </Card>

              {/* First Message */}
              <Card variant="glass">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-400" />
                    最初のメッセージ文例
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyText(profile.messageToSend, 'msg')}
                    icon={copiedSection === 'msg' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  >
                    コピー
                  </Button>
                </div>
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
                    {profile.messageToSend}
                  </p>
                </div>
              </Card>

              {/* Photo Tips */}
              <Card variant="glass">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-400" />
                  プロフィール写真のアドバイス
                </h3>
                <div className="space-y-2">
                  {profile.profilePhotoTips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-white/70 text-sm">{tip}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Regenerate */}
              <Button
                variant="outline"
                fullWidth
                onClick={handleGenerate}
                loading={generating}
              >
                <Sparkles className="w-4 h-4" />
                再生成する
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
