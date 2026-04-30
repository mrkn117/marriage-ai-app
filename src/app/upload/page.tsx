'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import {
  Camera,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Info,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDiagnosis } from '@/context/DiagnosisContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { uploadImage } from '@/lib/storage';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { UploadedImage } from '@/types';
import type { ImageType } from '@/lib/storage';

const imageSlots: { type: ImageType; label: string; desc: string; required: boolean }[] = [
  { type: 'face',       label: '顔写真',     desc: '正面・明るい場所',   required: true  },
  { type: 'full-body',  label: '全身（正面）', desc: '頭から足まで',       required: true  },
  { type: 'side',       label: '全身（横）',   desc: '横からの全身',       required: false },
  { type: 'back',       label: '後ろ姿',       desc: '後ろからの全身',     required: false },
  { type: 'angle',      label: '斜め',         desc: '斜め前からの写真',   required: false },
  { type: 'expression', label: '表情違い',     desc: '笑顔・自然な表情',   required: false },
];

const photoRules = {
  ng: [
    '複数人が写っている（本人のみにしてください）',
    'サングラス・マスク・帽子で顔が隠れている',
    '加工・フィルター使用（美肌・目拡大など）',
    '暗所・逆光・ピンボケ写真',
    '集合写真・遠景（顔が小さすぎる）',
    'スクリーンショットや画面を再撮影したもの',
  ],
  ok: [
    '自然光など明るい場所で撮影',
    '顔が鮮明に写っている（正面推奨）',
    '全身は頭から足まで入っている',
    '加工なし・ありのままの状態',
    'JPEG・PNG・WebP形式（10MB以下）',
  ],
};

interface SlotFile {
  type: ImageType;
  file: File;
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  url?: string;
  error?: string;
}

