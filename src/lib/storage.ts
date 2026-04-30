export type ImageType = 'face' | 'full-body' | 'side' | 'back' | 'angle' | 'expression';

export interface UploadProgress {
  progress: number;
  url?: string;
  error?: string;
}

// Compress image to JPEG (max 800px, q=0.82) and sanitize base64 for OpenAI
function compressImage(file: File, maxPx = 800, quality = 0.82): Promise<string> {
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

      // Request JPEG; some browsers may produce PNG — both are fine for OpenAI
      let dataUrl = canvas.toDataURL('image/jpeg', quality);

      // Sanitize: strip any whitespace from the base64 payload
      const comma = dataUrl.indexOf(',');
      if (comma !== -1) {
        const header = dataUrl.slice(0, comma + 1);
        const payload = dataUrl.slice(comma + 1).replace(/\s+/g, '');
        dataUrl = header + payload;
      }

      // Validate that we got a supported format
      const supported = ['data:image/jpeg;base64,', 'data:image/png;base64,', 'data:image/webp;base64,'];
      const ok = supported.some((p) => dataUrl.startsWith(p)) && dataUrl.length > 200;
      if (!ok) {
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

export async function deleteImage(_storagePath: string): Promise<void> {
  // No-op: images are base64, nothing to delete
}

export function getStoragePathFromUrl(_url: string): string {
  return '';
}
