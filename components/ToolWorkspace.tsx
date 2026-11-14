'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  ImagePlus,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  compressToExactKb,
  convertImageFormat,
  createCircleCropPng,
  createSampleImageFile,
  extractDominantColors,
  fileToDataUrl,
  formatBytes,
  generatePassportPhoto,
  inspectImageFile,
  resizeDiscordAsset,
  splitImageGrid,
  stripExifViaCanvas,
  type InspectedImage,
} from '@/lib/image-processor';
import {
  CORE_TOOLS,
  SILO_PILLARS,
  type HubTool,
  type SiloCategory,
  type ToolMode,
} from '@/lib/tools-data';
import { useImageSession } from '@/components/ImageSessionProvider';

interface ToolWorkspaceProps {
  title: string;
  description: string;
  category: SiloCategory;
  mode: ToolMode;
  preset?: HubTool['defaultPreset'];
}

export function ToolWorkspace({
  title,
  description,
  category,
  mode,
  preset,
}: ToolWorkspaceProps) {
  const { pendingFile, setPendingFile } = useImageSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sourceImage, setSourceImage] = useState<InspectedImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mode-specific controls
  const [targetKb, setTargetKb] = useState<number>(preset?.targetKb ?? 50);
  const [outputFormat, setOutputFormat] = useState<
    'image/jpeg' | 'image/png' | 'image/webp'
  >(preset?.outputFormat ?? 'image/jpeg');
  const [gridCols, setGridCols] = useState<number>(preset?.gridCols ?? 3);
  const [gridRows, setGridRows] = useState<number>(preset?.gridRows ?? 3);
  const [discordMode, setDiscordMode] = useState<'emoji' | 'banner'>('emoji');
  const [passportPreset, setPassportPreset] = useState<
    'us-2x2' | 'uk-35x45' | 'print-4x6'
  >(preset?.passportPreset ?? 'us-2x2');
  const [svgWidth, setSvgWidth] = useState<number>(preset?.width ?? 2048);

  // Single output state
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputMeta, setOutputMeta] = useState<{
    sizeBytes: number;
    width: number;
    height: number;
    ext: string;
    note?: string;
  } | null>(null);

  // Grid tiles output state
  const [gridTiles, setGridTiles] = useState<
    { dataUrl: string; row: number; col: number; sizeBytes: number }[]
  >([]);

  // Base64 state
  const [base64Direction, setBase64Direction] = useState<'encode' | 'decode'>(
    preset?.base64Direction ?? 'encode'
  );
  const [base64Text, setBase64Text] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Color picker state
  const [palette, setPalette] = useState<{ hex: string; rgb: string }[]>([]);
  const [pickedColor, setPickedColor] = useState<{ hex: string; rgb: string } | null>(
    null
  );
  const colorCanvasRef = useRef<HTMLCanvasElement>(null);

  const pillar = SILO_PILLARS.find((p) => p.id === category);
  const relatedTools = CORE_TOOLS.filter((t) => t.category === category);

  const resetOutputs = useCallback(() => {
    setOutputUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setOutputMeta(null);
    setGridTiles([]);
    setErrorMsg(null);
  }, []);

  const loadFileIntoWorkspace = useCallback(
    async (file: File) => {
      resetOutputs();
      try {
        const info = await inspectImageFile(file);
        setSourceImage((prev) => {
          if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
          return info;
        });

        if (mode === 'base64') {
          const dataUrl = await fileToDataUrl(file);
          setBase64Text(dataUrl);
        } else if (mode === 'color-picker') {
          const colors = await extractDominantColors(file, 6);
          setPalette(colors);
        }
      } catch {
        setErrorMsg('Failed to read image in browser.');
      }
    },
    [mode, resetOutputs]
  );

  // Consume pendingFile if user came from the Hero Dropzone
  useEffect(() => {
    if (!pendingFile) return;
    let active = true;
    const fileToLoad = pendingFile;
    Promise.resolve().then(() => {
      if (!active) return;
      setPendingFile(null);
      void loadFileIntoWorkspace(fileToLoad);
    });
    return () => {
      active = false;
    };
  }, [pendingFile, setPendingFile, loadFileIntoWorkspace]);

  // Paint image onto interactive eyedropper canvas when in color-picker mode
  useEffect(() => {
    if (mode !== 'color-picker' || !sourceImage?.previewUrl || !colorCanvasRef.current) {
      return;
    }
    const canvas = colorCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const maxW = 720;
      const scale = Math.min(1, maxW / img.naturalWidth);
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = sourceImage.previewUrl;
  }, [mode, sourceImage]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void loadFileIntoWorkspace(f);
    e.target.value = '';
  };

  const handleTrySample = async () => {
    const sample = await createSampleImageFile();
    await loadFileIntoWorkspace(sample);
  };

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleCanvasPick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = colorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.max(0, Math.min(canvas.width - 1, Math.floor((e.clientX - rect.left) * scaleX)));
    const y = Math.max(0, Math.min(canvas.height - 1, Math.floor((e.clientY - rect.top) * scaleY)));

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex =
      '#' +
      [pixel[0], pixel[1], pixel[2]]
        .map((v) => v.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
    setPickedColor({ hex, rgb: `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})` });
  };

  const runProcessing = async () => {
    if (!sourceImage && !(mode === 'base64' && base64Direction === 'decode')) {
      return;
    }

    setIsProcessing(true);
    resetOutputs();

    try {
      if (mode === 'compress-kb' && sourceImage) {
        const fmt = outputFormat === 'image/png' ? 'image/jpeg' : outputFormat;
        const res = await compressToExactKb(sourceImage.file, targetKb, fmt);
        const url = URL.createObjectURL(res.blob);
        setOutputUrl(url);
        setOutputMeta({
          sizeBytes: res.blob.size,
          width: res.width,
          height: res.height,
          ext: fmt === 'image/webp' ? 'webp' : 'jpg',
          note: `Quality ${res.qualityUsed}% · Target ≤ ${targetKb}KB`,
        });
      } else if (mode === 'convert-format' && sourceImage) {
        const res = await convertImageFormat(sourceImage.file, outputFormat);
        const url = URL.createObjectURL(res.blob);
        const ext =
          outputFormat === 'image/png'
            ? 'png'
            : outputFormat === 'image/webp'
            ? 'webp'
            : 'jpg';
        setOutputUrl(url);
        setOutputMeta({
          sizeBytes: res.blob.size,
          width: res.width,
          height: res.height,
          ext,
        });
      } else if (mode === 'svg-to-png' && sourceImage) {
        const fmt = outputFormat === 'image/webp' ? 'image/webp' : 'image/png';
        const res = await convertImageFormat(sourceImage.file, fmt, svgWidth);
        const url = URL.createObjectURL(res.blob);
        setOutputUrl(url);
        setOutputMeta({
          sizeBytes: res.blob.size,
          width: res.width,
          height: res.height,
          ext: fmt === 'image/webp' ? 'webp' : 'png',
        });
      } else if (mode === 'exif-remove' && sourceImage) {
        const res = await stripExifViaCanvas(sourceImage.file);
        const url = URL.createObjectURL(res.blob);
        setOutputUrl(url);
        setOutputMeta({
          sizeBytes: res.blob.size,
          width: res.width,
          height: res.height,
          ext: res.mimeType === 'image/png' ? 'png' : 'jpg',
          note: 'All EXIF, GPS & camera headers stripped',
        });
      } else if (mode === 'circle-crop' && sourceImage) {
        const res = await createCircleCropPng(sourceImage.file, 600);
        const url = URL.createObjectURL(res.blob);
        setOutputUrl(url);
        setOutputMeta({
          sizeBytes: res.blob.size,
          width: res.width,
          height: res.height,
          ext: 'png',
          note: 'Transparent circular PNG',
        });
      } else if (mode === 'instagram-split' && sourceImage) {
        const tiles = await splitImageGrid(sourceImage.file, gridCols, gridRows);
        setGridTiles(
          tiles.map((t) => ({
            dataUrl: t.dataUrl,
            row: t.row,
            col: t.col,
            sizeBytes: t.blob.size,
          }))
        );
      } else if (mode === 'discord-resize' && sourceImage) {
        const res = await resizeDiscordAsset(sourceImage.file, discordMode);
        const url = URL.createObjectURL(res.blob);
        setOutputUrl(url);
        setOutputMeta({
          sizeBytes: res.blob.size,
          width: res.width,
          height: res.height,
          ext: res.blob.type === 'image/webp' ? 'webp' : 'png',
          note:
            discordMode === 'emoji'
              ? 'Sized 128×128 under 256KB Discord limit'
              : 'Sized 960×540 Server Banner',
        });
      } else if (mode === 'passport-photo' && sourceImage) {
        const res = await generatePassportPhoto(sourceImage.file, passportPreset);
        const url = URL.createObjectURL(res.blob);
        setOutputUrl(url);
        setOutputMeta({
          sizeBytes: res.blob.size,
          width: res.width,
          height: res.height,
          ext: 'jpg',
          note:
            passportPreset === 'print-4x6'
              ? '300 DPI printable 4×6" sheet (6 photos)'
              : passportPreset === 'uk-35x45'
              ? '35×45mm biometric ratio'
              : 'US 2×2" (600×600 px) biometric ratio',
        });
      } else if (mode === 'base64' && base64Direction === 'decode') {
        const trimmed = base64Text.trim();
        if (!trimmed) {
          setErrorMsg('Paste a Base64 string or Data URI first.');
          setIsProcessing(false);
          return;
        }
        const dataUri = trimmed.startsWith('data:image/')
          ? trimmed
          : `data:image/png;base64,${trimmed}`;
        const res = await fetch(dataUri);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.src = url;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        setOutputUrl(url);
        setOutputMeta({
          sizeBytes: blob.size,
          width: img.naturalWidth,
          height: img.naturalHeight,
          ext: blob.type.split('/')[1] || 'png',
        });
      }
    } catch {
      setErrorMsg(
        'Could not process this file format in your browser. For HEIC files on non-Safari browsers, try JPG, PNG, WebP, or SVG.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs text-[#475569]"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1 font-medium text-[#0F172A] hover:text-[#2563EB]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>All Tools</span>
          </Link>
          {pillar && (
            <>
              <span aria-hidden="true">/</span>
              <Link href={pillar.href} className="hover:text-[#2563EB]">
                {pillar.tabLabel}
              </Link>
            </>
          )}
          <span aria-hidden="true">/</span>
          <span className="text-[#64748B]">{title}</span>
        </nav>

        {/* Tool Header */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-[#475569] sm:text-base">
              {description}
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-medium text-[#059669]">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Processed Locally</span>
          </span>
        </div>

        {/* Main Interactive Tool Card */}
        <div className="mt-6 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs sm:p-7">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif,.svg"
            onChange={handleFileInput}
            className="sr-only"
          />

          {/* Base64 Mode Switcher */}
          {mode === 'base64' && (
            <div className="mb-5 flex items-center gap-2 border-b border-[#E2E8F0] pb-4">
              <button
                type="button"
                onClick={() => {
                  setBase64Direction('encode');
                  resetOutputs();
                }}
                className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors ${
                  base64Direction === 'encode'
                    ? 'bg-[#0F172A] text-white'
                    : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]'
                }`}
              >
                Image to Base64 Encoder
              </button>
              <button
                type="button"
                onClick={() => {
                  setBase64Direction('decode');
                  resetOutputs();
                }}
                className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors ${
                  base64Direction === 'decode'
                    ? 'bg-[#0F172A] text-white'
                    : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]'
                }`}
              >
                Base64 to Image Decoder
              </button>
            </div>
          )}

          {/* Upload / Source Bar */}
          {!(mode === 'base64' && base64Direction === 'decode') && (
            <div className="flex flex-col gap-4 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#2563EB]">
                  <UploadCloud className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  {sourceImage ? (
                    <>
                      <p className="truncate text-sm font-semibold text-[#0F172A]">
                        {sourceImage.name}
                      </p>
                      <p className="font-mono text-xs text-[#475569] tabular-nums">
                        {sourceImage.formatLabel} · {formatBytes(sourceImage.sizeBytes)}
                        {sourceImage.width && sourceImage.height
                          ? ` · ${sourceImage.width} × ${sourceImage.height} px`
                          : ''}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-[#0F172A]">
                        Select an image from your device
                      </p>
                      <p className="text-xs text-[#475569]">
                        JPG, PNG, WebP, SVG, or HEIC · Never leaves your browser
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8]"
                >
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                  <span>{sourceImage ? 'Change Image' : 'Select Image'}</span>
                </button>
                {!sourceImage && (
                  <button
                    type="button"
                    onClick={handleTrySample}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden="true" />
                    <span>Try Sample</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tool-Specific Controls */}
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            {mode === 'compress-kb' && (
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#475569]">
                    Target Max File Size (KB)
                  </label>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {[20, 50, 100, 200].map((kb) => (
                      <button
                        key={kb}
                        type="button"
                        onClick={() => setTargetKb(kb)}
                        className={`rounded-md px-3 py-1.5 font-mono text-xs font-medium tabular-nums ${
                          targetKb === kb
                            ? 'bg-[#0F172A] text-white'
                            : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] hover:bg-white'
                        }`}
                      >
                        {kb}KB
                      </button>
                    ))}
                    <input
                      type="number"
                      min={5}
                      max={5000}
                      value={targetKb}
                      onChange={(e) => setTargetKb(Math.max(5, Number(e.target.value) || 50))}
                      aria-label="Custom KB target"
                      className="h-8 w-20 rounded-md border border-[#E2E8F0] px-2 font-mono text-xs text-[#0F172A] tabular-nums"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#475569]">
                    Output Format
                  </label>
                  <div className="mt-1.5 flex gap-1.5">
                    {(['image/jpeg', 'image/webp'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setOutputFormat(fmt)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                          outputFormat === fmt
                            ? 'bg-[#0F172A] text-white'
                            : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]'
                        }`}
                      >
                        {fmt === 'image/jpeg' ? 'JPG' : 'WebP'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {mode === 'convert-format' && (
              <div>
                <label className="block text-xs font-medium text-[#475569]">
                  Convert To
                </label>
                <div className="mt-1.5 flex gap-1.5">
                  {(['image/jpeg', 'image/png', 'image/webp'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setOutputFormat(fmt)}
                      className={`rounded-md px-3.5 py-1.5 text-xs font-medium ${
                        outputFormat === fmt
                          ? 'bg-[#0F172A] text-white'
                          : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]'
                      }`}
                    >
                      {fmt === 'image/jpeg'
                        ? 'JPG'
                        : fmt === 'image/png'
                        ? 'PNG'
                        : 'WebP'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'svg-to-png' && (
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#475569]">
                    Export Width
                  </label>
                  <div className="mt-1.5 flex gap-1.5">
                    {[1024, 2048, 3840].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setSvgWidth(w)}
                        className={`rounded-md px-3 py-1.5 font-mono text-xs font-medium tabular-nums ${
                          svgWidth === w
                            ? 'bg-[#0F172A] text-white'
                            : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]'
                        }`}
                      >
                        {w === 3840 ? '4K (3840px)' : `${w}px`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {mode === 'instagram-split' && (
              <div className="flex gap-2">
                {[
                  { label: '3×3 Grid (9 Tiles)', cols: 3, rows: 3 },
                  { label: '3×1 Carousel (3 Tiles)', cols: 3, rows: 1 },
                  { label: '3×2 Grid (6 Tiles)', cols: 3, rows: 2 },
                ].map((opt) => {
                  const active = gridCols === opt.cols && gridRows === opt.rows;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => {
                        setGridCols(opt.cols);
                        setGridRows(opt.rows);
                      }}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                        active
                          ? 'bg-[#0F172A] text-white'
                          : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}

            {mode === 'discord-resize' && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDiscordMode('emoji')}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                    discordMode === 'emoji'
                      ? 'bg-[#0F172A] text-white'
                      : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]'
                  }`}
                >
                  Emoji (128×128, &lt;256KB)
                </button>
                <button
                  type="button"
                  onClick={() => setDiscordMode('banner')}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                    discordMode === 'banner'
                      ? 'bg-[#0F172A] text-white'
                      : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]'
                  }`}
                >
                  Server Banner (960×540)
                </button>
              </div>
            )}

            {mode === 'passport-photo' && (
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'us-2x2' as const, label: 'US 2×2" (600×600px)' },
                  { id: 'uk-35x45' as const, label: 'UK / EU 35×45mm' },
                  { id: 'print-4x6' as const, label: '4×6" Print Sheet (6 Photos)' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPassportPreset(opt.id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                      passportPreset === opt.id
                        ? 'bg-[#0F172A] text-white'
                        : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Action Run Button (for canvas-processing tools) */}
            {mode !== 'color-picker' && !(mode === 'base64' && base64Direction === 'encode') && (
              <button
                type="button"
                disabled={
                  isProcessing ||
                  (!sourceImage && !(mode === 'base64' && base64Direction === 'decode'))
                }
                onClick={runProcessing}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white shadow-xs transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>{isProcessing ? 'Processing locally...' : 'Process Image'}</span>
              </button>
            )}
          </div>

          {errorMsg && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700">
              {errorMsg}
            </p>
          )}

          {/* Base64 Encode / Decode Output */}
          {mode === 'base64' && (
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#475569]">
                  {base64Direction === 'encode'
                    ? 'Generated Data URI (Ready for HTML / CSS)'
                    : 'Paste Base64 or Data URI'}
                </label>
                {base64Direction === 'encode' && base64Text && (
                  <button
                    type="button"
                    onClick={() => handleCopy(base64Text, 'b64')}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-xs font-medium text-[#0F172A] hover:bg-white"
                  >
                    {copiedKey === 'b64' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#059669]" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Data URI</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <textarea
                value={base64Text}
                onChange={(e) => setBase64Text(e.target.value)}
                readOnly={base64Direction === 'encode'}
                rows={5}
                placeholder={
                  base64Direction === 'encode'
                    ? 'Select an image above to generate its Base64 Data URI...'
                    : 'Paste data:image/png;base64,... or raw Base64 string here'
                }
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 font-mono text-xs text-[#0F172A] focus:border-[#2563EB] focus:bg-white focus:outline-none"
              />
            </div>
          )}

          {/* Color Picker Eyedropper & Palette */}
          {mode === 'color-picker' && sourceImage && (
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <p className="mb-2 text-xs font-medium text-[#475569]">
                  Click anywhere on the image to sample a pixel color:
                </p>
                <canvas
                  ref={colorCanvasRef}
                  onClick={handleCanvasPick}
                  className="max-h-96 w-full cursor-crosshair rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] object-contain"
                />
              </div>

              <div className="space-y-4">
                {pickedColor && (
                  <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <p className="text-xs font-medium text-[#475569]">
                      Picked Pixel Color
                    </p>
                    <div className="mt-2.5 flex items-center gap-3">
                      <span
                        className="h-10 w-10 shrink-0 rounded-lg border border-[#E2E8F0]"
                        style={{ backgroundColor: pickedColor.hex }}
                      />
                      <div className="min-w-0 font-mono text-xs">
                        <p className="font-semibold text-[#0F172A]">
                          {pickedColor.hex}
                        </p>
                        <p className="text-[#475569]">{pickedColor.rgb}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium text-[#475569]">
                    Extracted Palette
                  </p>
                  <div className="mt-2 space-y-2">
                    {palette.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => handleCopy(c.hex, c.hex)}
                        className="flex w-full items-center justify-between rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-left transition-colors hover:border-[#2563EB]/40"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-5 w-5 rounded border border-[#E2E8F0]"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="font-mono text-xs font-medium text-[#0F172A]">
                            {c.hex}
                          </span>
                        </div>
                        <span className="text-xs text-[#64748B]">
                          {copiedKey === c.hex ? 'Copied' : 'Copy'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Processed Single Image Output */}
          {outputUrl && outputMeta && (
            <div className="mt-6 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={outputUrl}
                    alt="Processed output preview"
                    referrerPolicy="no-referrer"
                    className="h-20 w-20 rounded-lg border border-[#E2E8F0] bg-white object-contain p-1"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">
                      Ready to Download
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-[#059669] tabular-nums">
                      {formatBytes(outputMeta.sizeBytes)} · {outputMeta.width} ×{' '}
                      {outputMeta.height} px
                    </p>
                    {outputMeta.note && (
                      <p className="mt-0.5 text-xs text-[#475569]">
                        {outputMeta.note}
                      </p>
                    )}
                  </div>
                </div>

                <a
                  href={outputUrl}
                  download={`toolimg-${mode}.${outputMeta.ext}`}
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-[#059669] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#047857]"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span>Download .{outputMeta.ext.toUpperCase()}</span>
                </a>
              </div>
            </div>
          )}

          {/* Grid Splitter Tiles Output */}
          {gridTiles.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-xs font-medium text-[#475569]">
                Generated {gridTiles.length} grid tiles — click any tile to
                download:
              </p>
              <div
                className="grid gap-3"
                style={{
                  gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                }}
              >
                {gridTiles.map((tile) => (
                  <a
                    key={`${tile.row}-${tile.col}`}
                    href={tile.dataUrl}
                    download={`grid-r${tile.row}-c${tile.col}.png`}
                    className="group relative overflow-hidden rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-1.5 transition-colors hover:border-[#2563EB]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tile.dataUrl}
                      alt={`Grid tile row ${tile.row} column ${tile.col}`}
                      referrerPolicy="no-referrer"
                      className="w-full rounded object-cover"
                    />
                    <span className="mt-1.5 flex items-center justify-between font-mono text-[11px] text-[#475569]">
                      <span>
                        R{tile.row}·C{tile.col}
                      </span>
                      <Download className="h-3 w-3 text-[#2563EB]" />
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Related Tools in Silo */}
        <div className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#0F172A]">
            More {pillar?.tabLabel} Tools
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {relatedTools.map((rt) => (
              <Link
                key={rt.id}
                href={rt.href}
                className="rounded-xl border border-[#E2E8F0] bg-white p-4 transition-colors hover:border-[#2563EB]/40"
              >
                <p className="text-sm font-semibold text-[#0F172A]">{rt.title}</p>
                <p className="mt-1 text-xs text-[#475569]">{rt.benefit}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
