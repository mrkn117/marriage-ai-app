import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTaskSnapshot,
} from 'firebase/storage';
import { storage } from './firebase';

export type ImageType = 'face' | 'full-body' | 'side' | 'back' | 'angle' | 'expression';

export interface UploadProgress {
  progress: number;
  url?: string;
  error?: string;
}

export async function uploadImage(
  file: File,
  userId: string,
  imageType: ImageType,
  onProgress?: (progress: number) => void
): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const path = `users/${userId}/images/${imageType}_${timestamp}.${ext}`;
  const storageRef = ref(storage, path);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    });

    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(Math.round(progress));
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}

export async function deleteImage(storagePath: string): Promise<void> {
  const storageRef = ref(storage, storagePath);
  await deleteObject(storageRef);
}

export function getStoragePathFromUrl(url: string): string {
  const baseUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/o/`;
  const path = url.replace(baseUrl, '').split('?')[0];
  return decodeURIComponent(path);
}
