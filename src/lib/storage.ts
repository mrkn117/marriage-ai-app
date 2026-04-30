export type ImageType = 'face' | 'full-body' | 'side' | 'back' | 'angle' | 'expression';

export interface UploadProgress {
  progress: number;
  url?: string;
  error?: string;
}

// iOS Safari has a fetch body size limit (~512KB).
// Keep max 512px so that 2 images stay comfortably under 200KB total.
function compressImage(file: File, maxPx = 512, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const { naturalWidth: w, naturalHeight: h } = img;

      if (!w || !h) {
        reject(new Error('画像サイズが無効です'));
        return;
      }

      const scale = Math.min(1, maxPx / Math.max(w, h));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Produce JPEG; strip whitespace from base64 payload
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      const comma = dataUrl.indexOf(',');
      if (comma !== -1) {
        dataUrl =
          dataUrl.slice(0, comma + 1) +
          dataUrl.slice(comma + 1).replace(/\s+/g, '');
      }

      const supported = ['data:image/jpeg;base64,', 'data:image/png;base64,', 'data:image/webp;base64,'];
      if (!supported.some((p) => dataUrl.startsWith(p)) || dataUrl.length < 200) {
        reject(new Error('画像の変換に失敗しました（JPEG/PNG/WebPのみ対応）'));
        return;
      }

      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('画像を読み込めませんでした'));
    };

    img.src = objectUrl;
  });
}

export async function uploadImage(
  file: File,
  userId: string,
  imageType: ImageType,
  onProgress?: (progress: number) => void
): Promise<string> {
  onProgress?.(10);
  const dataUrl = await compressImage(file);
  onProgress?.(100);
  return dataUrl;
}

export async function deleteImage(_storagePath: string): Promise<void> { /* no-op */ }
export function getStoragePathFromUrl(_url: string): string { return ''; }
