'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Download,
  ImagePlus,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  convertImageFormat,
  createSampleImageFile,
  formatBytes,
  inspectImageFile,
  splitImageGrid,
  type InspectedImage,
} from '@/lib/image-processor';
import {
  addTextWatermark,
  applyColorAndToneFilter,
  applyPhotoFrame,
  applyRoundedCorners,
  buildAnimatedGif,
  buildPdfFromImages,
  composeMultiImageGridOrMerge,
  computeHistogramTelemetry,
  computeImageDiff,
  coverResizeUnderLimit,
  decodeGifFramesAndSprite,
  extractImagesFromPdfOrRaw,
  extractRawEmbeddedPreview,
  generateMultiSizeIco,
  generatePwaIconPack,
  inspectAndRewriteDpi,
  processCroppedImage,
  processRegionEffect,
  removeBackgroundSmart,
  renderMemeCaption,
  renderOgBanner,
  renderScreenshotMockup,
  renderSquareFitNoCrop,
  resizeBatchImages,
  transformFlipRotate,
  upscaleAndSharpenImage,
} from '@/lib/extended-image-processors';
import { EXTENDED_TOOLS, type ExtendedToolItem } from '@/lib/extended-tools-data';
import { useImageSession } from '@/components/ImageSessionProvider';

interface ExtendedToolWorkspaceProps {
  tool: ExtendedToolItem;
}

const MULTI_FILE_MODES = new Set([
  'bulk-resizer',
  'collage-maker',
  'side-by-side',
  'image-to-pdf',
  'gif-maker',
]);

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

