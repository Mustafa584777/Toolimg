import {
  canvasToBlob,
  compressToExactKb,
  loadImageElement,
} from '@/lib/image-processor';

export interface ProcessedImageResult {
  blob: Blob;
  width: number;
  height: number;
  ext: string;
  note?: string;
}

async function loadImageFromFile(file: File): Promise<{
  img: HTMLImageElement;
  cleanup: () => void;
}> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(url);
    return { img, cleanup: () => URL.revokeObjectURL(url) };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

export async function processCroppedImage(params: {
  file: File;
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  format: 'image/png' | 'image/jpeg' | 'image/webp';
}): Promise<ProcessedImageResult> {
  const { img, cleanup } = await loadImageFromFile(params.file);
  try {
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    const sx = Math.max(0, Math.round((params.xPct / 100) * natW));
    const sy = Math.max(0, Math.round((params.yPct / 100) * natH));
    const sw = Math.max(1, Math.min(natW - sx, Math.round((params.wPct / 100) * natW)));
    const sh = Math.max(1, Math.min(natH - sy, Math.round((params.hPct / 100) * natH)));

    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    if (params.format === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, sw, sh);
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    const blob = await canvasToBlob(canvas, params.format, 0.92);
    const ext =
      params.format === 'image/png' ? 'png' : params.format === 'image/webp' ? 'webp' : 'jpg';
    return { blob, width: sw, height: sh, ext };
  } finally {
    cleanup();
  }
}

export async function resizeBatchImages(params: {
  files: File[];
  mode: 'scale' | 'width';
  scalePct: number;
  targetWidth: number;
  format: 'image/jpeg' | 'image/png' | 'image/webp';
}): Promise<Array<{ name: string; blob: Blob; width: number; height: number; ext: string }>> {
  const results: Array<{
    name: string;
    blob: Blob;
    width: number;
    height: number;
    ext: string;
  }> = [];

  for (const file of params.files) {
    const { img, cleanup } = await loadImageFromFile(file);
    try {
      const natW = img.naturalWidth;
      const natH = img.naturalHeight;
      const w =
        params.mode === 'scale'
          ? Math.max(1, Math.round((natW * params.scalePct) / 100))
          : Math.max(1, params.targetWidth);
      const h = Math.max(1, Math.round((w / natW) * natH));

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      if (params.format === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(img, 0, 0, w, h);
      const blob = await canvasToBlob(canvas, params.format, 0.9);
      const ext =
        params.format === 'image/png'
          ? 'png'
          : params.format === 'image/webp'
          ? 'webp'
          : 'jpg';
      const baseName = file.name.replace(/\.[^.]+$/, '');
      results.push({
        name: `${baseName}-${w}x${h}.${ext}`,
        blob,
        width: w,
        height: h,
        ext,
      });
    } finally {
      cleanup();
    }
  }
  return results;
}

export async function removeBackgroundSmart(params: {
  file: File;
  tolerance: number;
  mode: 'edge-sample' | 'white-paper';
}): Promise<ProcessedImageResult> {
  const { img, cleanup } = await loadImageFromFile(params.file);
  try {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.drawImage(img, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    let bgR = 255;
    let bgG = 255;
    let bgB = 255;

    if (params.mode === 'edge-sample') {
      const sampleCoords = [
        [0, 0],
        [w - 1, 0],
        [0, h - 1],
        [w - 1, h - 1],
      ];
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      for (const [sx, sy] of sampleCoords) {
        const idx = (sy * w + sx) * 4;
        sumR += data[idx];
        sumG += data[idx + 1];
        sumB += data[idx + 2];
      }
      bgR = Math.round(sumR / 4);
      bgG = Math.round(sumG / 4);
      bgB = Math.round(sumB / 4);
    }

    const tol = params.tolerance * 2.2;
    const feather = tol * 0.35;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (params.mode === 'white-paper') {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const threshold = 255 - params.tolerance * 2;
        if (lum >= threshold) {
          data[i + 3] = 0;
        } else {
          data[i] = Math.max(0, Math.round(r * 0.7));
          data[i + 1] = Math.max(0, Math.round(g * 0.7));
          data[i + 2] = Math.max(0, Math.round(b * 0.7));
        }
      } else {
        const dist = Math.hypot(r - bgR, g - bgG, b - bgB);
        if (dist <= tol) {
          data[i + 3] = 0;
        } else if (dist <= tol + feather) {
          const factor = (dist - tol) / Math.max(1, feather);
          data[i + 3] = Math.round(data[i + 3] * factor);
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    const blob = await canvasToBlob(canvas, 'image/png');
    return { blob, width: w, height: h, ext: 'png', note: 'Transparent PNG cutout' };
  } finally {
    cleanup();
  }
}

export function applyUnsharpMask(
  imageData: ImageData,
  amount: number
): ImageData {
  const { width, height, data } = imageData;
  const out = new Uint8ClampedArray(data);
  const strength = Math.max(0, Math.min(2.5, amount));

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const center = data[idx + c];
        const neighbors =
          (data[((y - 1) * width + x) * 4 + c] +
            data[((y + 1) * width + x) * 4 + c] +
            data[(y * width + (x - 1)) * 4 + c] +
            data[(y * width + (x + 1)) * 4 + c]) *
          0.25;
        const sharpened = center + (center - neighbors) * strength;
        out[idx + c] = Math.max(0, Math.min(255, Math.round(sharpened)));
      }
    }
  }

  return new ImageData(out, width, height);
}

export async function upscaleAndSharpenImage(params: {
  file: File;
  scale: 2 | 4;
  sharpness: number;
}): Promise<ProcessedImageResult> {
  const { img, cleanup } = await loadImageFromFile(params.file);
  try {
    const maxAllowed = 4096;
    const rawW = img.naturalWidth * params.scale;
    const rawH = img.naturalHeight * params.scale;
    const cap = Math.min(1, maxAllowed / Math.max(rawW, rawH));
    const w = Math.max(1, Math.round(rawW * cap));
    const h = Math.max(1, Math.round(rawH * cap));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);

    if (params.sharpness > 0) {
      const imgData = ctx.getImageData(0, 0, w, h);
      const sharpened = applyUnsharpMask(imgData, params.sharpness);
      ctx.putImageData(sharpened, 0, 0);
    }

    const blob = await canvasToBlob(canvas, 'image/png');
    return { blob, width: w, height: h, ext: 'png', note: `${params.scale}x HD Upscale` };
  } finally {
    cleanup();
  }
}

export async function addTextWatermark(params: {
  file: File;
  text: string;
  opacity: number;
  fontSize: number;
  color: string;
  layout: 'bottom-right' | 'center' | 'tiled';
}): Promise<ProcessedImageResult> {
  const { img, cleanup } = await loadImageFromFile(params.file);
  try {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.drawImage(img, 0, 0, w, h);

    const label = params.text.trim() || 'toolimg.online';
    const scaledSize = Math.max(14, Math.round((params.fontSize / 100) * Math.min(w, h) * 0.12));
    ctx.save();
    ctx.globalAlpha = Math.max(0.05, Math.min(1, params.opacity));
    ctx.fillStyle = params.color;
    ctx.font = `700 ${scaledSize}px system-ui, sans-serif`;
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 4;

    if (params.layout === 'bottom-right') {
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, w - Math.round(w * 0.04), h - Math.round(h * 0.04));
    } else if (params.layout === 'center') {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, w / 2, h / 2);
    } else {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-Math.PI / 6);
      const stepX = Math.max(160, scaledSize * label.length * 0.85);
      const stepY = Math.max(110, scaledSize * 3.2);
      for (let y = -h; y <= h; y += stepY) {
        for (let x = -w; x <= w; x += stepX) {
          ctx.fillText(label, x, y);
        }
      }
    }
    ctx.restore();

    const blob = await canvasToBlob(canvas, 'image/png');
    return { blob, width: w, height: h, ext: 'png' };
  } finally {
    cleanup();
  }
}

