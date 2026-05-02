export type ImageType = 'face' | 'full-body' | 'side' | 'back' | 'angle' | 'expression';

export interface UploadProgress {
  progress: number;
  url?: string;
  error?: string;
}

function readExifOrientation(buffer: ArrayBuffer): number {
  try {
    const view = new DataView(buffer);
    if (view.byteLength < 2 || view.getUint16(0) !== 0xFFD8) return 1;
    let offset = 2;
    while (offset + 4 <= view.byteLength) {
      const marker = view.getUint16(offset);
      offset += 2;
      if (offset + 2 > view.byteLength) break;
      const segLen = view.getUint16(offset);
      if (marker === 0xFFE1 && segLen >= 8) {
        if (
          offset + 8 <= view.byteLength &&
          view.getUint32(offset + 2) === 0x45786966 &&
          view.getUint16(offset + 6) === 0x0000
        ) {
          const tiff = offset + 8;
          if (tiff + 8 > view.byteLength) break;
          const little = view.getUint16(tiff) === 0x4949;
          const ifd0 = tiff + view.getUint32(tiff + 4, little);
          if (ifd0 + 2 > view.byteLength) break;
          const count = view.getUint16(ifd0, little);
          for (let i = 0; i < count; i++) {
            const e = ifd0 + 2 + i * 12;
            if (e + 10 > view.byteLength) break;
            if (view.getUint16(e, little) === 0x0112) {
              return view.getUint16(e + 8, little);
            }
          }
        }
        break;
      }
      if ((marker & 0xFF00) !== 0xFF00) break;
      if (segLen < 2) break;
      offset += segLen;
    }
  } catch { /* ignore */ }
  return 1;
}

// Detect HEIC by ISO Base Media ftyp box — catches .jpg-renamed HEIC files that slip past MIME checks.
async function isHeicByHeader(file: File): Promise<boolean> {
  try {
    const buf = await file.slice(0, 12).arrayBuffer();
    if (buf.byteLength < 12) return false;
    const v = new Uint8Array(buf);
    // bytes 4-7: 'ftyp' (ISO Base Media container)
    if (v[4] === 0x66 && v[5] === 0x74 && v[6] === 0x79 && v[7] === 0x70) {
      const brand = String.fromCharCode(v[8], v[9], v[10], v[11]).toLowerCase();
      return /^(heic|heix|hevc|hevx|heim|heis|hevm|hevs|mif1|msf1)/.test(brand);
    }
  } catch { /* ignore */ }
  return false;
}

// 512px at quality 0.72 keeps each image ≈15–60KB in base64 (well under the 600KB total limit)
// while providing enough resolution for GPT-4o "auto" detail analysis.
async function compressImage(file: File, maxPx = 512, quality = 0.72): Promise<string> {
  // HEIC/HEIF cannot be decoded by canvas in Chrome/Firefox/Edge — Safari auto-converts on iOS.
  const heicByMime = file.type === 'image/heic' || file.type === 'image/heif' || /\.(heic|heif)$/i.test(file.name);
  const heicByHeader = !heicByMime && await isHeicByHeader(file);
  if (heicByMime || heicByHeader) {
    throw new Error(
      'HEIC形式は非対応です。' +
      'iPhoneの場合：設定→カメラ→フォーマット→「互換性優先」に変更するとJPEGで保存されます'
    );
  }

  // Read EXIF orientation for JPEG files to fix rotation on browsers that don't auto-apply it.
  // Modern iOS Safari and Chrome 81+ auto-apply EXIF, old Android WebView does not.
  let exifOrientation = 1;
  if (file.type.includes('jpeg') || file.type === '' || /\.jpe?g$/i.test(file.name)) {
    try {
      const header = await file.slice(0, 65536).arrayBuffer();
      exifOrientation = readExifOrientation(header);
    } catch { /* ignore */ }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const { naturalWidth: rawW, naturalHeight: rawH } = img;

      if (!rawW || !rawH) {
        reject(new Error('画像サイズが無効です'));
        return;
      }

      // Orientations 5-8 require a 90°/270° rotation (width and height swap).
      // If the browser already auto-applied the EXIF rotation, naturalWidth/Height
      // reflect the display dimensions — detectable by the swap already being present.
      const exifSwaps = exifOrientation >= 5 && exifOrientation <= 8;
      const browserAutoRotated = exifSwaps && rawW < rawH;
      const applyRotation = exifOrientation > 1 && !browserAutoRotated;

      // Output (display) dimensions after any rotation correction
      const dispW = applyRotation && exifSwaps ? rawH : rawW;
      const dispH = applyRotation && exifSwaps ? rawW : rawH;
      const scale = Math.min(1, maxPx / Math.max(dispW, dispH));
      const cw = Math.round(dispW * scale);
      const ch = Math.round(dispH * scale);

      const canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('画像処理に失敗しました（Canvas未対応）'));
        return;
      }

      if (applyRotation) {
        ctx.save();
        switch (exifOrientation) {
          // Orientations 2-4: flip/rotate in-plane, no dimension swap
          case 2: ctx.translate(cw, 0);  ctx.scale(-1, 1);         break;
          case 3: ctx.translate(cw, ch); ctx.rotate(Math.PI);       break;
          case 4: ctx.translate(0, ch);  ctx.scale(1, -1);          break;
          // Orientations 5-8: 90°/270° rotations, dimensions are swapped (dispW=rawH, dispH=rawW)
          // Cases 5 and 7 (transpose/transverse) use ctx.transform — verified mathematically
          case 5: ctx.transform(0, 1, 1, 0, 0, 0);                  break;
          case 6: ctx.translate(cw, 0);  ctx.rotate(Math.PI / 2);   break;
          case 7: ctx.transform(0, -1, -1, 0, cw, ch);              break;
          case 8: ctx.translate(0, ch);  ctx.rotate(-Math.PI / 2);  break;
        }
        // For orientations 5-8 (exifSwaps), draw dimensions are swapped in rotated coord space
        ctx.drawImage(img, 0, 0, exifSwaps ? ch : cw, exifSwaps ? cw : ch);
        ctx.restore();
      } else {
        ctx.drawImage(img, 0, 0, cw, ch);
      }

      // Produce JPEG; strip whitespace from base64 payload
      let dataUrl: string;
      try {
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      } catch {
        reject(new Error('画像の変換に失敗しました。別の写真をお試しください。'));
        return;
      }
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
      reject(new Error('画像を読み込めませんでした。JPEG・PNG・WebP形式の画像をお試しください'));
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