export function ExtendedToolWorkspace({ tool }: ExtendedToolWorkspaceProps) {
  const { mode, title, description, slug } = tool;
  const { pendingFile, setPendingFile } = useImageSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const diffBInputRef = useRef<HTMLInputElement>(null);

  const [sourceImage, setSourceImage] = useState<InspectedImage | null>(null);
  const [rawUploadFile, setRawUploadFile] = useState<File | null>(null);
  const [multiFiles, setMultiFiles] = useState<
    Array<{ file: File; name: string; sizeBytes: number; previewUrl: string }>
  >([]);
  const [diffSecondImage, setDiffSecondImage] = useState<InspectedImage | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoNote, setInfoNote] = useState<string | null>(null);

  // Controls across modes
  const [cropAspect, setCropAspect] = useState<'free' | '16:9' | '4:3' | '1:1' | '9:16'>('free');
  const [regionX, setRegionX] = useState(10);
  const [regionY, setRegionY] = useState(10);
  const [regionW, setRegionW] = useState(80);
  const [regionH, setRegionH] = useState(80);
  const [effectStrength, setEffectStrength] = useState(18);

  const [bulkMode, setBulkMode] = useState<'scale' | 'width'>('scale');
  const [bulkScale, setBulkScale] = useState(50);
  const [bulkWidth, setBulkWidth] = useState(1200);
  const [outFmt, setOutFmt] = useState<'image/jpeg' | 'image/png' | 'image/webp'>(
    mode === 'webp-convert' ? 'image/jpeg' : 'image/png'
  );

  const [bgTolerance, setBgTolerance] = useState(30);
  const [bgSampleMode, setBgSampleMode] = useState<'edge-sample' | 'white-paper'>(
    mode === 'transparent-signature' ? 'white-paper' : 'edge-sample'
  );
  const [upscaleFactor, setUpscaleFactor] = useState<2 | 4>(2);
  const [sharpnessAmt, setSharpnessAmt] = useState(65);

  const [wmText, setWmText] = useState('toolimg.online');
  const [wmLayout, setWmLayout] = useState<'bottom-right' | 'center' | 'tiled'>('bottom-right');
  const [wmOpacity, setWmOpacity] = useState(0.75);
  const [wmSize, setWmSize] = useState(90);
  const [wmColor, setWmColor] = useState('#FFFFFF');

  const [rotateDeg, setRotateDeg] = useState(90);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  const [brightness, setBrightness] = useState(105);
  const [contrast, setContrast] = useState(110);
  const [saturation, setSaturation] = useState(110);
  const [bwStyle, setBwStyle] = useState<'grayscale' | 'bw-high'>('grayscale');
  const [filterIntensity, setFilterIntensity] = useState(80);
  const [duotoneDark, setDuotoneDark] = useState('#111827');
  const [duotoneLight, setDuotoneLight] = useState('#F97316');
  const [visionType, setVisionType] = useState<'deuteranopia' | 'protanopia' | 'tritanopia'>(
    'deuteranopia'
  );

  const [cornerRadius, setCornerRadius] = useState(48);
  const [frameThickness, setFrameThickness] = useState(35);
  const [frameColor, setFrameColor] = useState('#FFFFFF');
  const [frameCaption, setFrameCaption] = useState('');

  const [layoutMode, setLayoutMode] = useState<'horizontal' | 'vertical' | 'grid-2x2'>(
    mode === 'side-by-side' ? 'horizontal' : 'grid-2x2'
  );
  const [layoutGap, setLayoutGap] = useState(16);
  const [layoutBg, setLayoutBg] = useState('#FFFFFF');

  const [pdfPageSize, setPdfPageSize] = useState<'a4' | 'letter' | 'fit'>('a4');
  const [gifDelayMs, setGifDelayMs] = useState(350);
  const [gifWidth, setGifWidth] = useState(480);

  const [mockupTheme, setMockupTheme] = useState<'orange' | 'slate' | 'clean'>('orange');
  const [mockupPad, setMockupPad] = useState(40);

  const [ogTitle, setOgTitle] = useState('Fast Browser Image Utilities');
  const [ogSubtitle, setOgSubtitle] = useState('Private, Instant & Unlimited Client-Side Tools');
  const [ogBrand, setOgBrand] = useState('toolimg.online');
  const [ogTheme, setOgTheme] = useState<'orange' | 'white' | 'dark'>('orange');

  const [bannerPreset, setBannerPreset] = useState<'linkedin' | 'x' | 'yt'>('linkedin');
  const [dpBackdrop, setDpBackdrop] = useState<'blur' | 'white' | 'black' | 'cream'>('blur');
  const [dpPad, setDpPad] = useState(8);

  const [targetDpi, setTargetDpi] = useState(300);
  const [dpiReport, setDpiReport] = useState<{
    detectedDpi: number;
    printInches: string;
  } | null>(null);

  const [spriteAction, setSpriteAction] = useState<'slice' | 'pack'>('slice');
  const [spriteCols, setSpriteCols] = useState(4);
  const [spriteRows, setSpriteRows] = useState(4);

  const [memeTop, setMemeTop] = useState('WHEN THE CLIENT-SIDE TOOL');
  const [memeBottom, setMemeBottom] = useState('RUNS IN 12 MILLISECONDS');
  const [memeStyle, setMemeStyle] = useState<'classic-outline' | 'white-bar'>('classic-outline');
  const [memeSize, setMemeSize] = useState(95);

  // Outputs
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputMeta, setOutputMeta] = useState<{
    sizeBytes: number;
    width?: number;
    height?: number;
    ext: string;
    note?: string;
  } | null>(null);

  const [batchDownloads, setBatchDownloads] = useState<
    Array<{ url: string; name: string; width: number; height: number; sizeBytes: number }>
  >([]);

  const [histogramData, setHistogramData] = useState<{
    width: number;
    height: number;
    megapixels: string;
    avgBrightness: number;
    hasAlpha: boolean;
    rBins: number[];
    gBins: number[];
    bBins: number[];
    lBins: number[];
  } | null>(null);

  const [diffSummary, setDiffSummary] = useState<{
    changedPercent: string;
    width: number;
    height: number;
  } | null>(null);

  const isMultiMode =
    MULTI_FILE_MODES.has(mode) || (mode === 'sprite-slicer' && spriteAction === 'pack');

  const fileAccept = useMemo(() => {
    if (mode === 'pdf-to-png') return 'application/pdf,.pdf';
    if (mode === 'gif-to-sprites') return 'image/gif,.gif';
    if (mode === 'raw-preview') return '.dng,.cr2,.nef,.arw,.raf,.rw2,.orf,image/*';
    if (mode === 'webp-convert') return 'image/webp,image/*,.heic,.heif,.svg';
    if (mode === 'avif-convert') return 'image/avif,image/*,.heic,.heif,.svg';
    return 'image/*,.heic,.heif,.svg';
  }, [mode]);

  const siblingUtilities = useMemo(() => {
    const idx = EXTENDED_TOOLS.findIndex((item) => item.slug === slug);
    const items: ExtendedToolItem[] = [];
    for (let offset = 1; offset <= 3; offset++) {
      items.push(EXTENDED_TOOLS[(idx + offset) % EXTENDED_TOOLS.length]);
    }
    return items;
  }, [slug]);

  const clearOutputs = useCallback(() => {
    setOutputUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setOutputMeta(null);
    setBatchDownloads((prev) => {
      prev.forEach((b) => {
        if (b.url.startsWith('blob:')) URL.revokeObjectURL(b.url);
      });
      return [];
    });
    setHistogramData(null);
    setDiffSummary(null);
    setDpiReport(null);
    setErrorMsg(null);
    setInfoNote(null);
  }, []);

  const loadFiles = useCallback(
    async (filesList: File[]) => {
      if (filesList.length === 0) return;
      clearOutputs();

      if (mode === 'pdf-to-png' || mode === 'raw-preview') {
        setRawUploadFile(filesList[0]);
        setSourceImage(null);
        return;
      }

      if (isMultiMode) {
        const nextItems = filesList.map((f) => ({
          file: f,
          name: f.name,
          sizeBytes: f.size,
          previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : '',
        }));
        setMultiFiles((prev) => {
          const combined = [...prev, ...nextItems].slice(0, 12);
          return combined;
        });
        return;
      }

      try {
        const inspected = await inspectImageFile(filesList[0]);
        setSourceImage((prev) => {
          if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
          return inspected;
        });
        setRawUploadFile(filesList[0]);

        if (mode === 'histogram-viewer') {
          const stats = await computeHistogramTelemetry(filesList[0]);
          setHistogramData(stats);
        }
      } catch {
        setErrorMsg('Could not decode this image file in the browser.');
      }
    },
    [clearOutputs, isMultiMode, mode]
  );

  // Consume pending file if navigated from hero dropzone
  useEffect(() => {
    if (!pendingFile) return;
    let active = true;
    const f = pendingFile;
    Promise.resolve().then(() => {
      if (!active) return;
      setPendingFile(null);
      void loadFiles([f]);
    });
    return () => {
      active = false;
    };
  }, [pendingFile, setPendingFile, loadFiles]);

  // Ctrl+V paste support
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const pasted: File[] = [];
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const f = item.getAsFile();
          if (f) pasted.push(f);
        }
      }
      if (pasted.length > 0) void loadFiles(pasted);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [loadFiles]);

  const handleApplyCropPreset = (preset: 'free' | '16:9' | '4:3' | '1:1' | '9:16') => {
    setCropAspect(preset);
    if (preset === '16:9') {
      setRegionX(5);
      setRegionY(20);
      setRegionW(90);
      setRegionH(51);
    } else if (preset === '4:3') {
      setRegionX(10);
      setRegionY(12);
      setRegionW(80);
      setRegionH(60);
    } else if (preset === '1:1') {
      setRegionX(15);
      setRegionY(10);
      setRegionW(70);
      setRegionH(70);
    } else if (preset === '9:16') {
      setRegionX(28);
      setRegionY(5);
      setRegionW(44);
      setRegionH(90);
    } else {
      setRegionX(10);
      setRegionY(10);
      setRegionW(80);
      setRegionH(80);
    }
  };

  const handleTrySample = async () => {
    clearOutputs();
    if (mode === 'pdf-to-png') {
      const sampleImg = await createSampleImageFile();
      const pdfBlob = await buildPdfFromImages({ files: [sampleImg], pageSize: 'a4' });
      const pdfFile = new File([pdfBlob], 'sample-document.pdf', { type: 'application/pdf' });
      await loadFiles([pdfFile]);
      return;
    }

    if (mode === 'gif-to-sprites') {
      const f1 = await createSampleImageFile();
      const gifRes = await buildAnimatedGif({ files: [f1, f1], delayMs: 400, maxWidth: 320 });
      const gifFile = new File([gifRes.blob], 'sample-loop.gif', { type: 'image/gif' });
      await loadFiles([gifFile]);
      return;
    }

    if (mode === 'image-diff') {
      const f1 = await createSampleImageFile();
      const altered = await applyColorAndToneFilter({
        file: f1,
        mode: 'tone',
        brightness: 112,
        contrast: 120,
        saturation: 125,
      });
      const f2 = new File([altered.blob], 'sample-edited.png', { type: 'image/png' });
      await loadFiles([f1]);
      const inspectedB = await inspectImageFile(f2);
      setDiffSecondImage(inspectedB);
      return;
    }

    if (isMultiMode) {
      const f1 = await createSampleImageFile();
      const tinted = await applyColorAndToneFilter({
        file: f1,
        mode: 'duotone',
        darkHex: '#1E293B',
        lightHex: '#FB923C',
      });
      const f2 = new File([tinted.blob], 'sample-frame-2.png', { type: 'image/png' });
      await loadFiles([f1, f2]);
      return;
    }

    const sample = await createSampleImageFile();
    await loadFiles([sample]);
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    clearOutputs();

    try {
      const file = rawUploadFile ?? sourceImage?.file;

      if (mode === 'og-image-maker') {
        const res = await renderOgBanner({
          title: ogTitle,
          subtitle: ogSubtitle,
          brand: ogBrand,
          theme: ogTheme,
          logoFile: file ?? null,
        });
        setOutputUrl(URL.createObjectURL(res.blob));
        setOutputMeta({
          sizeBytes: res.blob.size,
          width: res.width,
          height: res.height,
          ext: res.ext,
          note: res.note,
        });
        return;
      }

      if (isMultiMode) {
        if (multiFiles.length === 0) {
          setErrorMsg('Please upload at least one image first.');
          return;
        }
        const files = multiFiles.map((m) => m.file);

        if (mode === 'bulk-resizer') {
          const batch = await resizeBatchImages({
            files,
            mode: bulkMode,
            scalePct: bulkScale,
            targetWidth: bulkWidth,
            format: outFmt,
          });
          setBatchDownloads(
            batch.map((item) => ({
              url: URL.createObjectURL(item.blob),
              name: item.name,
              width: item.width,
              height: item.height,
              sizeBytes: item.blob.size,
            }))
          );
          return;
        }

        if (mode === 'collage-maker' || mode === 'side-by-side' || mode === 'sprite-slicer') {
          const res = await composeMultiImageGridOrMerge({
            files,
            layout: layoutMode,
            gap: layoutGap,
            bgColor: layoutBg,
          });
          setOutputUrl(URL.createObjectURL(res.blob));
          setOutputMeta({
            sizeBytes: res.blob.size,
            width: res.width,
            height: res.height,
            ext: res.ext,
            note: `Combined ${files.length} images locally`,
          });
          return;
        }

        if (mode === 'image-to-pdf') {
          const pdfBlob = await buildPdfFromImages({ files, pageSize: pdfPageSize });
          setOutputUrl(URL.createObjectURL(pdfBlob));
          setOutputMeta({
            sizeBytes: pdfBlob.size,
            ext: 'pdf',
            note: `${files.length} page${files.length > 1 ? 's' : ''} · ${pdfPageSize.toUpperCase()}`,
          });
          return;
        }

        if (mode === 'gif-maker') {
          const res = await buildAnimatedGif({
            files,
            delayMs: gifDelayMs,
            maxWidth: gifWidth,
          });
          setOutputUrl(URL.createObjectURL(res.blob));
          setOutputMeta({
            sizeBytes: res.blob.size,
            width: res.width,
            height: res.height,
            ext: res.ext,
            note: res.note,
          });
          return;
        }
      }

      if (!file) {
        setErrorMsg('Please upload a file first.');
        return;
      }

      if (mode === 'cropper') {
        const res = await processCroppedImage({
          file,
          xPct: regionX,
          yPct: regionY,
          wPct: regionW,
          hPct: regionH,
          format: outFmt,
        });
        setOutputUrl(URL.createObjectURL(res.blob));
        setOutputMeta({ sizeBytes: res.blob.size, width: res.width, height: res.height, ext: res.ext });
      } else if (mode === 'webp-convert' || mode === 'avif-convert') {
        const fmt = outFmt === 'image/webp' ? 'image/png' : outFmt;
        const res = await convertImageFormat(file, fmt, undefined, 0.92, '#FFFFFF');
        const ext = fmt === 'image/png' ? 'png' : 'jpg';
        setOutputUrl(URL.createObjectURL(res.blob));
        setOutputMeta({
          sizeBytes: res.blob.size,
          width: res.width,
          height: res.height,
          ext,
        });
      } else if (mode === 'background-remover' || mode === 'transparent-signature') {
        const res = await removeBackgroundSmart({
          file,
          tolerance: bgTolerance,
          mode: mode === 'transparent-signature' ? 'white-paper' : bgSampleMode,
        });
        setOutputUrl(URL.createObjectURL(res.blob));
        setOutputMeta({
          sizeBytes: res.blob.size,
          width: res.width,
          height: res.height,
          ext: res.ext,
          note: res.note,
        });
      } else if (mode === 'white-bg-studio') {
        const cutout = await removeBackgroundSmart({
          file,
          tolerance: bgTolerance,
          mode: 'edge-sample',
        });
        const cutoutFile = new File([cutout.blob], 'cutout.png', { type: 'image/png' });
        const studio = await renderSquareFitNoCrop({
          file: cutoutFile,
          size: 1200,
          backdropMode: 'white',
          paddingPct: 10,
        });
        setOutputUrl(URL.createObjectURL(studio.blob));
        setOutputMeta({
          sizeBytes: studio.blob.size,
          width: studio.width,
          height: studio.height,
          ext: studio.ext,
          note: 'Pure #FFFFFF e-commerce canvas',
        });
      } else if (mode === 'upscaler') {
        const res = await upscaleAndSharpenImage({
          file,
          scale: upscaleFactor,
          sharpness: sharpnessAmt / 100,
        });
        setOutputUrl(URL.createObjectURL(res.blob));
        setOutputMeta({
          sizeBytes: res.blob.size,
          width: res.width,
          height: res.height,
          ext: res.ext,
          note: res.note,
        });
      } else if (mode === 'watermark-adder') {
        const res = await addTextWatermark({
          file,
          text: wmText,
          opacity: wmOpacity,
          fontSize: wmSize,
          color: wmColor,
          layout: wmLayout,
        });
        setOutputUrl(URL.createObjectURL(res.blob));
        setOutputMeta({ sizeBytes: res.blob.size, width: res.width, height: res.height, ext: res.ext });
      } else if (
        mode === 'blur-region' ||
        mode === 'pixelate-region' ||
        mode === 'watermark-remover'
      ) {
        const effect =
          mode === 'blur-region'
            ? 'blur'
            : mode === 'pixelate-region'
            ? 'pixelate'
            : 'inpaint';
        const res = await processRegionEffect({
          file,
          effect,
          xPct: regionX,
          yPct: regionY,
          wPct: regionW,
          hPct: regionH,
          strength: effectStrength,
        });
        setOutputUrl(URL.createObjectURL(res.blob));
        setOutputMeta({ sizeBytes: res.blob.size, width: res.width, height: res.height, ext: res.ext });
      } else if (mode === 'grayscale-bw') {
        const res = await applyColorAndToneFilter({
          file,
          mode: bwStyle,
          contrast,
        });
        setOutputUrl(URL.createObjectURL(res.blob));
        setOutputMeta({ sizeBytes: res.blob.size, width: res.width, height: res.height, ext: res.ext });
      } else if (mode === 'brightness-contrast') {
        const res = await applyColorAndToneFilter({
          file,
          mode: 'tone',
          brightness,
          contrast,
          saturation,
        });
        setOutputUrl(URL.createObjectURL(res.blob));
        setOutputMeta({ sizeBytes: res.blob.size, width: res.width, height: res.height, ext: res.ext });
      } else if (mode === 'sepia-vintage') {
        const res = await applyColorAndToneFilter({
          file,
          mode: 'sepia',
          intensity: filterIntensity,
        });
        setOutputUrl(URL.createObjectURL(res.blob));
        setOutputMeta({ sizeBytes: res.blob.size, width: res.width, height: res.height, ext: res.ext });
      } else if (mode === 'duotone-studio') {
        const res = await applyColorAndToneFilter({
          file,
          mode: 'duotone',
          darkHex: duotoneDark,
          lightHex: duotoneLight,
        });
        setOutputUrl(URL.createObjectURL(res.blob));
        setOutputMeta({ sizeBytes: res.blob.size, width: res.width, height: res.height, ext: res.ext });
      } else if (mode === 'noise-reducer') {
        const res = await applyColorAndToneFilter({
          file,
          mode: 'denoise',
          intensity: filterIntensity,
        });
        setOutputUrl(URL.createObjectURL(res.blob));
        setOutputMeta({ sizeBytes: res.blob.size, width: res.width, height: res.height, ext: res.ext });
      } else if (mode === 'sharpen-booster') {
        const res = await applyColorAndToneFilter({
          file,
          mode: 'sharpen',
          intensity: filterIntensity,
        });
        setOutputUrl(URL.createObjectURL(res.blob));
        setOutputMeta({ sizeBytes: res.blob.size, width: res.width, height: res.height, ext: res.ext });
      } else if (mode === 'color-blindness') {
        const res = await applyColorAndToneFilter({
          file,
          mode: visionType,
        });
        setOutputUrl(URL.createObjectURL(res.blob));
        setOutputMeta({
          sizeBytes: res.blob.size,
          width: res.width,
          height: res.height,
          ext: res.ext,
          note: `Simulated: ${visionType}`,
        });
      } else if (mode === 'flip-rotate') {
        const res = await transformFlipRotate({
          file,
          rotateDeg,
          flipH,
          flipV,
        });
        setOutputUrl(URL.createObjectURL(res.blob));
        setOutputMeta({ sizeBytes: res.blob.size, width: res.width, height: res.height, ext: res.ext });
      } else if (mode === 'rounded-corners') {
        const res = await applyRoundedCorners({
          file,
          radiusPx: cornerRadius,
        });
        setOutputUrl(URL.createObjectURL(res.blob));
        setOutputMeta({
          sizeBytes: res.blob.size,
          width: res.width,
          height: res.height,
          ext: res.ext,
          note: `Transparent corners · ${cornerRadius}px radius`,
        });
      } else if (mode === 'photo-frame') {
        const res = await applyPhotoFrame({
          file,
          borderPx: frameThickness,
          frameColor,
          caption: frameCaption,
        });
        setOutputUrl(URL.createObjectURL(res.blob));
        setOutputMeta({ sizeBytes: res.blob.size, width: res.width, height: res.height, ext: res.ext });
      } else if (mode === 'png-to-ico') {
        const res = await generateMultiSizeIco(file);
        setOutputUrl(URL.createObjectURL(res.icoBlob));
        setOutputMeta({
          sizeBytes: res.icoBlob.size,
          ext: 'ico',
          note: `Multi-size ICO (${res.sizes.map((s) => `${s}x${s}`).join(', ')})`,
        });
      } else if (mode === 'pwa-icon-pack') {
        const pack = await generatePwaIconPack(file);
        setBatchDownloads(
          pack.map((item) => ({
            url: URL.createObjectURL(item.blob),
            name: item.filename,
            width: item.size,
            height: item.size,
            sizeBytes: item.blob.size,
          }))
        );
      } else if (mode === 'pdf-to-png') {
        const extracted = await extractImagesFromPdfOrRaw(file);
        if (extracted.length === 0) {
          setInfoNote(
            'No uncompressed raster JPEG streams were found inside this PDF. Scanned/image-embedded PDFs extract directly; vector or Flate-encoded PDFs require printing or exporting pages from a PDF viewer.'
          );
        } else {
          setBatchDownloads(
            extracted.map((item, i) => ({
              url: URL.createObjectURL(item.blob),
              name: `pdf-page-${i + 1}.png`,
              width: item.width,
              height: item.height,
              sizeBytes: item.blob.size,
            }))
          );
        }
      } else if (mode === 'gif-to-sprites') {
        const decoded = await decodeGifFramesAndSprite(file);
        setOutputUrl(URL.createObjectURL(decoded.spriteBlob));
        setOutputMeta({
          sizeBytes: decoded.spriteBlob.size,
          width: decoded.spriteWidth,
          height: decoded.spriteHeight,
          ext: 'png',
          note: `Combined Sprite Sheet (${decoded.frames.length} frames)`,
        });
        setBatchDownloads(
          decoded.frames.map((fr, i) => ({
            url: URL.createObjectURL(fr.blob),
            name: `gif-frame-${i + 1}.png`,
            width: Math.round(decoded.spriteWidth / Math.min(6, decoded.frames.length)),
            height: decoded.spriteHeight,
            sizeBytes: fr.blob.size,
          }))
        );
      } else if (mode === 'screenshot-mockup') {
        const res = await renderScreenshotMockup({
          file,
          theme: mockupTheme,
          padding: mockupPad,
        });
        setOutputUrl(URL.createObjectURL(res.blob));
        setOutputMeta({ sizeBytes: res.blob.size, width: res.width, height: res.height, ext: res.ext });
      } else if (mode === 'youtube-thumbnail') {
        const res = await coverResizeUnderLimit({
          file,
          width: 1280,
          height: 720,
          maxKb: 1950,
        });
        setOutputUrl(URL.createObjectURL(res.blob));
        setOutputMeta({
          sizeBytes: res.blob.size,
          width: res.width,
          height: res.height,
          ext: res.ext,
          note: res.note,
        });
      } else if (mode === 'banner-cropper') {
        const dims =
          bannerPreset === 'linkedin'
            ? { width: 1584, height: 396 }
            : bannerPreset === 'x'
            ? { width: 1500, height: 500 }
            : { width: 2560, height: 1440 };
        const res = await coverResizeUnderLimit({ file, ...dims });
        setOutputUrl(URL.createObjectURL(res.blob));
        setOutputMeta({
          sizeBytes: res.blob.size,
          width: res.width,
          height: res.height,
          ext: res.ext,
          note: `${dims.width}×${dims.height} cover preset`,
        });
      } else if (mode === 'whatsapp-dp') {
        const res = await renderSquareFitNoCrop({
          file,
          size: 1080,
          backdropMode: dpBackdrop,
          paddingPct: dpPad,
        });
        setOutputUrl(URL.createObjectURL(res.blob));
        setOutputMeta({
          sizeBytes: res.blob.size,
          width: res.width,
          height: res.height,
          ext: res.ext,
          note: '1080×1080 square fit with zero cropping',
        });
      } else if (mode === 'dpi-checker') {
        const res = await inspectAndRewriteDpi({ file, targetDpi });
        setDpiReport({ detectedDpi: res.detectedDpi, printInches: res.printInches });
        setOutputUrl(URL.createObjectURL(res.updatedBlob));
        setOutputMeta({
          sizeBytes: res.updatedBlob.size,
          width: res.width,
          height: res.height,
          ext: res.ext,
          note: `Rewritten to ${targetDpi} DPI · Print size ${res.printInches}`,
        });
      } else if (mode === 'histogram-viewer') {
        const stats = await computeHistogramTelemetry(file);
        setHistogramData(stats);
      } else if (mode === 'image-diff') {
        if (!diffSecondImage) {
          setErrorMsg('Please upload Image B to compare side-by-side.');
          return;
        }
        const diff = await computeImageDiff(file, diffSecondImage.file);
        setDiffSummary({
          changedPercent: diff.changedPercent,
          width: diff.width,
          height: diff.height,
        });
        setOutputUrl(URL.createObjectURL(diff.diffBlob));
        setOutputMeta({
          sizeBytes: diff.diffBlob.size,
          width: diff.width,
          height: diff.height,
          ext: 'png',
          note: `${diff.changedPercent}% pixels differ (highlighted in orange)`,
        });
      } else if (mode === 'sprite-slicer') {
        const tiles = await splitImageGrid(file, spriteCols, spriteRows);
        setBatchDownloads(
          tiles.map((t) => ({
            url: URL.createObjectURL(t.blob),
            name: `sprite-r${t.row}-c${t.col}.png`,
            width: Math.round((sourceImage?.width ?? 0) / spriteCols),
            height: Math.round((sourceImage?.height ?? 0) / spriteRows),
            sizeBytes: t.blob.size,
          }))
        );
      } else if (mode === 'raw-preview') {
        const res = await extractRawEmbeddedPreview(file);
        setOutputUrl(URL.createObjectURL(res.blob));
        setOutputMeta({
          sizeBytes: res.blob.size,
          width: res.width,
          height: res.height,
          ext: res.ext,
          note: res.note,
        });
      } else if (mode === 'meme-generator') {
        const res = await renderMemeCaption({
          file,
          topText: memeTop,
          bottomText: memeBottom,
          style: memeStyle,
          fontSizePct: memeSize,
        });
        setOutputUrl(URL.createObjectURL(res.blob));
        setOutputMeta({ sizeBytes: res.blob.size, width: res.width, height: res.height, ext: res.ext });
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Could not process this file in your browser.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const canRun =
    mode === 'og-image-maker' ||
    (isMultiMode && multiFiles.length > 0) ||
    (mode === 'image-diff' && Boolean(sourceImage) && Boolean(diffSecondImage)) ||
    (mode !== 'image-diff' && !isMultiMode && Boolean(rawUploadFile || sourceImage));

  const showRegionOverlay =
    mode === 'cropper' ||
    mode === 'blur-region' ||
    mode === 'pixelate-region' ||
    mode === 'watermark-remover';

  const maxHistBin = useMemo(() => {
    if (!histogramData) return 1;
    return Math.max(1, ...histogramData.lBins, ...histogramData.rBins, ...histogramData.gBins, ...histogramData.bBins);
  }, [histogramData]);

  return (
    <div className="hero-orange-glow py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Top Navigation + Privacy Badge */}
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
            <span aria-hidden="true">/</span>
            <span className="text-[#9CA3AF]">{title}</span>
          </nav>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-medium text-[#059669]">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Processed Locally</span>
          </span>
        </div>

        {/* Centered Headline */}
        <div className="mx-auto mt-5 max-w-3xl text-center">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl">
            {renderSplitHeadline(title)}
          </h1>
          <p className="mx-auto mt-2.5 max-w-2xl text-sm leading-relaxed text-[#6B7280] sm:text-base">
            {description}
          </p>
        </div>

        {/* Main Tool Container */}
        <div className="mx-auto mt-6 max-w-4xl">
          <input
            ref={fileInputRef}
            type="file"
            accept={fileAccept}
            multiple={isMultiMode}
            onChange={(e) => {
              const files = e.target.files ? Array.from(e.target.files) : [];
              if (files.length > 0) void loadFiles(files);
              e.target.value = '';
            }}
            className="sr-only"
          />

          {/* Mode-Specific Parameter Controls */}
          <div className="mb-5 rounded-2xl bg-white p-4 shadow-[0_8px_24px_-6px_rgba(17,24,39,0.08),0_4px_10px_-4px_rgba(234,88,12,0.08)] sm:p-5">
            {mode === 'cropper' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                    Aspect Preset:
                  </span>
                  {(['free', '16:9', '4:3', '1:1', '9:16'] as const).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleApplyCropPreset(preset)}
                      className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                        cropAspect === preset
                          ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                          : 'border-[#E5E7EB] bg-white text-[#4B5563]'
                      }`}
                    >
                      {cropAspect === preset && <Check className="h-3 w-3 text-[#EA580C]" />}
                      <span>{preset.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <label className="text-xs font-medium text-[#4B5563]">
                    Left X ({regionX}%)
                    <input
                      type="range"
                      min={0}
                      max={80}
                      value={regionX}
                      onChange={(e) => setRegionX(Number(e.target.value))}
                      className="mt-1 w-full accent-[#EA580C]"
                    />
                  </label>
                  <label className="text-xs font-medium text-[#4B5563]">
                    Top Y ({regionY}%)
                    <input
                      type="range"
                      min={0}
                      max={80}
                      value={regionY}
                      onChange={(e) => setRegionY(Number(e.target.value))}
                      className="mt-1 w-full accent-[#EA580C]"
                    />
                  </label>
                  <label className="text-xs font-medium text-[#4B5563]">
                    Width ({regionW}%)
                    <input
                      type="range"
                      min={10}
                      max={100 - regionX}
                      value={regionW}
                      onChange={(e) => setRegionW(Number(e.target.value))}
                      className="mt-1 w-full accent-[#EA580C]"
                    />
                  </label>
                  <label className="text-xs font-medium text-[#4B5563]">
                    Height ({regionH}%)
                    <input
                      type="range"
                      min={10}
                      max={100 - regionY}
                      value={regionH}
                      onChange={(e) => setRegionH(Number(e.target.value))}
                      className="mt-1 w-full accent-[#EA580C]"
                    />
                  </label>
                </div>
              </div>
            )}

            {(mode === 'blur-region' ||
              mode === 'pixelate-region' ||
              mode === 'watermark-remover') && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <label className="text-xs font-medium text-[#4B5563]">
                  X ({regionX}%)
                  <input
                    type="range"
                    min={0}
                    max={85}
                    value={regionX}
                    onChange={(e) => setRegionX(Number(e.target.value))}
                    className="mt-1 w-full accent-[#EA580C]"
                  />
                </label>
                <label className="text-xs font-medium text-[#4B5563]">
                  Y ({regionY}%)
                  <input
                    type="range"
                    min={0}
                    max={85}
                    value={regionY}
                    onChange={(e) => setRegionY(Number(e.target.value))}
                    className="mt-1 w-full accent-[#EA580C]"
                  />
                </label>
                <label className="text-xs font-medium text-[#4B5563]">
                  W ({regionW}%)
                  <input
                    type="range"
                    min={5}
                    max={100 - regionX}
                    value={regionW}
                    onChange={(e) => setRegionW(Number(e.target.value))}
                    className="mt-1 w-full accent-[#EA580C]"
                  />
                </label>
                <label className="text-xs font-medium text-[#4B5563]">
                  H ({regionH}%)
                  <input
                    type="range"
                    min={5}
                    max={100 - regionY}
                    value={regionH}
                    onChange={(e) => setRegionH(Number(e.target.value))}
                    className="mt-1 w-full accent-[#EA580C]"
                  />
                </label>
                {mode !== 'watermark-remover' && (
                  <label className="text-xs font-medium text-[#4B5563]">
                    Strength ({effectStrength})
                    <input
                      type="range"
                      min={6}
                      max={48}
                      value={effectStrength}
                      onChange={(e) => setEffectStrength(Number(e.target.value))}
                      className="mt-1 w-full accent-[#EA580C]"
                    />
                  </label>
                )}
              </div>
            )}

            {mode === 'bulk-resizer' && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setBulkMode('scale')}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                    bulkMode === 'scale'
                      ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                      : 'border-[#E5E7EB] text-[#4B5563]'
                  }`}
                >
                  Scale %
                </button>
                <button
                  type="button"
                  onClick={() => setBulkMode('width')}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                    bulkMode === 'width'
                      ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                      : 'border-[#E5E7EB] text-[#4B5563]'
                  }`}
                >
                  Exact Width (px)
                </button>
                {bulkMode === 'scale' ? (
                  <input
                    type="number"
                    min={10}
                    max={200}
                    value={bulkScale}
                    onChange={(e) => setBulkScale(Math.max(10, Number(e.target.value) || 50))}
                    className="h-8 w-20 rounded-xl border border-[#E5E7EB] px-2.5 font-mono text-xs"
                  />
                ) : (
                  <input
                    type="number"
                    min={100}
                    max={4000}
                    value={bulkWidth}
                    onChange={(e) => setBulkWidth(Math.max(50, Number(e.target.value) || 1200))}
                    className="h-8 w-24 rounded-xl border border-[#E5E7EB] px-2.5 font-mono text-xs"
                  />
                )}
                <select
                  value={outFmt}
                  onChange={(e) =>
                    setOutFmt(e.target.value as 'image/jpeg' | 'image/png' | 'image/webp')
                  }
                  className="h-8 rounded-xl border border-[#E5E7EB] bg-white px-2.5 text-xs font-semibold"
                >
                  <option value="image/jpeg">JPG</option>
                  <option value="image/png">PNG</option>
                  <option value="image/webp">WebP</option>
                </select>
              </div>
            )}

            {(mode === 'webp-convert' || mode === 'avif-convert') && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-[#6B7280]">Export Target:</span>
                {(['image/jpeg', 'image/png'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setOutFmt(fmt)}
                    className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold ${
                      outFmt === fmt
                        ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                        : 'border-[#E5E7EB] text-[#4B5563]'
                    }`}
                  >
                    {fmt === 'image/jpeg' ? 'JPG' : 'PNG'}
                  </button>
                ))}
              </div>
            )}

            {(mode === 'background-remover' ||
              mode === 'transparent-signature' ||
              mode === 'white-bg-studio') && (
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex-1 text-xs font-medium text-[#4B5563]">
                  Removal Tolerance ({bgTolerance})
                  <input
                    type="range"
                    min={8}
                    max={80}
                    value={bgTolerance}
                    onChange={(e) => setBgTolerance(Number(e.target.value))}
                    className="mt-1 w-full accent-[#EA580C]"
                  />
                </label>
                {mode === 'background-remover' && (
                  <div className="flex items-center gap-2">
                    {(['edge-sample', 'white-paper'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setBgSampleMode(m)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                          bgSampleMode === m
                            ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                            : 'border-[#E5E7EB] text-[#4B5563]'
                        }`}
                      >
                        {m === 'edge-sample' ? 'Auto Edge Color' : 'White Backdrop'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {mode === 'upscaler' && (
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  {([2, 4] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setUpscaleFactor(s)}
                      className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold ${
                        upscaleFactor === s
                          ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                          : 'border-[#E5E7EB] text-[#4B5563]'
                      }`}
                    >
                      {s}x Upscale
                    </button>
                  ))}
                </div>
                <label className="flex-1 text-xs font-medium text-[#4B5563]">
                  Edge Crispness ({sharpnessAmt}%)
                  <input
                    type="range"
                    min={0}
                    max={150}
                    value={sharpnessAmt}
                    onChange={(e) => setSharpnessAmt(Number(e.target.value))}
                    className="mt-1 w-full accent-[#EA580C]"
                  />
                </label>
              </div>
            )}

            {mode === 'watermark-adder' && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <input
                  type="text"
                  value={wmText}
                  onChange={(e) => setWmText(e.target.value)}
                  placeholder="Watermark text"
                  className="h-9 rounded-xl border border-[#E5E7EB] px-3 text-xs sm:col-span-2"
                />
                <select
                  value={wmLayout}
                  onChange={(e) =>
                    setWmLayout(e.target.value as 'bottom-right' | 'center' | 'tiled')
                  }
                  className="h-9 rounded-xl border border-[#E5E7EB] bg-white px-2.5 text-xs font-semibold"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="center">Center</option>
                  <option value="tiled">Diagonal Tiled</option>
                </select>
                <div className="flex items-center gap-2">
                  {['#FFFFFF', '#111827', '#EA580C'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setWmColor(c)}
                      aria-label={`Color ${c}`}
                      className={`h-7 w-7 rounded-full border-2 ${
                        wmColor === c ? 'border-[#EA580C]' : 'border-[#E5E7EB]'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="range"
                    min={20}
                    max={100}
                    value={Math.round(wmOpacity * 100)}
                    onChange={(e) => setWmOpacity(Number(e.target.value) / 100)}
                    className="w-20 accent-[#EA580C]"
                  />
                  <input
                    type="range"
                    min={50}
                    max={160}
                    value={wmSize}
                    onChange={(e) => setWmSize(Number(e.target.value))}
                    className="w-20 accent-[#EA580C]"
                  />
                </div>
              </div>
            )}

            {mode === 'flip-rotate' && (
              <div className="flex flex-wrap items-center gap-2">
                {[-90, 0, 90, 180].map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => setRotateDeg(deg)}
                    className={`rounded-xl border px-3 py-1.5 font-mono text-xs font-semibold ${
                      rotateDeg === deg
                        ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                        : 'border-[#E5E7EB] text-[#4B5563]'
                    }`}
                  >
                    {deg}°
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setFlipH((v) => !v)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                    flipH
                      ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                      : 'border-[#E5E7EB] text-[#4B5563]'
                  }`}
                >
                  Flip Horizontal
                </button>
                <button
                  type="button"
                  onClick={() => setFlipV((v) => !v)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                    flipV
                      ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                      : 'border-[#E5E7EB] text-[#4B5563]'
                  }`}
                >
                  Flip Vertical
                </button>
              </div>
            )}

            {mode === 'brightness-contrast' && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="text-xs font-medium text-[#4B5563]">
                  Brightness ({brightness}%)
                  <input
                    type="range"
                    min={40}
                    max={160}
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="mt-1 w-full accent-[#EA580C]"
                  />
                </label>
                <label className="text-xs font-medium text-[#4B5563]">
                  Contrast ({contrast}%)
                  <input
                    type="range"
                    min={40}
                    max={180}
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="mt-1 w-full accent-[#EA580C]"
                  />
                </label>
                <label className="text-xs font-medium text-[#4B5563]">
                  Saturation ({saturation}%)
                  <input
                    type="range"
                    min={0}
                    max={200}
                    value={saturation}
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    className="mt-1 w-full accent-[#EA580C]"
                  />
                </label>
              </div>
            )}

            {mode === 'grayscale-bw' && (
              <div className="flex flex-wrap items-center gap-3">
                {(['grayscale', 'bw-high'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setBwStyle(s)}
                    className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold ${
                      bwStyle === s
                        ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                        : 'border-[#E5E7EB] text-[#4B5563]'
                    }`}
                  >
                    {s === 'grayscale' ? 'Natural Grayscale' : 'Editorial High Contrast'}
                  </button>
                ))}
              </div>
            )}

            {(mode === 'sepia-vintage' ||
              mode === 'noise-reducer' ||
              mode === 'sharpen-booster') && (
              <label className="block text-xs font-medium text-[#4B5563]">
                Effect Intensity ({filterIntensity}%)
                <input
                  type="range"
                  min={15}
                  max={100}
                  value={filterIntensity}
                  onChange={(e) => setFilterIntensity(Number(e.target.value))}
                  className="mt-1 w-full accent-[#EA580C]"
                />
              </label>
            )}

            {mode === 'duotone-studio' && (
              <div className="flex flex-wrap items-center gap-3">
                {[
                  { name: 'Orange Glow', d: '#111827', l: '#F97316' },
                  { name: 'Midnight Teal', d: '#0F172A', l: '#2DD4BF' },
                  { name: 'Berry Sunset', d: '#4C1D95', l: '#FB7185' },
                ].map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setDuotoneDark(p.d);
                      setDuotoneLight(p.l);
                    }}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                      duotoneDark === p.d && duotoneLight === p.l
                        ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                        : 'border-[#E5E7EB] text-[#4B5563]'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}

            {mode === 'color-blindness' && (
              <div className="flex flex-wrap items-center gap-2">
                {(['deuteranopia', 'protanopia', 'tritanopia'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVisionType(v)}
                    className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold capitalize ${
                      visionType === v
                        ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                        : 'border-[#E5E7EB] text-[#4B5563]'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}

            {mode === 'rounded-corners' && (
              <label className="block text-xs font-medium text-[#4B5563]">
                Corner Radius ({cornerRadius}px)
                <input
                  type="range"
                  min={0}
                  max={250}
                  value={cornerRadius}
                  onChange={(e) => setCornerRadius(Number(e.target.value))}
                  className="mt-1 w-full accent-[#EA580C]"
                />
              </label>
            )}

            {mode === 'photo-frame' && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <select
                  value={frameColor}
                  onChange={(e) => setFrameColor(e.target.value)}
                  className="h-9 rounded-xl border border-[#E5E7EB] bg-white px-2.5 text-xs font-semibold"
                >
                  <option value="#FFFFFF">Classic Polaroid White</option>
                  <option value="#FFF7ED">Warm Cream Gallery</option>
                  <option value="#111827">Matte Black Frame</option>
                </select>
                <input
                  type="text"
                  value={frameCaption}
                  onChange={(e) => setFrameCaption(e.target.value)}
                  placeholder="Optional bottom caption..."
                  className="h-9 rounded-xl border border-[#E5E7EB] px-3 text-xs"
                />
                <label className="text-xs font-medium text-[#4B5563]">
                  Border ({frameThickness})
                  <input
                    type="range"
                    min={10}
                    max={80}
                    value={frameThickness}
                    onChange={(e) => setFrameThickness(Number(e.target.value))}
                    className="mt-1 w-full accent-[#EA580C]"
                  />
                </label>
              </div>
            )}

            {(mode === 'collage-maker' || mode === 'side-by-side') && (
              <div className="flex flex-wrap items-center gap-3">
                {(['grid-2x2', 'horizontal', 'vertical'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLayoutMode(l)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                      layoutMode === l
                        ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                        : 'border-[#E5E7EB] text-[#4B5563]'
                    }`}
                  >
                    {l === 'grid-2x2' ? 'Grid' : l === 'horizontal' ? 'Side by Side' : 'Vertical Stack'}
                  </button>
                ))}
                <label className="text-xs font-medium text-[#4B5563]">
                  Gap ({layoutGap}px)
                  <input
                    type="range"
                    min={0}
                    max={48}
                    value={layoutGap}
                    onChange={(e) => setLayoutGap(Number(e.target.value))}
                    className="ml-2 accent-[#EA580C]"
                  />
                </label>
                <select
                  value={layoutBg}
                  onChange={(e) => setLayoutBg(e.target.value)}
                  className="h-8 rounded-xl border border-[#E5E7EB] bg-white px-2 text-xs font-semibold"
                >
                  <option value="#FFFFFF">White Bg</option>
                  <option value="#FFF7ED">Warm Orange Bg</option>
                  <option value="#111827">Dark Bg</option>
                </select>
              </div>
            )}

            {mode === 'image-to-pdf' && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-[#6B7280]">PDF Page Size:</span>
                {(['a4', 'letter', 'fit'] as const).map((ps) => (
                  <button
                    key={ps}
                    type="button"
                    onClick={() => setPdfPageSize(ps)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold uppercase ${
                      pdfPageSize === ps
                        ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                        : 'border-[#E5E7EB] text-[#4B5563]'
                    }`}
                  >
                    {ps === 'fit' ? 'Fit Image' : ps}
                  </button>
                ))}
              </div>
            )}

            {mode === 'gif-maker' && (
              <div className="flex flex-wrap items-center gap-4">
                <label className="text-xs font-medium text-[#4B5563]">
                  Frame Delay ({gifDelayMs}ms)
                  <input
                    type="range"
                    min={100}
                    max={1200}
                    step={50}
                    value={gifDelayMs}
                    onChange={(e) => setGifDelayMs(Number(e.target.value))}
                    className="ml-2 accent-[#EA580C]"
                  />
                </label>
                <select
                  value={gifWidth}
                  onChange={(e) => setGifWidth(Number(e.target.value))}
                  className="h-8 rounded-xl border border-[#E5E7EB] bg-white px-2.5 text-xs font-semibold"
                >
                  <option value={320}>320px Small</option>
                  <option value={480}>480px Standard</option>
                  <option value={640}>640px HD</option>
                </select>
              </div>
            )}

            {mode === 'screenshot-mockup' && (
              <div className="flex flex-wrap items-center gap-3">
                {(['orange', 'slate', 'clean'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setMockupTheme(t)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold capitalize ${
                      mockupTheme === t
                        ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                        : 'border-[#E5E7EB] text-[#4B5563]'
                    }`}
                  >
                    {t} Backdrop
                  </button>
                ))}
                <label className="text-xs font-medium text-[#4B5563]">
                  Padding ({mockupPad})
                  <input
                    type="range"
                    min={15}
                    max={80}
                    value={mockupPad}
                    onChange={(e) => setMockupPad(Number(e.target.value))}
                    className="ml-2 accent-[#EA580C]"
                  />
                </label>
              </div>
            )}

            {mode === 'og-image-maker' && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={ogTitle}
                  onChange={(e) => setOgTitle(e.target.value)}
                  placeholder="Headline..."
                  className="h-9 rounded-xl border border-[#E5E7EB] px-3 text-xs sm:col-span-2"
                />
                <input
                  type="text"
                  value={ogSubtitle}
                  onChange={(e) => setOgSubtitle(e.target.value)}
                  placeholder="Subtitle..."
                  className="h-9 rounded-xl border border-[#E5E7EB] px-3 text-xs"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ogBrand}
                    onChange={(e) => setOgBrand(e.target.value)}
                    placeholder="domain.com"
                    className="h-9 flex-1 rounded-xl border border-[#E5E7EB] px-3 text-xs"
                  />
                  <select
                    value={ogTheme}
                    onChange={(e) => setOgTheme(e.target.value as 'orange' | 'white' | 'dark')}
                    className="h-9 rounded-xl border border-[#E5E7EB] bg-white px-2.5 text-xs font-semibold"
                  >
                    <option value="orange">Orange</option>
                    <option value="white">White</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
              </div>
            )}

            {mode === 'banner-cropper' && (
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'linkedin' as const, label: 'LinkedIn (1584×396)' },
                  { id: 'x' as const, label: 'X / Twitter (1500×500)' },
                  { id: 'yt' as const, label: 'YouTube (2560×1440)' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setBannerPreset(p.id)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                      bannerPreset === p.id
                        ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                        : 'border-[#E5E7EB] text-[#4B5563]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            {mode === 'whatsapp-dp' && (
              <div className="flex flex-wrap items-center gap-3">
                {(['blur', 'white', 'black', 'cream'] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setDpBackdrop(b)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold capitalize ${
                      dpBackdrop === b
                        ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                        : 'border-[#E5E7EB] text-[#4B5563]'
                    }`}
                  >
                    {b} Bg
                  </button>
                ))}
                <label className="text-xs font-medium text-[#4B5563]">
                  Padding ({dpPad}%)
                  <input
                    type="range"
                    min={0}
                    max={25}
                    value={dpPad}
                    onChange={(e) => setDpPad(Number(e.target.value))}
                    className="ml-2 accent-[#EA580C]"
                  />
                </label>
              </div>
            )}

            {mode === 'dpi-checker' && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-[#6B7280]">Target DPI:</span>
                {[72, 150, 300, 600].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setTargetDpi(d)}
                    className={`rounded-xl border px-3 py-1.5 font-mono text-xs font-semibold ${
                      targetDpi === d
                        ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                        : 'border-[#E5E7EB] text-[#4B5563]'
                    }`}
                  >
                    {d} DPI
                  </button>
                ))}
              </div>
            )}

            {mode === 'sprite-slicer' && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSpriteAction('slice');
                    clearOutputs();
                  }}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                    spriteAction === 'slice'
                      ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                      : 'border-[#E5E7EB] text-[#4B5563]'
                  }`}
                >
                  Slice Sheet
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSpriteAction('pack');
                    setLayoutMode('horizontal');
                    clearOutputs();
                  }}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                    spriteAction === 'pack'
                      ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                      : 'border-[#E5E7EB] text-[#4B5563]'
                  }`}
                >
                  Pack Multiple Sprites
                </button>
                {spriteAction === 'slice' && (
                  <div className="flex items-center gap-2 text-xs">
                    <label>
                      Cols
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={spriteCols}
                        onChange={(e) => setSpriteCols(Math.max(1, Number(e.target.value) || 2))}
                        className="ml-1.5 h-8 w-14 rounded-lg border border-[#E5E7EB] px-2 font-mono"
                      />
                    </label>
                    <label>
                      Rows
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={spriteRows}
                        onChange={(e) => setSpriteRows(Math.max(1, Number(e.target.value) || 2))}
                        className="ml-1.5 h-8 w-14 rounded-lg border border-[#E5E7EB] px-2 font-mono"
                      />
                    </label>
                  </div>
                )}
              </div>
            )}

            {mode === 'meme-generator' && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  value={memeTop}
                  onChange={(e) => setMemeTop(e.target.value)}
                  placeholder="Top caption..."
                  className="h-9 rounded-xl border border-[#E5E7EB] px-3 text-xs"
                />
                <input
                  type="text"
                  value={memeBottom}
                  onChange={(e) => setMemeBottom(e.target.value)}
                  placeholder="Bottom caption..."
                  className="h-9 rounded-xl border border-[#E5E7EB] px-3 text-xs"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={memeStyle}
                    onChange={(e) =>
                      setMemeStyle(e.target.value as 'classic-outline' | 'white-bar')
                    }
                    className="h-9 flex-1 rounded-xl border border-[#E5E7EB] bg-white px-2 text-xs font-semibold"
                  >
                    <option value="classic-outline">Classic Impact</option>
                    <option value="white-bar">White Top Bar</option>
                  </select>
                  <input
                    type="range"
                    min={50}
                    max={140}
                    value={memeSize}
                    onChange={(e) => setMemeSize(Number(e.target.value))}
                    className="w-20 accent-[#EA580C]"
                  />
                </div>
              </div>
            )}

            {(mode === 'png-to-ico' ||
              mode === 'pwa-icon-pack' ||
              mode === 'pdf-to-png' ||
              mode === 'gif-to-sprites' ||
              mode === 'youtube-thumbnail' ||
              mode === 'histogram-viewer' ||
              mode === 'image-diff' ||
              mode === 'raw-preview') && (
              <p className="text-xs font-medium text-[#6B7280]">
                {mode === 'image-diff'
                  ? 'Upload Image A and Image B below to compute pixel-level visual differences.'
                  : 'Upload your file below — instant browser processing with zero server uploads.'}
              </p>
            )}
          </div>

          {/* Single Dotted Upload Drop Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const files = Array.from(e.dataTransfer.files);
              if (files.length > 0) void loadFiles(files);
            }}
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dotted px-5 py-8 text-center transition-all ${
              isDragging
                ? 'border-[#F97316] bg-[#FFF7ED]/50 ring-4 ring-[#F97316]/15'
                : 'border-[#D1D5DB] bg-white hover:border-[#FDBA74]'
            }`}
          >
            {isMultiMode && multiFiles.length > 0 ? (
              <div className="w-full space-y-3 text-left">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-[#111827]">
                    {multiFiles.length} file{multiFiles.length > 1 ? 's' : ''} queued
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFF7ED] px-3 py-1.5 text-xs font-semibold text-[#C2410C]"
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                      <span>Upload More</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMultiFiles([]);
                        clearOutputs();
                      }}
                      className="rounded-xl bg-[#F3F4F6] px-3 py-1.5 text-xs font-semibold text-[#4B5563]"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {multiFiles.map((mf, i) => (
                    <div
                      key={`${mf.name}-${i}`}
                      className="rounded-xl bg-[#F9FAFB] p-2 text-xs"
                    >
                      {mf.previewUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mf.previewUrl}
                          alt={mf.name}
                          referrerPolicy="no-referrer"
                          className="h-20 w-full rounded-lg bg-white object-cover"
                        />
                      )}
                      <p className="mt-1.5 truncate font-semibold text-[#111827]">{mf.name}</p>
                      <p className="font-mono text-[10px] text-[#6B7280]">
                        {formatBytes(mf.sizeBytes)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : !isMultiMode && (sourceImage || rawUploadFile) ? (
              <div className="flex w-full flex-col gap-4 text-left sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3.5">
                  {sourceImage?.previewUrl ? (
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
                      {sourceImage?.name ?? rawUploadFile?.name}
                    </p>
                    <p className="font-mono text-xs text-[#6B7280] tabular-nums">
                      {formatBytes(sourceImage?.sizeBytes ?? rawUploadFile?.size ?? 0)}
                      {sourceImage?.width && sourceImage?.height
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
                  <span>Upload</span>
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center text-[#EA580C]">
                  <UploadCloud className="h-8 w-8" aria-hidden="true" />
                </div>
                <p className="mt-3 text-sm font-semibold text-[#111827]">
                  {mode === 'og-image-maker'
                    ? 'Optional: Upload a logo or icon badge'
                    : isMultiMode
                    ? 'Drag & drop or upload multiple images'
                    : 'Drag & drop, paste or upload a file'}
                </p>
                <p className="mt-1 text-xs text-[#6B7280]">
                  100% browser-side execution &middot; Private &amp; instant
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-orange-gradient inline-flex min-h-[40px] items-center gap-2 rounded-xl px-5 py-2 text-xs font-semibold"
                  >
                    <ImagePlus className="h-4 w-4" aria-hidden="true" />
                    <span>Upload</span>
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
              </>
            )}
          </div>

          {/* Second Image Input for Image Diff */}
          {mode === 'image-diff' && (
            <div className="mt-4 rounded-2xl border-2 border-dotted border-[#D1D5DB] bg-white p-4">
              <input
                ref={diffBInputRef}
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    const info = await inspectImageFile(f);
                    setDiffSecondImage(info);
                    clearOutputs();
                  }
                  e.target.value = '';
                }}
                className="sr-only"
              />
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#111827]">
                    Comparison Image B
                  </p>
                  <p className="truncate font-mono text-xs text-[#6B7280]">
                    {diffSecondImage
                      ? `${diffSecondImage.name} · ${diffSecondImage.width} × ${diffSecondImage.height} px`
                      : 'Upload second version to compare pixels'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => diffBInputRef.current?.click()}
                  className="btn-orange-gradient inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-semibold"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  <span>Upload</span>
                </button>
              </div>
            </div>
          )}

          {/* Visual Region Preview Box for Crop/Blur/Pixelate/Remove */}
          {showRegionOverlay && sourceImage?.previewUrl && (
            <div className="mt-4 rounded-2xl bg-white p-4 shadow-[0_8px_24px_-6px_rgba(17,24,39,0.08)]">
              <p className="mb-2 text-xs font-semibold text-[#4B5563]">
                Live Region Selection Preview
              </p>
              <div className="relative mx-auto w-fit overflow-hidden rounded-xl bg-[#F9FAFB]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sourceImage.previewUrl}
                  alt="Region guide"
                  referrerPolicy="no-referrer"
                  className="block max-h-72 w-auto object-contain"
                />
                <div
                  className="pointer-events-none absolute border-2 border-[#EA580C] bg-[#EA580C]/20"
                  style={{
                    left: `${regionX}%`,
                    top: `${regionY}%`,
                    width: `${regionW}%`,
                    height: `${regionH}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              disabled={!canRun || isProcessing}
              onClick={handleProcess}
              className="btn-orange-gradient inline-flex min-h-[42px] items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>
                {isProcessing ? 'Processing locally...' : 'Process Now'}
              </span>
            </button>
          </div>

          {errorMsg && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700">
              {errorMsg}
            </p>
          )}

          {infoNote && (
            <p className="mt-4 rounded-xl border border-[#FED7AA] bg-[#FFF7ED] px-4 py-2.5 text-xs font-medium text-[#C2410C]">
              {infoNote}
            </p>
          )}

          {/* Histogram Telemetry Output */}
          {histogramData && (
            <div className="card-orange-sheen mt-6 rounded-2xl p-5 shadow-[0_10px_28px_-6px_rgba(17,24,39,0.10)]">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-[11px] font-semibold text-[#9CA3AF]">DIMENSIONS</p>
                  <p className="mt-1 font-mono text-sm font-bold text-[#111827]">
                    {histogramData.width} × {histogramData.height}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-[11px] font-semibold text-[#9CA3AF]">MEGAPIXELS</p>
                  <p className="mt-1 font-mono text-sm font-bold text-[#111827]">
                    {histogramData.megapixels} MP
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-[11px] font-semibold text-[#9CA3AF]">AVG LUMINANCE</p>
                  <p className="mt-1 font-mono text-sm font-bold text-[#EA580C]">
                    {histogramData.avgBrightness}%
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-[11px] font-semibold text-[#9CA3AF]">ALPHA CHANNEL</p>
                  <p className="mt-1 font-mono text-sm font-bold text-[#111827]">
                    {histogramData.hasAlpha ? 'Transparent' : 'Opaque'}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs font-semibold text-[#4B5563]">
                Luminance &amp; RGB Distribution
              </p>
              <div className="mt-2 flex h-32 items-end gap-[2px] rounded-xl bg-white p-3">
                {histogramData.lBins.map((val, idx) => (
                  <div
                    key={idx}
                    className="flex-1 rounded-t-xs bg-[#F97316]"
                    style={{
                      height: `${Math.max(4, Math.round((val / maxHistBin) * 100))}%`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Single Output Download Card */}
          {outputUrl && outputMeta && (
            <div className="card-orange-sheen mt-6 rounded-2xl p-5 shadow-[0_12px_30px_-6px_rgba(17,24,39,0.12),0_4px_12px_-4px_rgba(234,88,12,0.12)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {outputMeta.ext !== 'pdf' && outputMeta.ext !== 'ico' && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={outputUrl}
                      alt="Processed preview"
                      referrerPolicy="no-referrer"
                      className="h-24 w-24 rounded-xl border border-[#E5E7EB] bg-white object-contain p-1"
                    />
                  )}
                  <div>
                    <p className="text-sm font-bold text-[#111827]">
                      Ready to Download
                    </p>
                    <p className="mt-0.5 font-mono text-xs font-medium text-[#059669] tabular-nums">
                      {formatBytes(outputMeta.sizeBytes)}
                      {outputMeta.width && outputMeta.height
                        ? ` · ${outputMeta.width} × ${outputMeta.height} px`
                        : ''}
                    </p>
                    {dpiReport && (
                      <p className="mt-0.5 font-mono text-xs text-[#4B5563]">
                        Detected: {dpiReport.detectedDpi} DPI &middot; Print: {dpiReport.printInches}
                      </p>
                    )}
                    {diffSummary && (
                      <p className="mt-0.5 font-mono text-xs text-[#EA580C]">
                        Difference: {diffSummary.changedPercent}% pixels changed
                      </p>
                    )}
                    {outputMeta.note && (
                      <p className="mt-0.5 text-xs text-[#6B7280]">{outputMeta.note}</p>
                    )}
                  </div>
                </div>

                <a
                  href={outputUrl}
                  download={`toolimg-${slug}.${outputMeta.ext}`}
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-[#059669] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#047857]"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span>Download .{outputMeta.ext.toUpperCase()}</span>
                </a>
              </div>
            </div>
          )}

          {/* Multi-Output Batch Downloads (Bulk, PWA Pack, PDF Pages, GIF Frames, Sprites) */}
          {batchDownloads.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold text-[#4B5563]">
                Generated {batchDownloads.length} files — click any item to download:
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {batchDownloads.map((item) => (
                  <a
                    key={item.name}
                    href={item.url}
                    download={item.name}
                    className="group rounded-2xl bg-white p-3 shadow-[0_8px_22px_-6px_rgba(17,24,39,0.08)] transition-all hover:-translate-y-0.5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="h-24 w-full rounded-xl bg-[#F9FAFB] object-contain p-1"
                    />
                    <p className="mt-2 truncate font-mono text-[11px] font-semibold text-[#111827]">
                      {item.name}
                    </p>
                    <p className="mt-0.5 flex items-center justify-between font-mono text-[10px] text-[#6B7280]">
                      <span>{formatBytes(item.sizeBytes)}</span>
                      <Download className="h-3 w-3 text-[#EA580C]" />
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Related Extended Utilities (marked nofollow) */}
        <div className="mt-12">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[#111827]">
            More Browser Utilities
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {siblingUtilities.map((rel) => (
              <Link
                key={rel.slug}
                href={rel.href}
                rel="nofollow"
                className="card-orange-sheen rounded-2xl p-4 shadow-[0_8px_22px_-6px_rgba(17,24,39,0.08),0_4px_10px_-4px_rgba(234,88,12,0.08)] transition-all hover:-translate-y-0.5"
              >
                <p className="text-sm font-bold text-[#111827]">{rel.title}</p>
                <p className="mt-1 text-xs text-[#6B7280]">{rel.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