export async function processRegionEffect(params: {
  file: File;
  effect: 'blur' | 'pixelate' | 'inpaint';
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  strength: number;
}): Promise<ProcessedImageResult> {
  const { img, cleanup } = await loadImageFromFile(params.file);
  try {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.drawImage(img, 0, 0, w, h);

    const rx = Math.max(0, Math.round((params.xPct / 100) * w));
    const ry = Math.max(0, Math.round((params.yPct / 100) * h));
    const rw = Math.max(4, Math.min(w - rx, Math.round((params.wPct / 100) * w)));
    const rh = Math.max(4, Math.min(h - ry, Math.round((params.hPct / 100) * h)));

    if (params.effect === 'blur') {
      ctx.save();
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      ctx.clip();
      ctx.filter = `blur(${Math.max(4, params.strength)}px)`;
      ctx.drawImage(img, 0, 0, w, h);
      ctx.restore();
    } else if (params.effect === 'pixelate') {
      const block = Math.max(6, params.strength);
      const temp = document.createElement('canvas');
      temp.width = Math.max(1, Math.round(rw / block));
      temp.height = Math.max(1, Math.round(rh / block));
      const tCtx = temp.getContext('2d');
      if (tCtx) {
        tCtx.drawImage(canvas, rx, ry, rw, rh, 0, 0, temp.width, temp.height);
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(temp, 0, 0, temp.width, temp.height, rx, ry, rw, rh);
        ctx.restore();
      }
    } else {
      // Neighbor edge-interpolated patch inpainting
      const fullData = ctx.getImageData(0, 0, w, h);
      const data = fullData.data;
      for (let py = ry; py < ry + rh; py++) {
        const topY = Math.max(0, ry - 2);
        const botY = Math.min(h - 1, ry + rh + 1);
        const vy = (py - ry) / Math.max(1, rh - 1);
        for (let px = rx; px < rx + rw; px++) {
          const leftX = Math.max(0, rx - 2);
          const rightX = Math.min(w - 1, rx + rw + 1);
          const vx = (px - rx) / Math.max(1, rw - 1);

          const iTop = (topY * w + px) * 4;
          const iBot = (botY * w + px) * 4;
          const iLeft = (py * w + leftX) * 4;
          const iRight = (py * w + rightX) * 4;
          const dst = (py * w + px) * 4;

          for (let c = 0; c < 3; c++) {
            const vBlend = data[iTop + c] * (1 - vy) + data[iBot + c] * vy;
            const hBlend = data[iLeft + c] * (1 - vx) + data[iRight + c] * vx;
            data[dst + c] = Math.round((vBlend + hBlend) * 0.5);
          }
        }
      }
      ctx.putImageData(fullData, 0, 0);
    }

    const blob = await canvasToBlob(canvas, 'image/png');
    return { blob, width: w, height: h, ext: 'png' };
  } finally {
    cleanup();
  }
}

export async function applyColorAndToneFilter(params: {
  file: File;
  mode:
    | 'grayscale'
    | 'bw-high'
    | 'tone'
    | 'sepia'
    | 'duotone'
    | 'denoise'
    | 'sharpen'
    | 'deuteranopia'
    | 'protanopia'
    | 'tritanopia';
  brightness?: number;
  contrast?: number;
  saturation?: number;
  intensity?: number;
  darkHex?: string;
  lightHex?: string;
}): Promise<ProcessedImageResult> {
  const { img, cleanup } = await loadImageFromFile(params.file);
  try {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    if (params.mode === 'tone') {
      ctx.filter = `brightness(${params.brightness ?? 100}%) contrast(${params.contrast ?? 100}%) saturate(${params.saturation ?? 100}%)`;
      ctx.drawImage(img, 0, 0, w, h);
    } else if (params.mode === 'grayscale' || params.mode === 'bw-high') {
      const cVal = params.mode === 'bw-high' ? 145 : params.contrast ?? 105;
      ctx.filter = `grayscale(100%) contrast(${cVal}%)`;
      ctx.drawImage(img, 0, 0, w, h);
    } else if (params.mode === 'sepia') {
      const amt = params.intensity ?? 85;
      ctx.filter = `sepia(${amt}%) contrast(105%) saturate(110%)`;
      ctx.drawImage(img, 0, 0, w, h);
      // Subtle analog film grain
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      const grain = Math.round((amt / 100) * 14);
      for (let i = 0; i < d.length; i += 4) {
        const n = ((Math.sin(i * 12.9898) * 43758.5453) % 1) * grain;
        d[i] = Math.max(0, Math.min(255, d[i] + n));
        d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
        d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
      }
      ctx.putImageData(imgData, 0, 0);
    } else if (params.mode === 'duotone') {
      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      const parseHex = (hex: string) => {
        const clean = hex.replace('#', '');
        return [
          parseInt(clean.slice(0, 2), 16) || 0,
          parseInt(clean.slice(2, 4), 16) || 0,
          parseInt(clean.slice(4, 6), 16) || 0,
        ];
      };
      const [dr, dg, db] = parseHex(params.darkHex ?? '#111827');
      const [lr, lg, lb] = parseHex(params.lightHex ?? '#F97316');
      for (let i = 0; i < d.length; i += 4) {
        const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
        d[i] = Math.round(dr + (lr - dr) * lum);
        d[i + 1] = Math.round(dg + (lg - dg) * lum);
        d[i + 2] = Math.round(db + (lb - db) * lum);
      }
      ctx.putImageData(imgData, 0, 0);
    } else if (params.mode === 'sharpen') {
      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      ctx.putImageData(applyUnsharpMask(imgData, (params.intensity ?? 60) / 50), 0, 0);
    } else if (params.mode === 'denoise') {
      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      const out = new Uint8ClampedArray(d);
      const threshold = (params.intensity ?? 50) * 0.9 + 12;
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const cIdx = (y * w + x) * 4;
          let sumR = 0;
          let sumG = 0;
          let sumB = 0;
          let wt = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nIdx = ((y + dy) * w + (x + dx)) * 4;
              const diff =
                Math.abs(d[nIdx] - d[cIdx]) +
                Math.abs(d[nIdx + 1] - d[cIdx + 1]) +
                Math.abs(d[nIdx + 2] - d[cIdx + 2]);
              if (diff <= threshold * 3) {
                sumR += d[nIdx];
                sumG += d[nIdx + 1];
                sumB += d[nIdx + 2];
                wt++;
              }
            }
          }
          if (wt > 0) {
            out[cIdx] = Math.round(sumR / wt);
            out[cIdx + 1] = Math.round(sumG / wt);
            out[cIdx + 2] = Math.round(sumB / wt);
          }
        }
      }
      ctx.putImageData(new ImageData(out, w, h), 0, 0);
    } else {
      // Color blindness LMS-derived matrices
      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      const matrices: Record<'deuteranopia' | 'protanopia' | 'tritanopia', number[]> = {
        protanopia: [0.567, 0.433, 0, 0.558, 0.442, 0, 0, 0.242, 0.758],
        deuteranopia: [0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7],
        tritanopia: [0.95, 0.05, 0, 0, 0.433, 0.567, 0, 0.475, 0.525],
      };
      const m = matrices[params.mode];
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        d[i] = Math.min(255, Math.round(r * m[0] + g * m[1] + b * m[2]));
        d[i + 1] = Math.min(255, Math.round(r * m[3] + g * m[4] + b * m[5]));
        d[i + 2] = Math.min(255, Math.round(r * m[6] + g * m[7] + b * m[8]));
      }
      ctx.putImageData(imgData, 0, 0);
    }

    const blob = await canvasToBlob(canvas, 'image/png');
    return { blob, width: w, height: h, ext: 'png' };
  } finally {
    cleanup();
  }
}

