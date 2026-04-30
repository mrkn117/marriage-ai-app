export type ImageType = 'face' | 'full-body' | 'side' | 'back' | 'angle' | 'expression';

export interface UploadProgress {
  progress: number;
  url?: string;
  error?: string;
}

// Convert file to base64 data URL (no Firebase Storage needed)
export async function uploadImage(
  file: File,
  userId: string,
  imageType: ImageType,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress?.(Math.round((e.loaded / e.total) * 100));
      }
    };
    reader.onload = () => {
      onProgress?.(100);
      resolve(reader.result as string);
    };
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
    reader.readAsDataURL(file);
  });
}

export async function deleteImage(storagePath: string): Promise<void> {
  // No-op: images are base64, nothing to delete
}

export function getStoragePathFromUrl(url: string): string {
  return '';
}
