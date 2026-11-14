export interface InspectedImage {
  file: File;
  name: string;
  sizeBytes: number;
  formatLabel: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  previewUrl: string | null;
  isHeic: boolean;
  isSvg: boolean;
  hasExifMarkers: boolean;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export function detectFormatLabel(file: File): {
  label: string;
  isHeic: boolean;
  isSvg: boolean;
} {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const type = file.type.toLowerCase();

  if (ext === 'heic' || ext === 'heif' || type.includes('heic') || type.includes('heif')) {
    return { label: 'HEIC', isHeic: true, isSvg: false };
  }
  if (ext === 'svg' || type.includes('svg')) {
    return { label: 'SVG', isHeic: false, isSvg: true };
  }
  if (ext === 'webp' || type === 'image/webp') {
    return { label: 'WebP', isHeic: false, isSvg: false };
  }
  if (ext === 'png' || type === 'image/png') {
    return { label: 'PNG', isHeic: false, isSvg: false };
  }
  if (ext === 'jpg' || ext === 'jpeg' || type === 'image/jpeg') {
    return { label: 'JPG', isHeic: false, isSvg: false };
  }
  if (ext === 'gif' || type === 'image/gif') {
    return { label: 'GIF', isHeic: false, isSvg: false };
  }
  return { label: ext ? ext.toUpperCase() : 'IMG', isHeic: false, isSvg: false };
}

async function detectExifMarkers(file: File): Promise<boolean> {
  try {
    const slice = file.slice(0, 65536);
    const buffer = await slice.arrayBuffer();
    const view = new DataView(buffer);
    if (view.byteLength < 4) return false;
    // Check JPEG SOI 0xFFD8 and search for APP1 (0xFFE1) or Exif ASCII
    if (view.getUint16(0, false) === 0xffd8) {
      let offset = 2;
      while (offset + 4 < view.byteLength) {
        const marker = view.getUint16(offset, false);
        if (marker === 0xffe1) return true;
        if ((marker & 0xff00) !== 0xff00) break;
        if (marker === 0xffda) break; // SOS
        const len = view.getUint16(offset + 2, false);
        if (len < 2) break;
        offset += 2 + len;
      }
    }
    return false;
  } catch {
    return false;
  }
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image in this browser.'));
    img.src = src;
  });
}

export async function inspectImageFile(file: File): Promise<InspectedImage> {
  const { label, isHeic, isSvg } = detectFormatLabel(file);
  const hasExifMarkers = await detectExifMarkers(file);
  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await loadImageElement(objectUrl);
    return {
      file,
      name: file.name,
      sizeBytes: file.size,
      formatLabel: label,
      mimeType: file.type || `image/${label.toLowerCase()}`,
      width: img.naturalWidth || null,
      height: img.naturalHeight || null,
      previewUrl: objectUrl,
      isHeic,
      isSvg,
      hasExifMarkers,
    };
  } catch {
    // HEIC may not decode natively in Chrome/Firefox without conversion
    if (!isHeic) {
      URL.revokeObjectURL(objectUrl);
    }
    return {
      file,
      name: file.name,
      sizeBytes: file.size,
      formatLabel: label,
      mimeType: file.type || 'application/octet-stream',
      width: null,
      height: null,
      previewUrl: isHeic ? null : objectUrl,
      isHeic,
      isSvg,
      hasExifMarkers,
    };
  }
}

export async function createSampleImageFile(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  // Crisp studio architectural gradient & color test scene
  const grad = ctx.createLinearGradient(0, 0, 1600, 1000);
  grad.addColorStop(0, '#0F172A');
  grad.addColorStop(0.55, '#1E3A8A');
  grad.addColorStop(1, '#2563EB');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1600, 1000);

  // Subtle architectural grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 2;
  for (let x = 100; x < 1600; x += 100) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1000);
    ctx.stroke();
  }
  for (let y = 100; y < 1000; y += 100) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1600, y);
    ctx.stroke();
  }

  // Geometric focal circles & color calibration swatches
  ctx.fillStyle = '#ECFDF5';
  ctx.beginPath();
  ctx.arc(800, 440, 220, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#059669';
  ctx.beginPath();
  ctx.arc(800, 440, 130, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(800, 440, 48, 0, Math.PI * 2);
  ctx.fill();

  // Swatch blocks for color picker testing
  const swatches = ['#0F172A', '#2563EB', '#059669', '#F59E0B', '#E11D48', '#F8FAFC'];
  swatches.forEach((hex, idx) => {
    ctx.fillStyle = hex;
    ctx.fillRect(500 + idx * 102, 740, 88, 52);
  });

  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = 'bold 42px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SAMPLE STUDIO PHOTO · 1600 × 1000', 800, 140);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to build sample image'))),
      'image/jpeg',
      0.92
    );
  });

  return new File([blob], 'sample-studio-photo.jpg', { type: 'image/jpeg' });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))),
      mimeType,
      quality
    );
  });
}