export async function transformFlipRotate(params: {
  file: File;
  rotateDeg: number;
  flipH: boolean;
  flipV: boolean;
}): Promise<ProcessedImageResult> {
  const { img, cleanup } = await loadImageFromFile(params.file);
  try {
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    const rad = (params.rotateDeg * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const outW = Math.max(1, Math.round(natW * cos + natH * sin));
    const outH = Math.max(1, Math.round(natW * sin + natH * cos));

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    ctx.translate(outW / 2, outH / 2);
    ctx.rotate(rad);
    ctx.scale(params.flipH ? -1 : 1, params.flipV ? -1 : 1);
    ctx.drawImage(img, -natW / 2, -natH / 2, natW, natH);

    const blob = await canvasToBlob(canvas, 'image/png');
    return { blob, width: outW, height: outH, ext: 'png' };
  } finally {
    cleanup();
  }
}

export async function applyRoundedCorners(params: {
  file: File;
  radiusPx: number;
}): Promise<ProcessedImageResult> {
  const { img, cleanup } = await loadImageFromFile(params.file);
  try {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const r = Math.min(Math.floor(Math.min(w, h) / 2), Math.max(0, params.radiusPx));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, r);
    ctx.clip();
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await canvasToBlob(canvas, 'image/png');
    return { blob, width: w, height: h, ext: 'png' };
  } finally {
    cleanup();
  }
}

