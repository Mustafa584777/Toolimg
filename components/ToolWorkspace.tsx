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

function renderSplitHeadline(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length <= 1) {
    return <span className="text-orange-gradient">{title}</span>;
  }
  const splitAt = Math.max(1, Math.ceil(words.length / 2));
  const lead = words.slice(0, splitAt).join(' ');
  const accent = words.slice(splitAt).join(' ');
  return (
    <>
      <span>{lead} </span>
      <span className="text-orange-gradient">{accent}</span>
    </>
  );
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
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mode-specific controls
  const [targetKb, setTargetKb] = useState<number>(preset?.targetKb ?? 50);
  const [outputFormat, setOutputFormat] = useState<
    'image/jpeg' | 'image/png' | 'image/webp'
  >(preset?.outputFormat ?? 'image/jpeg');
  const [jpgBackground, setJpgBackground] = useState<'#FFFFFF' | '#000000' | '#F3F4F6'>('#FFFFFF');
  const [jpgQuality, setJpgQuality] = useState<number>(0.92);
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

  // Support Ctrl+V paste in workspace
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            void loadFileIntoWorkspace(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [loadFileIntoWorkspace]);

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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void loadFileIntoWorkspace(f);
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
          note: `Quality ${res.qualityUsed}% · Target <= ${targetKb}KB`,
        });
      } else if (mode === 'convert-format' && sourceImage) {
        const res = await convertImageFormat(
          sourceImage.file,
          outputFormat,
          undefined,
          outputFormat === 'image/jpeg' ? jpgQuality : 0.92,
          jpgBackground
        );
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
          note:
            outputFormat === 'image/jpeg'
              ? `Quality ${Math.round(jpgQuality * 100)}% · Backdrop ${
                  jpgBackground === '#FFFFFF'
                    ? 'White'
                    : jpgBackground === '#000000'
                    ? 'Black'
                    : 'Light Gray'
                }`
              : undefined,
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
              ? 'Sized 128x128 under 256KB Discord limit'
              : 'Sized 960x540 Server Banner',
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
              ? '300 DPI printable 4x6" sheet (6 photos)'
              : passportPreset === 'uk-35x45'
              ? '35x45mm biometric ratio'
              : 'US 2x2" (600x600 px) biometric ratio',
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
    <div className="hero-orange-glow py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Centered Breadcrumb + Privacy Pill */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-xs text-[#6B7280]"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-medium text-[#111827] hover:text-[#EA580C]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>All Tools</span>
            </Link>
            {pillar && (
              <>
                <span aria-hidden="true">/</span>
                <Link href={pillar.href} className="hover:text-[#EA580C]">
                  {pillar.tabLabel}
                </Link>
              </>
            )}
            <span aria-hidden="true">/</span>
            <span className="text-[#9CA3AF]">{title}</span>
          </nav>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-medium text-[#059669]">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Processed Locally</span>
          </span>
        </div>

        {/* Centered Tool Header */}
        <div className="mx-auto mt-5 max-w-3xl text-center">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl">
            {renderSplitHeadline(title)}
          </h1>
          <p className="mx-auto mt-2.5 max-w-2xl text-sm leading-relaxed text-[#6B7280] sm:text-base">
            {description}
          </p>
        </div>

        {/* Horizontal Format / Preset Bar Above Workspace */}
        {mode !== 'exif-remove' && mode !== 'circle-crop' && mode !== 'color-picker' && (
          <div className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-2">
            {mode === 'compress-kb' && (
              <>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                  Target KB:
                </span>
                {[20, 50, 100, 200].map((kb) => {
                  const active = targetKb === kb;
                  return (
                    <button
                      key={kb}
                      type="button"
                      onClick={() => setTargetKb(kb)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-xs font-semibold tabular-nums transition-all ${
                        active
                          ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C] shadow-[0_1px_3px_rgba(249,115,22,0.15)]'
                          : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#FDBA74]'
                      }`}
                    >
                      {active && <Check className="h-3 w-3 text-[#EA580C]" aria-hidden="true" />}
                      <span>{kb}KB</span>
                    </button>
                  );
                })}
                <input
                  type="number"
                  min={5}
                  max={5000}
                  value={targetKb}
                  onChange={(e) => setTargetKb(Math.max(5, Number(e.target.value) || 50))}
                  aria-label="Custom KB target"
                  className="h-8 w-20 rounded-xl border border-[#E5E7EB] bg-white px-2.5 font-mono text-xs text-[#111827] tabular-nums focus:border-[#F97316] focus:outline-none"
                />
                <span className="ml-1 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                  Format:
                </span>
                {(['image/jpeg', 'image/webp'] as const).map((fmt) => {
                  const active = outputFormat === fmt;
                  return (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setOutputFormat(fmt)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                        active
                          ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                          : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#FDBA74]'
                      }`}
                    >
                      {active && <Check className="h-3 w-3 text-[#EA580C]" aria-hidden="true" />}
                      <span>{fmt === 'image/jpeg' ? 'JPG' : 'WebP'}</span>
                    </button>
                  );
                })}
              </>
            )}

            {mode === 'convert-format' && (
              <>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                  Output Format:
                </span>
                {(['image/jpeg', 'image/png', 'image/webp'] as const).map((fmt) => {
                  const active = outputFormat === fmt;
                  return (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setOutputFormat(fmt)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                        active
                          ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                          : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#FDBA74]'
                      }`}
                    >
                      {active && <Check className="h-3 w-3 text-[#EA580C]" aria-hidden="true" />}
                      <span>
                        {fmt === 'image/jpeg'
                          ? 'JPG'
                          : fmt === 'image/png'
                          ? 'PNG'
                          : 'WebP'}
                      </span>
                    </button>
                  );
                })}
                {outputFormat === 'image/jpeg' && (
                  <>
                    <span className="ml-1 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                      Backdrop:
                    </span>
                    {(
                      [
                        { hex: '#FFFFFF', label: 'White' },
                        { hex: '#000000', label: 'Black' },
                        { hex: '#F3F4F6', label: 'Gray' },
                      ] as const
                    ).map((bg) => {
                      const active = jpgBackground === bg.hex;
                      return (
                        <button
                          key={bg.hex}
                          type="button"
                          onClick={() => setJpgBackground(bg.hex)}
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                            active
                              ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                              : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#FDBA74]'
                          }`}
                        >
                          <span
                            className="h-3 w-3 rounded-full border border-[#D1D5DB]"
                            style={{ backgroundColor: bg.hex }}
                            aria-hidden="true"
                          />
                          <span>{bg.label}</span>
                        </button>
                      );
                    })}
                    <span className="ml-1 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                      Quality:
                    </span>
                    {[0.85, 0.92, 1].map((q) => {
                      const active = jpgQuality === q;
                      return (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setJpgQuality(q)}
                          className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 font-mono text-xs font-semibold tabular-nums transition-all ${
                            active
                              ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                              : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#FDBA74]'
                          }`}
                        >
                          {Math.round(q * 100)}%
                        </button>
                      );
                    })}
                  </>
                )}
              </>
            )}

            {mode === 'svg-to-png' && (
              <>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                  Export Width:
                </span>
                {[1024, 2048, 3840].map((w) => {
                  const active = svgWidth === w;
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setSvgWidth(w)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-xs font-semibold tabular-nums transition-all ${
                        active
                          ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                          : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#FDBA74]'
                      }`}
                    >
                      {active && <Check className="h-3 w-3 text-[#EA580C]" aria-hidden="true" />}
                      <span>{w === 3840 ? '4K (3840px)' : `${w}px`}</span>
                    </button>
                  );
                })}
              </>
            )}

            {mode === 'instagram-split' && (
              <>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                  Grid Layout:
                </span>
                {[
                  { label: '3x3 Grid (9 Tiles)', cols: 3, rows: 3 },
                  { label: '3x1 Carousel (3 Tiles)', cols: 3, rows: 1 },
                  { label: '3x2 Grid (6 Tiles)', cols: 3, rows: 2 },
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
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                        active
                          ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                          : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#FDBA74]'
                      }`}
                    >
                      {active && <Check className="h-3 w-3 text-[#EA580C]" aria-hidden="true" />}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </>
            )}

            {mode === 'discord-resize' && (
              <>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                  Preset:
                </span>
                <button
                  type="button"
                  onClick={() => setDiscordMode('emoji')}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                    discordMode === 'emoji'
                      ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                      : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#FDBA74]'
                  }`}
                >
                  {discordMode === 'emoji' && (
                    <Check className="h-3 w-3 text-[#EA580C]" aria-hidden="true" />
                  )}
                  <span>Emoji (128x128, &lt;256KB)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDiscordMode('banner')}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                    discordMode === 'banner'
                      ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                      : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#FDBA74]'
                  }`}
                >
                  {discordMode === 'banner' && (
                    <Check className="h-3 w-3 text-[#EA580C]" aria-hidden="true" />
                  )}
                  <span>Server Banner (960x540)</span>
                </button>
              </>
            )}

            {mode === 'passport-photo' && (
              <>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                  Country Spec:
                </span>
                {[
                  { id: 'us-2x2' as const, label: 'US 2x2" (600x600px)' },
                  { id: 'uk-35x45' as const, label: 'UK / EU 35x45mm' },
                  { id: 'print-4x6' as const, label: '4x6" Print Sheet (6 Photos)' },
                ].map((opt) => {
                  const active = passportPreset === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPassportPreset(opt.id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                        active
                          ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                          : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#FDBA74]'
                      }`}
                    >
                      {active && <Check className="h-3 w-3 text-[#EA580C]" aria-hidden="true" />}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </>
            )}

            {mode === 'base64' && (
              <>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                  Mode:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setBase64Direction('encode');
                    resetOutputs();
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    base64Direction === 'encode'
                      ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                      : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#FDBA74]'
                  }`}
                >
                  {base64Direction === 'encode' && (
                    <Check className="h-3 w-3 text-[#EA580C]" aria-hidden="true" />
                  )}
                  <span>Image to Base64 Encoder</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBase64Direction('decode');
                    resetOutputs();
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    base64Direction === 'decode'
                      ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                      : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#FDBA74]'
                  }`}
                >
                  {base64Direction === 'decode' && (
                    <Check className="h-3 w-3 text-[#EA580C]" aria-hidden="true" />
                  )}
                  <span>Base64 to Image Decoder</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Main Interactive Tool Area */}
        <div className="mx-auto mt-6 max-w-4xl">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif,.svg"
            onChange={handleFileInput}
            className="sr-only"
          />

          {/* Single Dotted Upload / Source Drop Box */}
          {!(mode === 'base64' && base64Direction === 'decode') && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dotted px-5 py-8 text-center transition-all ${
                isDragging
                  ? 'border-[#F97316] bg-[#FFF7ED]/50 ring-4 ring-[#F97316]/15'
                  : 'border-[#D1D5DB] bg-white hover:border-[#FDBA74]'
              }`}
            >
              {sourceImage ? (
                <div className="flex w-full flex-col gap-4 text-left sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3.5">
                    {sourceImage.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={sourceImage.previewUrl}
                        alt={sourceImage.name}
                        referrerPolicy="no-referrer"
                        className="h-14 w-14 shrink-0 rounded-xl border border-[#E5E7EB] bg-white object-cover"
                      />
                    ) : (
                      <div className="flex shrink-0 items-center justify-center text-[#EA580C]">
                        <UploadCloud className="h-6 w-6" aria-hidden="true" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#111827]">
                        {sourceImage.name}
                      </p>
                      <p className="font-mono text-xs text-[#6B7280] tabular-nums">
                        {sourceImage.formatLabel} &middot;{' '}
                        {formatBytes(sourceImage.sizeBytes)}
                        {sourceImage.width && sourceImage.height
                          ? ` · ${sourceImage.width} × ${sourceImage.height} px`
                          : ''}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-xl bg-[#F9FAFB] px-4 py-2 text-xs font-semibold text-[#111827] hover:bg-[#FFF7ED] hover:text-[#C2410C]"
                  >
                    <ImagePlus className="h-4 w-4 text-[#EA580C]" aria-hidden="true" />
                    <span>Change Image</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center text-[#EA580C]">
                    <UploadCloud className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#111827]">
                    Drag &amp; drop, paste or select an image
                  </p>
                  <p className="mt-1 text-xs text-[#6B7280]">
                    JPG, PNG, WebP, SVG, or HEIC &middot; Never leaves your browser
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-orange-gradient inline-flex min-h-[40px] items-center gap-2 rounded-xl px-5 py-2 text-xs font-semibold"
                    >
                      <ImagePlus className="h-4 w-4" aria-hidden="true" />
                      <span>Select Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleTrySample}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#F9FAFB] px-4 py-2 text-xs font-semibold text-[#111827] hover:bg-[#FFF7ED] hover:text-[#C2410C]"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#F97316]" aria-hidden="true" />
                      <span>Try Sample</span>
                    </button>
                  </div>
                  <p className="mt-3 text-[11px] text-[#9CA3AF]">
                    or drag &amp; drop, paste (Ctrl + V) your file here
                  </p>
                </>
              )}
            </div>
          )}

          {/* Action Run Button */}
          {mode !== 'color-picker' &&
            !(mode === 'base64' && base64Direction === 'encode') && (
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  disabled={
                    isProcessing ||
                    (!sourceImage &&
                      !(mode === 'base64' && base64Direction === 'decode'))
                  }
                  onClick={runProcessing}
                  className="btn-orange-gradient inline-flex min-h-[42px] items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>
                    {isProcessing ? 'Processing locally...' : 'Process Image'}
                  </span>
                </button>
              </div>
            )}

          {errorMsg && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700">
              {errorMsg}
            </p>
          )}

          {/* Base64 Encode / Decode Output */}
          {mode === 'base64' && (
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#4B5563]">
                  {base64Direction === 'encode'
                    ? 'Generated Data URI (Ready for HTML / CSS)'
                    : 'Paste Base64 or Data URI'}
                </label>
                {base64Direction === 'encode' && base64Text && (
                  <button
                    type="button"
                    onClick={() => handleCopy(base64Text, 'b64')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#111827] hover:border-[#FDBA74] hover:bg-[#FFF7ED]"
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
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-3 font-mono text-xs text-[#111827] focus:border-[#F97316] focus:bg-white focus:outline-none"
              />
            </div>
          )}

          {/* Color Picker Eyedropper & Palette */}
          {mode === 'color-picker' && sourceImage && (
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <p className="mb-2 text-xs font-medium text-[#6B7280]">
                  Click anywhere on the image to sample a pixel color:
                </p>
                <canvas
                  ref={colorCanvasRef}
                  onClick={handleCanvasPick}
                  className="max-h-96 w-full cursor-crosshair rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] object-contain"
                />
              </div>

              <div className="space-y-4">
                {pickedColor && (
                  <div className="card-orange-sheen rounded-xl border border-[#E5E7EB] p-4">
                    <p className="text-xs font-semibold text-[#4B5563]">
                      Picked Pixel Color
                    </p>
                    <div className="mt-2.5 flex items-center gap-3">
                      <span
                        className="h-10 w-10 shrink-0 rounded-lg border border-[#E5E7EB]"
                        style={{ backgroundColor: pickedColor.hex }}
                      />
                      <div className="min-w-0 font-mono text-xs">
                        <p className="font-semibold text-[#111827]">
                          {pickedColor.hex}
                        </p>
                        <p className="text-[#6B7280]">{pickedColor.rgb}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-[#4B5563]">
                    Extracted Palette
                  </p>
                  <div className="mt-2 space-y-2">
                    {palette.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => handleCopy(c.hex, c.hex)}
                        className="flex w-full items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-left transition-colors hover:border-[#FDBA74] hover:bg-[#FFF7ED]/50"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-5 w-5 rounded border border-[#E5E7EB]"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="font-mono text-xs font-semibold text-[#111827]">
                            {c.hex}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-[#EA580C]">
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
            <div className="card-orange-sheen mt-6 rounded-xl border border-[#FED7AA] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={outputUrl}
                    alt="Processed output preview"
                    referrerPolicy="no-referrer"
                    className="h-20 w-20 rounded-xl border border-[#E5E7EB] bg-white object-contain p-1"
                  />
                  <div>
                    <p className="text-sm font-bold text-[#111827]">
                      Ready to Download
                    </p>
                    <p className="mt-0.5 font-mono text-xs font-medium text-[#059669] tabular-nums">
                      {formatBytes(outputMeta.sizeBytes)} &middot;{' '}
                      {outputMeta.width} &times; {outputMeta.height} px
                    </p>
                    {outputMeta.note && (
                      <p className="mt-0.5 text-xs text-[#6B7280]">
                        {outputMeta.note}
                      </p>
                    )}
                  </div>
                </div>

                <a
                  href={outputUrl}
                  download={`toolimg-${mode}.${outputMeta.ext}`}
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-[#059669] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#047857]"
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
              <p className="mb-3 text-xs font-medium text-[#6B7280]">
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
                    className="group relative overflow-hidden rounded-xl border border-[#E5E7EB] bg-white p-1.5 transition-colors hover:border-[#F97316]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tile.dataUrl}
                      alt={`Grid tile row ${tile.row} column ${tile.col}`}
                      referrerPolicy="no-referrer"
                      className="w-full rounded-lg object-cover"
                    />
                    <span className="mt-1.5 flex items-center justify-between font-mono text-[11px] text-[#6B7280]">
                      <span>
                        R{tile.row}&middot;C{tile.col}
                      </span>
                      <Download className="h-3 w-3 text-[#EA580C]" />
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4-Step Workflow Strip */}
        <div className="mt-12">
          <div className="text-center">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-extrabold text-[#111827] sm:text-2xl">
              How {title} Works in{' '}
              <span className="text-orange-gradient">4 Simple Steps</span>
            </h2>
            <p className="mt-1.5 text-xs text-[#6B7280] sm:text-sm">
              Zero server queues &mdash; instant browser execution
            </p>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: 'STEP 01',
                title: 'Select or Drop Image',
                copy: 'Choose, paste (Ctrl+V), or drag any JPG, PNG, WebP, SVG, or HEIC file.',
              },
              {
                step: 'STEP 02',
                title: 'Pick Preset or Format',
                copy: 'Select your exact KB target, social dimension, or output format above.',
              },
              {
                step: 'STEP 03',
                title: 'Local Canvas Processing',
                copy: 'Your browser renders and optimizes every pixel privately in memory.',
              },
              {
                step: 'STEP 04',
                title: 'Preview & Download',
                copy: 'Inspect dimensions and file size, then download your clean output.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="card-orange-sheen rounded-2xl border border-[#E5E7EB] p-5 shadow-[0_1px_3px_rgba(17,24,39,0.04)]"
              >
                <span className="font-mono text-[11px] font-semibold text-[#EA580C]">
                  {item.step}
                </span>
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-sm font-bold text-[#111827]">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#6B7280]">
                  {item.copy}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Related Tools in Silo */}
        <div className="mt-12">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[#111827]">
            More {pillar?.tabLabel} Tools
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {relatedTools.map((rt) => (
              <Link
                key={rt.id}
                href={rt.href}
                className="card-orange-sheen rounded-2xl border border-[#E5E7EB] p-4 transition-all hover:-translate-y-0.5 hover:border-[#FDBA74]"
              >
                <p className="text-sm font-bold text-[#111827]">{rt.title}</p>
                <p className="mt-1 text-xs text-[#6B7280]">{rt.benefit}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