export async function compressToExactKb(
  file: File,
  targetKb: number,
  outputFormat: 'image/jpeg' | 'image/webp' = 'image/jpeg'
): Promise<{ blob: Blob; width: number; height: number; qualityUsed: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(url);
    const targetBytes = targetKb * 1024;
    let width = img.naturalWidth;
    let height = img.naturalHeight;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    for (let scaleAttempt = 0; scaleAttempt < 6; scaleAttempt++) {
      canvas.width = Math.max(16, Math.round(width));
      canvas.height = Math.max(16, Math.round(height));
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Binary search quality between 0.08 and 0.95
      let low = 0.08;
      let high = 0.95;
      let bestBlob: Blob | null = null;
      let bestQuality = 0.5;

      for (let i = 0; i < 8; i++) {
        const mid = (low + high) / 2;
        const candidate = await canvasToBlob(canvas, outputFormat, mid);
        if (candidate.size <= targetBytes) {
          bestBlob = candidate;
          bestQuality = mid;
          low = mid;
        } else {
          high = mid;
        }
      }

      if (bestBlob) {
        return {
          blob: bestBlob,
          width: canvas.width,
          height: canvas.height,
          qualityUsed: Math.round(bestQuality * 100),
        };
      }

      // If still larger than targetBytes even at 0.08 quality, scale down dimensions by 0.72
      width *= 0.72;
      height *= 0.72;
    }

    const fallbackBlob = await canvasToBlob(canvas, outputFormat, 0.1);
    return {
      blob: fallbackBlob,
      width: canvas.width,
      height: canvas.height,
      qualityUsed: 10,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function convertImageFormat(
  file: File,
  outputFormat: 'image/jpeg' | 'image/png' | 'image/webp',
  targetWidth?: number,
  quality = 0.92
): Promise<{ blob: Blob; width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(url);
    const naturalW = img.naturalWidth || 1024;
    const naturalH = img.naturalHeight || 1024;
    const width = targetWidth && targetWidth > 0 ? targetWidth : naturalW;
    const height = Math.round((width / naturalW) * naturalH);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    if (outputFormat === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, outputFormat, quality);
    return { blob, width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function stripExifViaCanvas(
  file: File
): Promise<{ blob: Blob; width: number; height: number; mimeType: string }> {
  const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
  const mimeType: 'image/png' | 'image/jpeg' = isPng ? 'image/png' : 'image/jpeg';
  const result = await convertImageFormat(file, mimeType, undefined, 0.94);
  return { ...result, mimeType };
}

export async function createCircleCropPng(
  file: File,
  size = 512
): Promise<{ blob: Blob; width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(url);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const minSide = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - minSide) / 2;
    const sy = (img.naturalHeight - minSide) / 2;
    ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

    const blob = await canvasToBlob(canvas, 'image/png');
    return { blob, width: size, height: size };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function splitImageGrid(
  file: File,
  cols: number,
  rows: number
): Promise<{ blob: Blob; dataUrl: string; row: number; col: number }[]> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(url);
    const tileW = Math.floor(img.naturalWidth / cols);
    const tileH = Math.floor(img.naturalHeight / rows);
    const tiles: { blob: Blob; dataUrl: string; row: number; col: number }[] = [];

    const canvas = document.createElement('canvas');
    canvas.width = tileW;
    canvas.height = tileH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.clearRect(0, 0, tileW, tileH);
        ctx.drawImage(
          img,
          c * tileW,
          r * tileH,
          tileW,
          tileH,
          0,
          0,
          tileW,
          tileH
        );
        const blob = await canvasToBlob(canvas, 'image/png');
        const dataUrl = canvas.toDataURL('image/png');
        tiles.push({ blob, dataUrl, row: r + 1, col: c + 1 });
      }
    }
    return tiles;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function resizeDiscordAsset(
  file: File,
  mode: 'emoji' | 'banner'
): Promise<{ blob: Blob; width: number; height: number }> {
  const targetW = mode === 'emoji' ? 128 : 960;
  const targetH = mode === 'emoji' ? 128 : 540;
  const maxBytes = mode === 'emoji' ? 256 * 1024 : 512 * 1024;

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(url);
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    const scale = Math.max(targetW / img.naturalWidth, targetH / img.naturalHeight);
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const dx = (targetW - drawW) / 2;
    const dy = (targetH - drawH) / 2;
    ctx.drawImage(img, dx, dy, drawW, drawH);

    let blob = await canvasToBlob(canvas, 'image/png');
    if (blob.size > maxBytes) {
      blob = await canvasToBlob(canvas, 'image/webp', 0.88);
    }
    return { blob, width: targetW, height: targetH };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function generatePassportPhoto(
  file: File,
  preset: 'us-2x2' | 'uk-35x45' | 'print-4x6'
): Promise<{ blob: Blob; width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(url);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    const drawCroppedPortrait = (
      targetX: number,
      targetY: number,
      targetW: number,
      targetH: number
    ) => {
      const targetRatio = targetW / targetH;
      const srcRatio = img.naturalWidth / img.naturalHeight;
      let sx = 0;
      let sy = 0;
      let sw = img.naturalWidth;
      let sh = img.naturalHeight;
      if (srcRatio > targetRatio) {
        sw = img.naturalHeight * targetRatio;
        sx = (img.naturalWidth - sw) / 2;
      } else {
        sh = img.naturalWidth / targetRatio;
        sy = (img.naturalHeight - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, targetX, targetY, targetW, targetH);
    };

    if (preset === 'us-2x2') {
      canvas.width = 600;
      canvas.height = 600;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 600, 600);
      drawCroppedPortrait(0, 0, 600, 600);
    } else if (preset === 'uk-35x45') {
      canvas.width = 413;
      canvas.height = 531;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 413, 531);
      drawCroppedPortrait(0, 0, 413, 531);
    } else {
      // 4x6 inch sheet at 300 DPI -> 1800x1200 with 6x 2x2" portraits
      canvas.width = 1800;
      canvas.height = 1200;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 1800, 1200);
      const cell = 560;
      const gap = 25;
      const startX = (1800 - (cell * 3 + gap * 2)) / 2;
      const startY = (1200 - (cell * 2 + gap)) / 2;
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 3; c++) {
          const x = startX + c * (cell + gap);
          const y = startY + r * (cell + gap);
          drawCroppedPortrait(x, y, cell, cell);
          ctx.strokeStyle = '#CBD5E1';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, cell, cell);
        }
      }
    }

    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.95);
    return { blob, width: canvas.width, height: canvas.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to encode file to Base64'));
    reader.readAsDataURL(file);
  });
}

export async function extractDominantColors(
  file: File,
  count = 6
): Promise<{ hex: string; rgb: string }[]> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(url);
    const canvas = document.createElement('canvas');
    const sampleSize = 64;
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];
    ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
    const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

    const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 128) continue;
      // Quantize to 24-step buckets for clean grouping
      const r = Math.round(data[i] / 24) * 24;
      const g = Math.round(data[i + 1] / 24) * 24;
      const b = Math.round(data[i + 2] / 24) * 24;
      const key = `${r},${g},${b}`;
      const prev = buckets.get(key);
      if (prev) {
        prev.n += 1;
      } else {
        buckets.set(key, {
          r: Math.min(255, r),
          g: Math.min(255, g),
          b: Math.min(255, b),
          n: 1,
        });
      }
    }

    return Array.from(buckets.values())
      .sort((a, b) => b.n - a.n)
      .slice(0, count)
      .map(({ r, g, b }) => {
        const hex =
          '#' +
          [r, g, b]
            .map((v) => v.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase();
        return { hex, rgb: `rgb(${r}, ${g}, ${b})` };
      });
  } finally {
    URL.revokeObjectURL(url);
  }
}