export async function applyPhotoFrame(params: {
  file: File;
  borderPx: number;
  frameColor: string;
  caption?: string;
}): Promise<ProcessedImageResult> {
  const { img, cleanup } = await loadImageFromFile(params.file);
  try {
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    const pad = Math.max(12, Math.round((params.borderPx / 100) * Math.min(natW, natH) * 0.25));
    const extraBottom = params.caption?.trim() ? Math.round(pad * 2.2) : 0;
    const outW = natW + pad * 2;
    const outH = natH + pad * 2 + extraBottom;

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    ctx.fillStyle = params.frameColor;
    ctx.fillRect(0, 0, outW, outH);
    ctx.drawImage(img, pad, pad, natW, natH);

    if (params.caption?.trim()) {
      ctx.fillStyle = params.frameColor === '#111827' ? '#F9FAFB' : '#111827';
      ctx.font = `600 ${Math.max(16, Math.round(pad * 0.85))}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(params.caption.trim(), outW / 2, pad + natH + (pad + extraBottom) / 2);
    }

    const blob = await canvasToBlob(canvas, 'image/png');
    return { blob, width: outW, height: outH, ext: 'png' };
  } finally {
    cleanup();
  }
}

export async function composeMultiImageGridOrMerge(params: {
  files: File[];
  layout: 'horizontal' | 'vertical' | 'grid-2x2';
  gap: number;
  bgColor: string;
}): Promise<ProcessedImageResult> {
  const loaded: Array<{ img: HTMLImageElement; cleanup: () => void }> = [];
  try {
    for (const f of params.files.slice(0, 6)) {
      loaded.push(await loadImageFromFile(f));
    }
    if (loaded.length === 0) throw new Error('Select at least one image');

    const gap = Math.max(0, params.gap);
    let outW = 1200;
    let outH = 800;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    if (params.layout === 'horizontal') {
      const targetH = Math.min(1200, Math.max(...loaded.map((l) => l.img.naturalHeight)));
      const widths = loaded.map((l) =>
        Math.round((l.img.naturalWidth / l.img.naturalHeight) * targetH)
      );
      outW = widths.reduce((a, b) => a + b, 0) + gap * (loaded.length + 1);
      outH = targetH + gap * 2;
      canvas.width = outW;
      canvas.height = outH;
      ctx.fillStyle = params.bgColor;
      ctx.fillRect(0, 0, outW, outH);
      let cursorX = gap;
      loaded.forEach((l, i) => {
        ctx.drawImage(l.img, cursorX, gap, widths[i], targetH);
        cursorX += widths[i] + gap;
      });
    } else if (params.layout === 'vertical') {
      const targetW = Math.min(1400, Math.max(...loaded.map((l) => l.img.naturalWidth)));
      const heights = loaded.map((l) =>
        Math.round((l.img.naturalHeight / l.img.naturalWidth) * targetW)
      );
      outW = targetW + gap * 2;
      outH = heights.reduce((a, b) => a + b, 0) + gap * (loaded.length + 1);
      canvas.width = outW;
      canvas.height = outH;
      ctx.fillStyle = params.bgColor;
      ctx.fillRect(0, 0, outW, outH);
      let cursorY = gap;
      loaded.forEach((l, i) => {
        ctx.drawImage(l.img, gap, cursorY, targetW, heights[i]);
        cursorY += heights[i] + gap;
      });
    } else {
      const cols = loaded.length <= 2 ? loaded.length : 2;
      const rows = Math.ceil(loaded.length / cols);
      const cell = 600;
      outW = cols * cell + gap * (cols + 1);
      outH = rows * cell + gap * (rows + 1);
      canvas.width = outW;
      canvas.height = outH;
      ctx.fillStyle = params.bgColor;
      ctx.fillRect(0, 0, outW, outH);
      loaded.forEach((l, idx) => {
        const c = idx % cols;
        const r = Math.floor(idx / cols);
        const dx = gap + c * (cell + gap);
        const dy = gap + r * (cell + gap);
        const scale = Math.max(cell / l.img.naturalWidth, cell / l.img.naturalHeight);
        const dw = l.img.naturalWidth * scale;
        const dh = l.img.naturalHeight * scale;
        ctx.save();
        ctx.beginPath();
        ctx.rect(dx, dy, cell, cell);
        ctx.clip();
        ctx.drawImage(l.img, dx + (cell - dw) / 2, dy + (cell - dh) / 2, dw, dh);
        ctx.restore();
      });
    }

    const blob = await canvasToBlob(canvas, 'image/png');
    return { blob, width: outW, height: outH, ext: 'png' };
  } finally {
    loaded.forEach((l) => l.cleanup());
  }
}

export async function generateMultiSizeIco(file: File): Promise<{
  icoBlob: Blob;
  sizes: number[];
}> {
  const sizes = [16, 32, 48];
  const { img, cleanup } = await loadImageFromFile(file);
  try {
    const pngChunks: Uint8Array[] = [];
    for (const s of sizes) {
      const c = document.createElement('canvas');
      c.width = s;
      c.height = s;
      const ctx = c.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, s, s);
      const b = await canvasToBlob(c, 'image/png');
      pngChunks.push(new Uint8Array(await b.arrayBuffer()));
    }

    const headerSize = 6;
    const dirSize = 16 * sizes.length;
    const totalPayload = pngChunks.reduce((acc, ch) => acc + ch.byteLength, 0);
    const out = new Uint8Array(headerSize + dirSize + totalPayload);
    const view = new DataView(out.buffer);

    view.setUint16(0, 0, true);
    view.setUint16(2, 1, true); // ICO type
    view.setUint16(4, sizes.length, true);

    let offset = headerSize + dirSize;
    sizes.forEach((s, i) => {
      const dirOff = headerSize + i * 16;
      out[dirOff] = s >= 256 ? 0 : s;
      out[dirOff + 1] = s >= 256 ? 0 : s;
      out[dirOff + 2] = 0;
      out[dirOff + 3] = 0;
      view.setUint16(dirOff + 4, 1, true);
      view.setUint16(dirOff + 6, 32, true);
      view.setUint32(dirOff + 8, pngChunks[i].byteLength, true);
      view.setUint32(dirOff + 12, offset, true);
      out.set(pngChunks[i], offset);
      offset += pngChunks[i].byteLength;
    });

    return {
      icoBlob: new Blob([out], { type: 'image/x-icon' }),
      sizes,
    };
  } finally {
    cleanup();
  }
}

export async function generatePwaIconPack(file: File): Promise<
  Array<{ size: number; filename: string; dataUrl: string; blob: Blob }>
> {
  const specs = [
    { size: 512, filename: 'icon-512x512.png' },
    { size: 192, filename: 'icon-192x192.png' },
    { size: 180, filename: 'apple-touch-icon.png' },
    { size: 48, filename: 'icon-48x48.png' },
    { size: 16, filename: 'favicon-16x16.png' },
  ];
  const { img, cleanup } = await loadImageFromFile(file);
  try {
    const out: Array<{ size: number; filename: string; dataUrl: string; blob: Blob }> = [];
    for (const sp of specs) {
      const c = document.createElement('canvas');
      c.width = sp.size;
      c.height = sp.size;
      const ctx = c.getContext('2d');
      if (!ctx) continue;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, sp.size, sp.size);
      const blob = await canvasToBlob(c, 'image/png');
      out.push({
        size: sp.size,
        filename: sp.filename,
        dataUrl: c.toDataURL('image/png'),
        blob,
      });
    }
    return out;
  } finally {
    cleanup();
  }
}

export async function buildPdfFromImages(params: {
  files: File[];
  pageSize: 'a4' | 'letter' | 'fit';
}): Promise<Blob> {
  const pageDims: Array<{
    jpeg: Uint8Array;
    imgW: number;
    imgH: number;
    pageW: number;
    pageH: number;
  }> = [];

  for (const f of params.files) {
    const { img, cleanup } = await loadImageFromFile(f);
    try {
      const natW = img.naturalWidth;
      const natH = img.naturalHeight;
      const maxEdge = 1800;
      const scale = Math.min(1, maxEdge / Math.max(natW, natH));
      const w = Math.max(1, Math.round(natW * scale));
      const h = Math.max(1, Math.round(natH * scale));
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const jpegBlob = await canvasToBlob(c, 'image/jpeg', 0.9);
      const jpeg = new Uint8Array(await jpegBlob.arrayBuffer());

      const pageW =
        params.pageSize === 'a4' ? 595 : params.pageSize === 'letter' ? 612 : w;
      const pageH =
        params.pageSize === 'a4' ? 842 : params.pageSize === 'letter' ? 792 : h;
      pageDims.push({ jpeg, imgW: w, imgH: h, pageW, pageH });
    } finally {
      cleanup();
    }
  }

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let cursor = 0;

  const pushStr = (s: string) => {
    const bytes = encoder.encode(s);
    chunks.push(bytes);
    cursor += bytes.byteLength;
  };
  const pushBytes = (b: Uint8Array) => {
    chunks.push(b);
    cursor += b.byteLength;
  };

  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  const pageObjIds = pageDims.map((_, idx) => 3 + idx * 3);

  // 1: Catalog
  offsets[1] = cursor;
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // 2: Pages
  offsets[2] = cursor;
  pushStr(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageDims.length} >>\nendobj\n`
  );

  pageDims.forEach((p, idx) => {
    const pageId = 3 + idx * 3;
    const imgId = 4 + idx * 3;
    const contentId = 5 + idx * 3;

    const margin = params.pageSize === 'fit' ? 0 : 28;
    const availW = p.pageW - margin * 2;
    const availH = p.pageH - margin * 2;
    const ratio = Math.min(availW / p.imgW, availH / p.imgH);
    const drawW = +(p.imgW * ratio).toFixed(2);
    const drawH = +(p.imgH * ratio).toFixed(2);
    const drawX = +((p.pageW - drawW) / 2).toFixed(2);
    const drawY = +((p.pageH - drawH) / 2).toFixed(2);

    const streamStr = `q\n${drawW} 0 0 ${drawH} ${drawX} ${drawY} cm\n/Im0 Do\nQ\n`;

    offsets[pageId] = cursor;
    pushStr(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${p.pageW} ${p.pageH}] /Resources << /XObject << /Im0 ${imgId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`
    );

    offsets[imgId] = cursor;
    pushStr(
      `${imgId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p.imgW} /Height ${p.imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.byteLength} >>\nstream\n`
    );
    pushBytes(p.jpeg);
    pushStr('\nendstream\nendobj\n');

    offsets[contentId] = cursor;
    pushStr(
      `${contentId} 0 obj\n<< /Length ${streamStr.length} >>\nstream\n${streamStr}endstream\nendobj\n`
    );
  });

  const xrefStart = cursor;
  const totalObjs = 2 + pageDims.length * 3 + 1;
  pushStr(`xref\n0 ${totalObjs}\n0000000000 65535 f \n`);
  for (let id = 1; id < totalObjs; id++) {
    pushStr(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
  }
  pushStr(
    `trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  );

  const finalLen = chunks.reduce((a, b) => a + b.byteLength, 0);
  const merged = new Uint8Array(finalLen);
  let pos = 0;
  for (const ch of chunks) {
    merged.set(ch, pos);
    pos += ch.byteLength;
  }

  return new Blob([merged], { type: 'application/pdf' });
}

export async function extractImagesFromPdfOrRaw(
  file: File
): Promise<Array<{ blob: Blob; dataUrl: string; width: number; height: number }>> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const candidates: Uint8Array[] = [];

  for (let i = 0; i < bytes.length - 4; i++) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xd8 && bytes[i + 2] === 0xff) {
      for (let j = i + 4; j < bytes.length - 1; j++) {
        if (bytes[j] === 0xff && bytes[j + 1] === 0xd9) {
          const slice = bytes.slice(i, j + 2);
          if (slice.byteLength >= 4096) {
            candidates.push(slice);
          }
          i = j + 2;
          break;
        }
      }
    }
  }

  const out: Array<{ blob: Blob; dataUrl: string; width: number; height: number }> = [];
  for (const slice of candidates.slice(0, 24)) {
    const rawBlob = new Blob([new Uint8Array(slice)], { type: 'image/jpeg' });
    const url = URL.createObjectURL(rawBlob);
    try {
      const img = await loadImageElement(url);
      if (img.naturalWidth >= 80 && img.naturalHeight >= 80) {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const pngBlob = await canvasToBlob(c, 'image/png');
          out.push({
            blob: pngBlob,
            dataUrl: c.toDataURL('image/png'),
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        }
      }
    } catch {
      // Skip malformed stream
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  return out;
}

// Pure TypeScript GIF89a LZW Animated GIF Encoder (3-3-2 palette)
function lzwEncodeGif(indices: Uint8Array, minCodeSize = 8): Uint8Array {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  let nextCode = eoiCode + 1;
  let codeSize = minCodeSize + 1;

  const outBytes: number[] = [];
  let bitBuffer = 0;
  let bitCount = 0;

  const writeCode = (code: number) => {
    bitBuffer |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) {
      outBytes.push(bitBuffer & 0xff);
      bitBuffer >>= 8;
      bitCount -= 8;
    }
  };

  let dict = new Map<number, number>();
  const resetDict = () => {
    dict = new Map<number, number>();
    nextCode = eoiCode + 1;
    codeSize = minCodeSize + 1;
  };

  writeCode(clearCode);
  let prefix = indices[0] ?? 0;

  for (let i = 1; i < indices.length; i++) {
    const k = indices[i];
    const key = (prefix << 8) | k;
    const hit = dict.get(key);
    if (hit !== undefined) {
      prefix = hit;
    } else {
      writeCode(prefix);
      if (nextCode < 4096) {
        dict.set(key, nextCode++);
        if (nextCode > 1 << codeSize && codeSize < 12) {
          codeSize++;
        }
      } else {
        writeCode(clearCode);
        resetDict();
      }
      prefix = k;
    }
  }
  writeCode(prefix);
  writeCode(eoiCode);
  if (bitCount > 0) {
    outBytes.push(bitBuffer & 0xff);
  }

  // Split into <= 255 byte GIF sub-blocks
  const blocks: number[] = [minCodeSize];
  for (let i = 0; i < outBytes.length; i += 255) {
    const sub = outBytes.slice(i, i + 255);
    blocks.push(sub.length, ...sub);
  }
  blocks.push(0); // block terminator
  return new Uint8Array(blocks);
}

export async function buildAnimatedGif(params: {
  files: File[];
  delayMs: number;
  maxWidth: number;
}): Promise<ProcessedImageResult> {
  if (params.files.length === 0) throw new Error('Add at least one frame');

  const firstLoaded = await loadImageFromFile(params.files[0]);
  const w = Math.min(params.maxWidth, firstLoaded.img.naturalWidth);
  const h = Math.max(1, Math.round((w / firstLoaded.img.naturalWidth) * firstLoaded.img.naturalHeight));
  firstLoaded.cleanup();

  const bytes: number[] = [];
  const pushStr = (s: string) => {
    for (let i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i));
  };
  const pushU16 = (v: number) => {
    bytes.push(v & 0xff, (v >> 8) & 0xff);
  };

  pushStr('GIF89a');
  pushU16(w);
  pushU16(h);
  bytes.push(0xf7, 0x00, 0x00); // Global color table: 256 colors (8-bit 3-3-2)

  for (let idx = 0; idx < 256; idx++) {
    const r = ((idx >> 5) & 7) * 36;
    const g = ((idx >> 2) & 7) * 36;
    const b = (idx & 3) * 85;
    bytes.push(Math.min(255, r), Math.min(255, g), Math.min(255, b));
  }

  // NETSCAPE2.0 Infinite Loop Extension
  bytes.push(0x21, 0xff, 0x0b);
  pushStr('NETSCAPE2.0');
  bytes.push(0x03, 0x01, 0x00, 0x00, 0x00);

  const delayCs = Math.max(2, Math.round(params.delayMs / 10));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  for (const file of params.files) {
    const { img, cleanup } = await loadImageFromFile(file);
    try {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      const imgData = ctx.getImageData(0, 0, w, h).data;

      const indexed = new Uint8Array(w * h);
      for (let p = 0; p < w * h; p++) {
        const i = p * 4;
        indexed[p] =
          (imgData[i] & 0xe0) |
          ((imgData[i + 1] & 0xe0) >> 3) |
          (imgData[i + 2] >> 6);
      }

      // Graphic Control Extension
      bytes.push(0x21, 0xf9, 0x04, 0x04);
      pushU16(delayCs);
      bytes.push(0x00, 0x00);

      // Image Descriptor
      bytes.push(0x2c);
      pushU16(0);
      pushU16(0);
      pushU16(w);
      pushU16(h);
      bytes.push(0x00);

      const compressed = lzwEncodeGif(indexed, 8);
      for (let k = 0; k < compressed.length; k++) bytes.push(compressed[k]);
    } finally {
      cleanup();
    }
  }

  bytes.push(0x3b); // Trailer
  return {
    blob: new Blob([new Uint8Array(bytes)], { type: 'image/gif' }),
    width: w,
    height: h,
    ext: 'gif',
    note: `${params.files.length} frames · ${params.delayMs}ms delay`,
  };
}

export async function decodeGifFramesAndSprite(file: File): Promise<{
  frames: Array<{ dataUrl: string; blob: Blob }>;
  spriteBlob: Blob;
  spriteWidth: number;
  spriteHeight: number;
}> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let pos = 0;
  const readU16 = () => {
    const v = bytes[pos] | (bytes[pos + 1] << 8);
    pos += 2;
    return v;
  };
  const header = String.fromCharCode(...bytes.slice(0, 6));
  if (!header.startsWith('GIF')) {
    throw new Error('Please upload a valid .gif file');
  }
  pos = 6;
  const screenW = readU16();
  const screenH = readU16();
  const packed = bytes[pos++];
  pos += 2; // bgColor, aspect

  let gct: Uint8Array | null = null;
  if (packed & 0x80) {
    const gctSize = 3 * (1 << ((packed & 7) + 1));
    gct = bytes.slice(pos, pos + gctSize);
    pos += gctSize;
  }

  const readSubBlocks = () => {
    const out: number[] = [];
    while (pos < bytes.length) {
      const sz = bytes[pos++];
      if (sz === 0) break;
      for (let i = 0; i < sz && pos < bytes.length; i++) out.push(bytes[pos++]);
    }
    return new Uint8Array(out);
  };

  const decodeLzw = (minCodeSize: number, data: Uint8Array, expectedLen: number) => {
    const clearCode = 1 << minCodeSize;
    const eoiCode = clearCode + 1;
    let codeSize = minCodeSize + 1;
    let codeMask = (1 << codeSize) - 1;
    let dict: number[][] = [];

    const reset = () => {
      dict = [];
      for (let i = 0; i < clearCode; i++) dict[i] = [i];
      dict[clearCode] = [];
      dict[eoiCode] = [];
      codeSize = minCodeSize + 1;
      codeMask = (1 << codeSize) - 1;
    };
    reset();

    const pixels = new Uint8Array(expectedLen);
    let outPos = 0;
    let bitBuf = 0;
    let bitCnt = 0;
    let bytePos = 0;
    let prevCode = -1;

    const nextCode = () => {
      while (bitCnt < codeSize && bytePos < data.length) {
        bitBuf |= data[bytePos++] << bitCnt;
        bitCnt += 8;
      }
      if (bitCnt < codeSize) return -1;
      const code = bitBuf & codeMask;
      bitBuf >>= codeSize;
      bitCnt -= codeSize;
      return code;
    };

    while (outPos < expectedLen) {
      const code = nextCode();
      if (code === -1 || code === eoiCode) break;
      if (code === clearCode) {
        reset();
        prevCode = -1;
        continue;
      }
      let entry: number[];
      if (code < dict.length && dict[code]) {
        entry = dict[code];
      } else if (code === dict.length && prevCode !== -1) {
        entry = [...dict[prevCode], dict[prevCode][0]];
      } else {
        break;
      }
      for (let i = 0; i < entry.length && outPos < expectedLen; i++) {
        pixels[outPos++] = entry[i];
      }
      if (prevCode !== -1 && dict.length < 4096) {
        dict.push([...dict[prevCode], entry[0]]);
        if (dict.length === 1 << codeSize && codeSize < 12) {
          codeSize++;
          codeMask = (1 << codeSize) - 1;
        }
      }
      prevCode = code;
    }
    return pixels;
  };

  const canvas = document.createElement('canvas');
  canvas.width = screenW;
  canvas.height = screenH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  const frames: Array<{ dataUrl: string; blob: Blob }> = [];
  let transparentIdx = -1;
  let disposal = 0;

  while (pos < bytes.length) {
    const sep = bytes[pos++];
    if (sep === 0x3b) break;
    if (sep === 0x21) {
      const label = bytes[pos++];
      if (label === 0xf9) {
        pos++; // block size 4
        const gcePacked = bytes[pos++];
        disposal = (gcePacked >> 2) & 7;
        const hasTrans = (gcePacked & 1) !== 0;
        pos += 2; // delay
        const tIdx = bytes[pos++];
        transparentIdx = hasTrans ? tIdx : -1;
        pos++; // terminator
      } else {
        readSubBlocks();
      }
    } else if (sep === 0x2c) {
      const left = readU16();
      const top = readU16();
      const fw = readU16();
      const fh = readU16();
      const imgPacked = bytes[pos++];
      let ct = gct;
      if (imgPacked & 0x80) {
        const lctSize = 3 * (1 << ((imgPacked & 7) + 1));
        ct = bytes.slice(pos, pos + lctSize);
        pos += lctSize;
      }
      const minCodeSize = bytes[pos++];
      const lzwData = readSubBlocks();
      if (!ct) continue;

      const prevBackup =
        disposal === 3 ? ctx.getImageData(0, 0, screenW, screenH) : null;

      const indices = decodeLzw(minCodeSize, lzwData, fw * fh);
      const patch = ctx.getImageData(left, top, fw, fh);
      const pd = patch.data;
      for (let i = 0; i < fw * fh; i++) {
        const cIdx = indices[i];
        if (cIdx === transparentIdx) continue;
        const di = i * 4;
        pd[di] = ct[cIdx * 3] ?? 0;
        pd[di + 1] = ct[cIdx * 3 + 1] ?? 0;
        pd[di + 2] = ct[cIdx * 3 + 2] ?? 0;
        pd[di + 3] = 255;
      }
      ctx.putImageData(patch, left, top);

      const blob = await canvasToBlob(canvas, 'image/png');
      frames.push({ dataUrl: canvas.toDataURL('image/png'), blob });

      if (disposal === 2) {
        ctx.clearRect(left, top, fw, fh);
      } else if (disposal === 3 && prevBackup) {
        ctx.putImageData(prevBackup, 0, 0);
      }
      transparentIdx = -1;
      disposal = 0;
    }
  }

  if (frames.length === 0) throw new Error('No GIF frames found');

  const cols = Math.min(6, frames.length);
  const rows = Math.ceil(frames.length / cols);
  const spriteCanvas = document.createElement('canvas');
  spriteCanvas.width = cols * screenW;
  spriteCanvas.height = rows * screenH;
  const sCtx = spriteCanvas.getContext('2d');
  if (!sCtx) throw new Error('Canvas unavailable');

  for (let i = 0; i < frames.length; i++) {
    const imgEl = await loadImageElement(frames[i].dataUrl);
    sCtx.drawImage(
      imgEl,
      (i % cols) * screenW,
      Math.floor(i / cols) * screenH,
      screenW,
      screenH
    );
  }
  const spriteBlob = await canvasToBlob(spriteCanvas, 'image/png');
  return {
    frames,
    spriteBlob,
    spriteWidth: spriteCanvas.width,
    spriteHeight: spriteCanvas.height,
  };
}

