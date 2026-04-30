'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import {
  Camera,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDiagnosis } from '@/context/DiagnosisContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { uploadImage } from '@/lib/storage';
import { cn, fileToBase64 } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { UploadedImage } from '@/types';
import type { ImageType } from '@/lib/storage';

const imageSlots: { type: ImageType; label: string; desc: string; required: boolean }[] = [
  { type: 'face', label: '顔写真', desc: '正面・明るい場所', required: true },
  { type: 'full-body', label: '全身（正面）', desc: '頭から足まで', required: true },
  { type: 'side', label: '全身（横）', desc: '横からの全身', required: false },
  { type: 'back', label: '後ろ姿', desc: '後ろからの全身', required: false },
  { type: 'angle', label: '斜め', desc: '斜め前からの写真', required: false },
  { type: 'expression', label: '表情違い', desc: '笑顔・自然な表情', required: false },
];

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
  const [activeSlot, setActiveSlot] = useState<ImageType | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[], type: ImageType) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const preview = URL.createObjectURL(file);
      setSlots((prev) => ({
        ...prev,
        [type]: { type, file, preview, uploading: true, uploaded: false },
      }));

      try {
        const url = await uploadImage(file, user!.uid, type, (progress) => {
          // Progress tracking if needed
        });
        setSlots((prev) => ({
          ...prev,
          [type]: { ...prev[type]!, uploading: false, uploaded: true, url },
        }));
        toast.success(`${imageSlots.find((s) => s.type === type)?.label}をアップロードしました`);
      } catch (err) {
        setSlots((prev) => ({
          ...prev,
          [type]: { ...prev[type]!, uploading: false, error: 'アップロード失敗' },
        }));
        toast.error('アップロードに失敗しました');
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
    const abortTimer = setTimeout(() => controller.abort(), 62_000); // client-side safety net
    try {
      const imageUrls = Object.values(slots)
        .filter((s) => s?.uploaded && s.url)
        .map((s) => s!.url!);

      // Safety: measure total base64 size before fetch (iOS Safari has a ~512KB limit)
      const totalBytes = imageUrls.reduce((sum, url) => sum + url.length, 0);
      if (totalBytes > 400_000) {
        throw new Error(
          `画像データが大きすぎます（${Math.round(totalBytes / 1024)}KB）。` +
          '写真を撮り直すか、別の写真をお試しください。'
        );
      }

      // Serialize body separately so we can catch stringify errors
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

      // Fetch with explicit error handling for network-level failures
      let response: Response;
      try {
        response = await fetch('/api/diagnose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: bodyStr,
          signal: controller.signal,
        });
      } catch (fetchErr: any) {
        if ((fetchErr as any)?.name === 'AbortError') {
          throw new Error('AI分析がタイムアウトしました。しばらく後に再試行してください。');
        }
        const msg = fetchErr?.message ?? String(fetchErr);
        throw new Error(`通信エラーが発生しました。ネットワークを確認してください。（${msg}）`);
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
          } catch {
            // Server returned non-JSON (e.g., Vercel HTML error page)
          }
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
          userId: user!.uid,
          url: s!.url!,
          storagePath: '',
          type: s!.type,
          uploadedAt: new Date(),
        }));
      setUploadedImages(uploadedImages);

      toast.success('診断が完了しました！');
      router.push(`/diagnosis?id=${result.id}`);
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
              AIが複数の角度から分析します。明るい場所で撮影した写真を使用してください。
            </p>
          </div>

          {/* Notice */}
          <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-300 font-medium">解析対象について</p>
              <p className="text-blue-400/70 mt-0.5">
                顔・全身・姿勢・体型・表情・清潔感を分析します。<strong>服装・ファッションは評価しません</strong>（別機能）。
              </p>
            </div>
          </div>

          {/* Image Slots Grid */}
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

          {/* Upload progress */}
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

          {/* Actions */}
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

          {diagnosing && (
            <div className="mt-6 p-5 rounded-2xl bg-primary-500/5 border border-primary-500/20">
              <div className="flex items-center gap-3 mb-3">
                <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
                <span className="text-white font-medium">AIが分析中です...</span>
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
          // Show preview
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

      {/* Remove button */}
      {slotData && !slotData.uploading && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-400 transition-colors z-10"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      )}
    </div>
  );
}