export default function UploadPage() {
  const { user, userProfile } = useAuth();
  const { setUploadedImages, setCurrentDiagnosis } = useDiagnosis();
  const router = useRouter();
  const [slots, setSlots] = useState<Partial<Record<ImageType, SlotFile>>>({});
  const [diagnosing, setDiagnosing] = useState(false);
  const slotsRef = useRef(slots);
  slotsRef.current = slots;

  // Revoke all ObjectURLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      Object.values(slotsRef.current).forEach((s) => {
        if (s?.preview) URL.revokeObjectURL(s.preview);
      });
    };
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[], type: ImageType) => {
      const file = acceptedFiles[0];
      if (!file) return;

      let preview: string;
      try {
        preview = URL.createObjectURL(file);
      } catch {
        toast.error('画像ファイルの読み込みに失敗しました');
        return;
      }

      setSlots((prev) => ({
        ...prev,
        [type]: { type, file, preview, uploading: true, uploaded: false },
      }));

      try {
        const url = await uploadImage(file, user?.uid ?? '', type);
        setSlots((prev) => ({
          ...prev,
          [type]: { ...prev[type]!, uploading: false, uploaded: true, url },
        }));
        toast.success(`${imageSlots.find((s) => s.type === type)?.label}をアップロードしました`);
      } catch (err: any) {
        const msg = err?.message ?? 'アップロードに失敗しました';
        setSlots((prev) => ({
          ...prev,
          [type]: { ...prev[type]!, uploading: false, error: msg },
        }));
        toast.error(msg);
      }
    },
    [user]
  );

  const removeSlot = (type: ImageType) => {
    setSlots((prev) => {
      const next = { ...prev };
      if (next[type]?.preview) URL.revokeObjectURL(next[type]!.preview);
      delete next[type];
      return next;
    });
  };

  const uploadedCount = Object.values(slots).filter((s) => s?.uploaded).length;
  const requiredUploaded = imageSlots
    .filter((s) => s.required)
    .every((s) => slots[s.type]?.uploaded);

  const handleDiagnose = async () => {
    if (!requiredUploaded) {
      toast.error('顔写真と全身写真（正面）は必須です');
      return;
    }
    if (!userProfile?.age) {
      toast.error('先にプロフィールを設定してください');
      router.push('/onboarding');
      return;
    }

    setDiagnosing(true);
    const controller = new AbortController();
    const abortTimer = setTimeout(() => controller.abort(), 62_000);
    try {
      const imageUrls = Object.values(slots)
        .filter((s) => s?.uploaded && s.url)
        .map((s) => s!.url!);

      const totalBytes = imageUrls.reduce((sum, url) => sum + url.length, 0);
      if (totalBytes > 400_000) {
        throw new Error(
          `画像データが大きすぎます（${Math.round(totalBytes / 1024)}KB）。` +
          '写真を撮り直すか、別の写真をお試しください。'
        );
      }

      let bodyStr: string;
      try {
        bodyStr = JSON.stringify({
          userProfile,
          imageUrls,
          currentDate: new Date().toISOString().split('T')[0],
        });
      } catch {
        throw new Error('リクエストのシリアライズに失敗しました。');
      }

      let response: Response;
      try {
        response = await fetch('/api/diagnose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: bodyStr,
          signal: controller.signal,
        });
      } catch (fetchErr: any) {
        if (fetchErr?.name === 'AbortError') {
          throw new Error('AI分析がタイムアウトしました。しばらく後に再試行してください。');
        }
        throw new Error(`通信エラーが発生しました。ネットワークを確認してください。（${fetchErr?.message ?? ''}）`);
      }

      if (!response.ok) {
        const status = response.status;
        let errMsg: string;
        if (status === 504 || status === 524 || status === 408) {
          errMsg = 'AI分析がタイムアウトしました。しばらく後に再試行してください。';
        } else {
          errMsg = `診断に失敗しました（HTTP ${status}）`;
          try {
            const errJson = await response.json();
            if (errJson?.error) errMsg = errJson.error;
          } catch { /* non-JSON error page */ }
        }
        throw new Error(errMsg);
      }

      let result: any;
      try {
        result = await response.json();
      } catch {
        throw new Error('サーバーの返答を解析できませんでした。再度お試しください。');
      }

      setCurrentDiagnosis(result);

      const uploadedImages: UploadedImage[] = Object.values(slots)
        .filter((s) => s?.uploaded)
        .map((s) => ({
          id: `${s!.type}_${Date.now()}`,
          userId: user?.uid ?? '',
          url: s!.url!,
          storagePath: '',
          type: s!.type,
          uploadedAt: new Date(),
        }));
      setUploadedImages(uploadedImages);

      toast.success('診断が完了しました！');
      router.push(result?.id ? `/diagnosis?id=${result.id}` : '/diagnosis');
    } catch (err: any) {
      toast.error(err.message || '診断に失敗しました。もう一度お試しください');
    } finally {
      clearTimeout(abortTimer);
      setDiagnosing(false);
    }
  };

  return (
    <AuthGuard requireProfile>
      <div className="min-h-screen bg-dark-900 radial-glow pt-20 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">写真をアップロード</h1>
            <p className="text-white/50">
              AIが複数の角度から分析します。下記の注意事項をよく読んでから写真を選択してください。
            </p>
          </div>

          {/* ── 写真の注意事項 ── */}
          <Card variant="glass" className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <h2 className="text-white font-semibold">写真の注意事項</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* NG */}
              <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                <p className="text-red-300 font-medium text-xs mb-2 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> NG（精度が下がる・拒否される場合あり）
                </p>
                <ul className="space-y-1.5">
                  {photoRules.ng.map((rule, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                      <span className="text-red-400 font-bold flex-shrink-0 mt-0.5">✗</span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>

              {/* OK */}
              <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                <p className="text-green-300 font-medium text-xs mb-2 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> OK（推奨）
                </p>
                <ul className="space-y-1.5">
                  {photoRules.ok.map((rule, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                      <span className="text-green-400 font-bold flex-shrink-0 mt-0.5">✓</span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* AI分析対象の説明 */}
            <div className="mt-4 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300/80 leading-relaxed">
                AIは<strong className="text-blue-300">顔・全身・姿勢・体型・表情・清潔感</strong>を分析します。
                <strong className="text-blue-300">服装・ファッションは評価対象外</strong>です（別機能で対応）。
                写真はサーバーに保存されず、診断後に破棄されます。
              </p>
            </div>
          </Card>

          {/* ── 写真スロット ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {imageSlots.map((slot) => {
              const slotData = slots[slot.type];
              return (
                <DropZoneSlot
                  key={slot.type}
                  slot={slot}
                  slotData={slotData}
                  onDrop={(files) => onDrop(files, slot.type)}
                  onRemove={() => removeSlot(slot.type)}
                />
              );
            })}
          </div>

          {/* アップロード進捗バー */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${(uploadedCount / imageSlots.length) * 100}%` }}
              />
            </div>
            <span className="text-white/50 text-sm flex-shrink-0">
              {uploadedCount} / {imageSlots.length}
            </span>
          </div>

          {/* 診断ボタン */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="text-sm text-white/40">
              {requiredUploaded ? (
                <span className="flex items-center gap-1.5 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  必須写真のアップロード完了
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  顔写真・全身写真（正面）は必須です
                </span>
              )}
            </div>
            <div className="sm:ml-auto">
              <Button
                size="lg"
                onClick={handleDiagnose}
                loading={diagnosing}
                disabled={!requiredUploaded}
                className="min-w-[180px]"
              >
                {diagnosing ? 'AI分析中...' : 'AI診断を開始'}
                {!diagnosing && <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* 分析中インジケーター */}
          {diagnosing && (
            <div className="mt-6 p-5 rounded-2xl bg-primary-500/5 border border-primary-500/20">
              <div className="flex items-center gap-3 mb-3">
                <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
                <span className="text-white font-medium">AIが分析中です（最大60秒かかります）</span>
              </div>
              <div className="space-y-1.5 text-sm text-white/40">
                <p>・顔まわりの印象を解析中</p>
                <p>・清潔感・姿勢・体型を評価中</p>
                <p>・婚活市場での競争力を算出中</p>
                <p>・個別改善提案を生成中</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

interface DropZoneSlotProps {
  slot: { type: ImageType; label: string; desc: string; required: boolean };
  slotData?: SlotFile;
  onDrop: (files: File[]) => void;
  onRemove: () => void;
}

function DropZoneSlot({ slot, slotData, onDrop, onRemove }: DropZoneSlotProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: (rejections) => {
      const first = rejections[0];
      if (!first) return;
      const isTooLarge = first.errors.some((e) => e.code === 'file-too-large');
      const isWrongType = first.errors.some((e) => e.code === 'file-invalid-type');
      if (isTooLarge) toast.error('ファイルサイズが大きすぎます（上限10MB）');
      else if (isWrongType) toast.error('JPEG・PNG・WebP形式の画像を選択してください');
      else toast.error('この画像は使用できません');
    },
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: !!slotData?.uploaded,
  });

  return (
    <div className="relative">
      <div
        {...getRootProps()}
        className={cn(
          'aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 overflow-hidden',
          slotData?.uploaded
            ? 'border-green-500/30 bg-green-500/5'
            : slotData?.error
            ? 'border-red-500/30 bg-red-500/5'
            : isDragActive
            ? 'border-primary-500 bg-primary-500/10 dropzone-active'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
        )}
      >
        <input {...getInputProps()} />

        {slotData?.preview ? (
          <div className="absolute inset-0">
            <img
              src={slotData.preview}
              alt={slot.label}
              className="w-full h-full object-cover"
            />
            {slotData.uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
            {slotData.uploaded && (
              <div className="absolute top-2 right-2">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow">
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            )}
            {slotData.error && (
              <div className="absolute inset-0 bg-red-900/60 flex flex-col items-center justify-center p-2">
                <XCircle className="w-6 h-6 text-red-300 mb-1" />
                <p className="text-red-200 text-xs text-center leading-tight">{slotData.error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-3">
            <Camera className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-white/60 text-xs font-medium">{slot.label}</p>
            <p className="text-white/30 text-xs mt-0.5">{slot.desc}</p>
            {slot.required && (
              <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400">
                必須
              </span>
            )}
          </div>
        )}
      </div>

      {/* 削除ボタン */}
      {slotData && !slotData.uploading && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-400 transition-colors z-10"
          aria-label="削除"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      )}
    </div>
  );
}