export async function renderScreenshotMockup(params: {
  file: File;
  theme: 'orange' | 'slate' | 'clean';
  padding: number;
}): Promise<ProcessedImageResult> {
  const { img, cleanup } = await loadImageFromFile(params.file);
  try {
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    const pad = Math.round((params.padding / 100) * Math.min(natW, natH) * 0.25) + 48;
    const barH = Math.max(36, Math.round(natW * 0.036));
    const outW = natW + pad * 2;
    const outH = natH + barH + pad * 2;

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    const grad = ctx.createLinearGradient(0, 0, outW, outH);
    if (params.theme === 'orange') {
      grad.addColorStop(0, '#FFF7ED');
      grad.addColorStop(0.5, '#FDBA74');
      grad.addColorStop(1, '#EA580C');
    } else if (params.theme === 'slate') {
      grad.addColorStop(0, '#0F172A');
      grad.addColorStop(1, '#334155');
    } else {
      grad.addColorStop(0, '#F9FAFB');
      grad.addColorStop(1, '#E5E7EB');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, outW, outH);

    // Window Card Shadow + Frame
    ctx.save();
    ctx.shadowColor = 'rgba(17, 24, 39, 0.28)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 18;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(pad, pad, natW, natH + barH, 16);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(pad, pad, natW, natH + barH, 16);
    ctx.clip();

    // Browser Top Chrome
    ctx.fillStyle = '#F3F4F6';
    ctx.fillRect(pad, pad, natW, barH);
    const dotY = pad + barH / 2;
    const dotR = Math.max(5, Math.round(barH * 0.16));
    ['#EF4444', '#F59E0B', '#10B981'].forEach((c, idx) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(pad + 20 + idx * (dotR * 3), dotY, dotR, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.drawImage(img, pad, pad + barH, natW, natH);
    ctx.restore();

    const blob = await canvasToBlob(canvas, 'image/png');
    return { blob, width: outW, height: outH, ext: 'png' };
  } finally {
    cleanup();
  }
}

export async function renderOgBanner(params: {
  title: string;
  subtitle: string;
  brand: string;
  theme: 'orange' | 'white' | 'dark';
  logoFile?: File | null;
}): Promise<ProcessedImageResult> {
  const w = 1200;
  const h = 630;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  if (params.theme === 'orange') {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#EA580C');
    g.addColorStop(1, '#F97316');
    ctx.fillStyle = g;
  } else if (params.theme === 'dark') {
    ctx.fillStyle = '#111827';
  } else {
    ctx.fillStyle = '#FFFFFF';
  }
  ctx.fillRect(0, 0, w, h);

  if (params.theme === 'white') {
    const glow = ctx.createRadialGradient(w * 0.85, 0, 20, w * 0.85, 0, 620);
    glow.addColorStop(0, 'rgba(249,115,22,0.22)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }

  let textStartX = 88;
  if (params.logoFile) {
    const { img, cleanup } = await loadImageFromFile(params.logoFile);
    try {
      const box = 140;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(88, 88, box, box, 24);
      ctx.clip();
      ctx.drawImage(img, 88, 88, box, box);
      ctx.restore();
      textStartX = 88;
    } finally {
      cleanup();
    }
  }

  const fg = params.theme === 'white' ? '#111827' : '#FFFFFF';
  const subFg =
    params.theme === 'white'
      ? '#4B5563'
      : params.theme === 'dark'
      ? '#D1D5DB'
      : '#FFEDD5';

  ctx.fillStyle = fg;
  ctx.font = '800 58px system-ui, sans-serif';
  const words = (params.title.trim() || 'Build Faster With Clean Browser Tools').split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > w - 176 && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);

  const startY = params.logoFile ? 290 : 210;
  lines.slice(0, 3).forEach((line, idx) => {
    ctx.fillText(line, textStartX, startY + idx * 72);
  });

  ctx.fillStyle = subFg;
  ctx.font = '500 28px system-ui, sans-serif';
  ctx.fillText(
    params.subtitle.trim() || '100% Free, Instant & Private Client-Side Processing',
    textStartX,
    startY + Math.min(3, lines.length) * 72 + 28
  );

  ctx.fillStyle = params.theme === 'white' ? '#EA580C' : '#FFFFFF';
  ctx.font = '700 24px monospace';
  ctx.fillText(params.brand.trim() || 'toolimg.online', 88, h - 68);

  const blob = await canvasToBlob(canvas, 'image/png');
  return { blob, width: w, height: h, ext: 'png', note: '1200x630 Open Graph PNG' };
}

export async function coverResizeUnderLimit(params: {
  file: File;
  width: number;
  height: number;
  maxKb?: number;
}): Promise<ProcessedImageResult> {
  const { img, cleanup } = await loadImageFromFile(params.file);
  try {
    const c = document.createElement('canvas');
    c.width = params.width;
    c.height = params.height;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    const scale = Math.max(params.width / img.naturalWidth, params.height / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, params.width, params.height);
    ctx.drawImage(img, (params.width - dw) / 2, (params.height - dh) / 2, dw, dh);

    if (params.maxKb) {
      const raw = await canvasToBlob(c, 'image/png');
      const fileWrapped = new File([raw], 'thumb.png', { type: 'image/png' });
      const res = await compressToExactKb(fileWrapped, params.maxKb, 'image/jpeg');
      return {
        blob: res.blob,
        width: res.width,
        height: res.height,
        ext: 'jpg',
        note: `Quality ${res.qualityUsed}% · Under ${params.maxKb}KB`,
      };
    }

    const blob = await canvasToBlob(c, 'image/jpeg', 0.92);
    return { blob, width: params.width, height: params.height, ext: 'jpg' };
  } finally {
    cleanup();
  }
}

export async function renderSquareFitNoCrop(params: {
  file: File;
  size: number;
  backdropMode: 'blur' | 'white' | 'black' | 'cream';
  paddingPct: number;
}): Promise<ProcessedImageResult> {
  const { img, cleanup } = await loadImageFromFile(params.file);
  try {
    const s = params.size;
    const c = document.createElement('canvas');
    c.width = s;
    c.height = s;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    if (params.backdropMode === 'blur') {
      const bgScale = Math.max(s / img.naturalWidth, s / img.naturalHeight);
      const bw = img.naturalWidth * bgScale;
      const bh = img.naturalHeight * bgScale;
      ctx.save();
      ctx.filter = 'blur(26px) brightness(0.92)';
      ctx.drawImage(img, (s - bw) / 2, (s - bh) / 2, bw, bh);
      ctx.restore();
    } else {
      ctx.fillStyle =
        params.backdropMode === 'black'
          ? '#111827'
          : params.backdropMode === 'cream'
          ? '#FFF7ED'
          : '#FFFFFF';
      ctx.fillRect(0, 0, s, s);
    }

    const inner = s * (1 - params.paddingPct / 100);
    const scale = Math.min(inner / img.naturalWidth, inner / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, (s - dw) / 2, (s - dh) / 2, dw, dh);

    const blob = await canvasToBlob(c, 'image/jpeg', 0.92);
    return { blob, width: s, height: s, ext: 'jpg' };
  } finally {
    cleanup();
  }
}

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

export async function inspectAndRewriteDpi(params: {
  file: File;
  targetDpi: number;
}): Promise<{
  detectedDpi: number;
  width: number;
  height: number;
  printInches: string;
  updatedBlob: Blob;
  ext: string;
}> {
  const raw = new Uint8Array(await params.file.arrayBuffer());
  const { img, cleanup } = await loadImageFromFile(params.file);
  try {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    let detectedDpi = 72;

    const isPng =
      raw.length > 24 && raw[0] === 0x89 && raw[1] === 0x50 && raw[2] === 0x4e;

    if (isPng) {
      let off = 8;
      while (off + 12 <= raw.length) {
        const len =
          (raw[off] << 24) |
          (raw[off + 1] << 16) |
          (raw[off + 2] << 8) |
          raw[off + 3];
        const type = String.fromCharCode(
          raw[off + 4],
          raw[off + 5],
          raw[off + 6],
          raw[off + 7]
        );
        if (type === 'pHYs' && len === 9 && raw[off + 16] === 1) {
          const ppm =
            ((raw[off + 8] << 24) |
              (raw[off + 9] << 16) |
              (raw[off + 10] << 8) |
              raw[off + 11]) >>>
            0;
          detectedDpi = Math.round(ppm * 0.0254) || 72;
          break;
        }
        off += 12 + len;
      }

      // Produce clean PNG with injected pHYs chunk
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      ctx.drawImage(img, 0, 0);
      const pngBuf = new Uint8Array(
        await (await canvasToBlob(c, 'image/png')).arrayBuffer()
      );
      const ppm = Math.round(params.targetDpi / 0.0254);
      const physChunk = new Uint8Array(21);
      const pv = new DataView(physChunk.buffer);
      pv.setUint32(0, 9, false);
      physChunk.set([0x70, 0x48, 0x59, 0x73], 4); // pHYs
      pv.setUint32(8, ppm, false);
      pv.setUint32(12, ppm, false);
      physChunk[16] = 1; // meter
      pv.setUint32(17, crc32(physChunk.slice(4, 17)), false);

      // Insert right after IHDR (byte 33)
      const out = new Uint8Array(pngBuf.length + physChunk.length);
      out.set(pngBuf.slice(0, 33), 0);
      out.set(physChunk, 33);
      out.set(pngBuf.slice(33), 33 + physChunk.length);

      return {
        detectedDpi,
        width: w,
        height: h,
        printInches: `${(w / params.targetDpi).toFixed(2)}" × ${(h / params.targetDpi).toFixed(2)}"`,
        updatedBlob: new Blob([out], { type: 'image/png' }),
        ext: 'png',
      };
    }

    // JPEG branch
    if (raw.length > 18 && raw[0] === 0xff && raw[1] === 0xd8 && raw[2] === 0xff && raw[3] === 0xe0) {
      const unit = raw[13];
      const xd = (raw[14] << 8) | raw[15];
      if (unit === 1 && xd > 0) detectedDpi = xd;
      else if (unit === 2 && xd > 0) detectedDpi = Math.round(xd * 2.54);
    }

    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0);
    const jpg = new Uint8Array(
      await (await canvasToBlob(c, 'image/jpeg', 0.94)).arrayBuffer()
    );
    if (jpg.length > 18 && jpg[2] === 0xff && jpg[3] === 0xe0) {
      jpg[13] = 1; // DPI unit
      jpg[14] = (params.targetDpi >> 8) & 0xff;
      jpg[15] = params.targetDpi & 0xff;
      jpg[16] = (params.targetDpi >> 8) & 0xff;
      jpg[17] = params.targetDpi & 0xff;
    }

    return {
      detectedDpi,
      width: w,
      height: h,
      printInches: `${(w / params.targetDpi).toFixed(2)}" × ${(h / params.targetDpi).toFixed(2)}"`,
      updatedBlob: new Blob([jpg], { type: 'image/jpeg' }),
      ext: 'jpg',
    };
  } finally {
    cleanup();
  }
}

export async function computeHistogramTelemetry(file: File): Promise<{
  width: number;
  height: number;
  megapixels: string;
  avgBrightness: number;
  hasAlpha: boolean;
  rBins: number[];
  gBins: number[];
  bBins: number[];
  lBins: number[];
}> {
  const { img, cleanup } = await loadImageFromFile(file);
  try {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const sampleW = Math.min(320, w);
    const sampleH = Math.max(1, Math.round((sampleW / w) * h));
    const c = document.createElement('canvas');
    c.width = sampleW;
    c.height = sampleH;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.drawImage(img, 0, 0, sampleW, sampleH);
    const d = ctx.getImageData(0, 0, sampleW, sampleH).data;

    const rBins = new Array<number>(64).fill(0);
    const gBins = new Array<number>(64).fill(0);
    const bBins = new Array<number>(64).fill(0);
    const lBins = new Array<number>(64).fill(0);
    let lumTotal = 0;
    let hasAlpha = false;
    const count = d.length / 4;

    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      if (d[i + 3] < 255) hasAlpha = true;
      const l = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      lumTotal += l;
      rBins[r >> 2]++;
      gBins[g >> 2]++;
      bBins[b >> 2]++;
      lBins[l >> 2]++;
    }

    return {
      width: w,
      height: h,
      megapixels: ((w * h) / 1_000_000).toFixed(2),
      avgBrightness: Math.round((lumTotal / Math.max(1, count) / 255) * 100),
      hasAlpha,
      rBins,
      gBins,
      bBins,
      lBins,
    };
  } finally {
    cleanup();
  }
}

export async function computeImageDiff(
  fileA: File,
  fileB: File
): Promise<{
  diffBlob: Blob;
  diffDataUrl: string;
  width: number;
  height: number;
  changedPercent: string;
}> {
  const a = await loadImageFromFile(fileA);
  const b = await loadImageFromFile(fileB);
  try {
    const w = Math.max(a.img.naturalWidth, b.img.naturalWidth);
    const h = Math.max(a.img.naturalHeight, b.img.naturalHeight);
    const ca = document.createElement('canvas');
    const cb = document.createElement('canvas');
    const cd = document.createElement('canvas');
    ca.width = cb.width = cd.width = w;
    ca.height = cb.height = cd.height = h;
    const ctxA = ca.getContext('2d');
    const ctxB = cb.getContext('2d');
    const ctxD = cd.getContext('2d');
    if (!ctxA || !ctxB || !ctxD) throw new Error('Canvas unavailable');

    ctxA.drawImage(a.img, 0, 0, w, h);
    ctxB.drawImage(b.img, 0, 0, w, h);
    const dA = ctxA.getImageData(0, 0, w, h).data;
    const dB = ctxB.getImageData(0, 0, w, h).data;
    const out = ctxD.createImageData(w, h);
    const od = out.data;

    let changed = 0;
    const total = w * h;
    for (let i = 0; i < dA.length; i += 4) {
      const diff =
        Math.abs(dA[i] - dB[i]) +
        Math.abs(dA[i + 1] - dB[i + 1]) +
        Math.abs(dA[i + 2] - dB[i + 2]);
      if (diff > 24) {
        changed++;
        od[i] = 234;
        od[i + 1] = 88;
        od[i + 2] = 12;
        od[i + 3] = 255;
      } else {
        const gray = Math.round((dA[i] + dA[i + 1] + dA[i + 2]) / 3);
        od[i] = gray;
        od[i + 1] = gray;
        od[i + 2] = gray;
        od[i + 3] = 95;
      }
    }
    ctxD.putImageData(out, 0, 0);
    const diffBlob = await canvasToBlob(cd, 'image/png');
    return {
      diffBlob,
      diffDataUrl: cd.toDataURL('image/png'),
      width: w,
      height: h,
      changedPercent: ((changed / Math.max(1, total)) * 100).toFixed(2),
    };
  } finally {
    a.cleanup();
    b.cleanup();
  }
}

export async function extractRawEmbeddedPreview(
  file: File
): Promise<ProcessedImageResult> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let bestSlice: Uint8Array | null = null;

  for (let i = 0; i < bytes.length - 4; i++) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xd8 && bytes[i + 2] === 0xff) {
      for (let j = i + 4; j < bytes.length - 1; j++) {
        if (bytes[j] === 0xff && bytes[j + 1] === 0xd9) {
          const slice = bytes.slice(i, j + 2);
          if (!bestSlice || slice.byteLength > bestSlice.byteLength) {
            bestSlice = slice;
          }
          i = j + 2;
          break;
        }
      }
    }
  }

  if (!bestSlice || bestSlice.byteLength < 1024) {
    throw new Error('No embedded JPEG preview found in this RAW/DNG file.');
  }

  const blob = new Blob([new Uint8Array(bestSlice)], { type: 'image/jpeg' });
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImageElement(url);
    return {
      blob,
      width: img.naturalWidth,
      height: img.naturalHeight,
      ext: 'jpg',
      note: 'Extracted full embedded RAW preview',
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function renderMemeCaption(params: {
  file: File;
  topText: string;
  bottomText: string;
  style: 'classic-outline' | 'white-bar';
  fontSizePct: number;
}): Promise<ProcessedImageResult> {
  const { img, cleanup } = await loadImageFromFile(params.file);
  try {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const topBar =
      params.style === 'white-bar' && params.topText.trim()
        ? Math.max(64, Math.round(h * 0.16))
        : 0;
    const outW = w;
    const outH = h + topBar;

    const c = document.createElement('canvas');
    c.width = outW;
    c.height = outH;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    if (topBar > 0) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, outW, topBar);
      ctx.drawImage(img, 0, topBar, w, h);
      ctx.fillStyle = '#111827';
      const fs = Math.max(20, Math.round((params.fontSizePct / 100) * topBar * 0.6));
      ctx.font = `700 ${fs}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(params.topText.trim(), outW / 2, topBar / 2, outW - 32);
    } else {
      ctx.drawImage(img, 0, 0, w, h);
      const fs = Math.max(22, Math.round((params.fontSizePct / 100) * Math.min(w, h) * 0.14));
      ctx.font = `900 ${fs}px Impact, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = Math.max(3, Math.round(fs * 0.12));
      ctx.lineJoin = 'round';

      if (params.topText.trim()) {
        ctx.textBaseline = 'top';
        ctx.strokeText(params.topText.trim().toUpperCase(), w / 2, Math.round(h * 0.04), w - 32);
        ctx.fillText(params.topText.trim().toUpperCase(), w / 2, Math.round(h * 0.04), w - 32);
      }
      if (params.bottomText.trim()) {
        ctx.textBaseline = 'bottom';
        ctx.strokeText(params.bottomText.trim().toUpperCase(), w / 2, h - Math.round(h * 0.04), w - 32);
        ctx.fillText(params.bottomText.trim().toUpperCase(), w / 2, h - Math.round(h * 0.04), w - 32);
      }
    }

    const blob = await canvasToBlob(c, 'image/jpeg', 0.92);
    return { blob, width: outW, height: outH, ext: 'jpg' };
  } finally {
    cleanup();
  }
}
