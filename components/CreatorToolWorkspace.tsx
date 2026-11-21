'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Code2,
  Copy,
  Download,
  Eye,
  ImagePlus,
  Loader2,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createSampleHandwritingFile,
  createSampleHindiHandwritingFile,
  createSampleImageFile,
  createSampleUiScreenshotFile,
  formatBytes,
  inspectImageFile,
  prepareVisionImagePayload,
  renderHtmlToImageBlob,
  type InspectedImage,
} from '@/lib/image-processor';
import { CREATOR_TOOLS, type CreatorToolRoute } from '@/lib/tools-data';
import { useImageSession } from '@/components/ImageSessionProvider';

const STARTER_HTML = `<div class="card">
  <span class="pill">Client-Side Export</span>
  <h1>Ship crisp social graphics from raw HTML &amp; CSS</h1>
  <p>Edit this markup or paste your own card, badge, or invoice layout to render a Retina PNG instantly.</p>
  <div class="meta">
    <span>toolimg.online</span>
    <span>&middot;</span>
    <span>800 &times; 450 px</span>
  </div>
</div>`;

const STARTER_CSS = `.card {
  width: 100%;
  height: 100%;
  padding: 48px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: linear-gradient(135deg, #111827 0%, #7C2D12 55%, #EA580C 100%);
  color: #FFFFFF;
}
.pill {
  display: inline-block;
  width: fit-content;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255, 237, 213, 0.18);
  color: #FDBA74;
  font-size: 14px;
  font-weight: 600;
}
h1 {
  margin: 20px 0 12px;
  font-size: 38px;
  line-height: 1.15;
  letter-spacing: -0.02em;
}
p {
  margin: 0;
  font-size: 18px;
  line-height: 1.5;
  color: #F3F4F6;
}
.meta {
  display: flex;
  gap: 10px;
  font-size: 14px;
  color: #FED7AA;
  font-weight: 600;
}`;

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

export function CreatorToolWorkspace({ tool }: { tool: CreatorToolRoute }) {
  const { pendingFile, setPendingFile } = useImageSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sourceImage, setSourceImage] = useState<InspectedImage | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [textOutput, setTextOutput] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Specific options
  const [includeEnglishTranslation, setIncludeEnglishTranslation] = useState(false);
  const [codeStack, setCodeStack] = useState<
    'html-tailwind' | 'react-tailwind' | 'html-css'
  >('html-tailwind');
  const [codeTab, setCodeTab] = useState<'code' | 'preview'>('code');
  const [promptStyle, setPromptStyle] = useState<
    'midjourney' | 'stable-diffusion' | 'video' | 'json'
  >('midjourney');

  // HTML-to-Image state
  const [htmlInput, setHtmlInput] = useState(STARTER_HTML);
  const [cssInput, setCssInput] = useState(STARTER_CSS);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(450);
  const [renderScale, setRenderScale] = useState<1 | 2>(2);
  const [renderFormat, setRenderFormat] = useState<
    'image/png' | 'image/jpeg' | 'image/webp'
  >('image/png');
  const [renderedUrl, setRenderedUrl] = useState<string | null>(null);
  const [renderedMeta, setRenderedMeta] = useState<{
    sizeBytes: number;
    width: number;
    height: number;
    ext: string;
  } | null>(null);

  const loadFile = useCallback(async (file: File) => {
    setErrorMsg(null);
    setTextOutput('');
    try {
      const inspected = await inspectImageFile(file);
      setSourceImage((prev) => {
        if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
        return inspected;
      });
    } catch {
      setErrorMsg('Could not load this image file.');
    }
  }, []);

  useEffect(() => {
    if (!pendingFile || tool.mode === 'html-to-image') return;
    let active = true;
    const fileToLoad = pendingFile;
    Promise.resolve().then(() => {
      if (!active) return;
      setPendingFile(null);
      void loadFile(fileToLoad);
    });
    return () => {
      active = false;
    };
  }, [pendingFile, setPendingFile, loadFile, tool.mode]);

  useEffect(() => {
    if (tool.mode === 'html-to-image') return;
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            void loadFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [loadFile, tool.mode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void loadFile(f);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void loadFile(f);
  };

  const handleTrySample = async () => {
    setErrorMsg(null);
    let sample: File;
    if (tool.mode === 'handwriting-to-text') {
      sample = await createSampleHandwritingFile();
    } else if (tool.mode === 'hindi-handwriting-to-text') {
      sample = await createSampleHindiHandwritingFile();
    } else if (tool.mode === 'image-to-code') {
      sample = await createSampleUiScreenshotFile();
    } else {
      sample = await createSampleImageFile();
    }
    await loadFile(sample);
  };

  const handleCopy = async () => {
    if (!textOutput) return;
    try {
      await navigator.clipboard.writeText(textOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const runVisionTool = async () => {
    if (!sourceImage || tool.mode === 'html-to-image') return;
    setIsProcessing(true);
    setErrorMsg(null);
    setTextOutput('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 14_500);

    try {
      const { blob, mimeType } = await prepareVisionImagePayload(
        sourceImage.file
      );

      const formData = new FormData();
      formData.append('tool', tool.mode);
      formData.append(
        'image',
        new File([blob], 'vision-input.jpg', { type: mimeType })
      );
      formData.append(
        'options',
        JSON.stringify({
          codeStack,
          promptStyle,
          includeEnglishTranslation,
        })
      );

      const response = await fetch('/api/gemini/vision', {
        method: 'POST',
        signal: controller.signal,
        body: formData,
      });

      const rawText = await response.text();
      let payload: { result?: string; error?: string } = {};
      try {
        payload = JSON.parse(rawText) as { result?: string; error?: string };
      } catch {
        throw new Error('INVALID_RESPONSE');
      }

      if (!response.ok || payload.error) {
        throw new Error('HIGH_DEMAND');
      }

      const cleaned = (payload.result ?? '')
        .trim()
        .replace(/^```[a-zA-Z]*\s*\n?/, '')
        .replace(/\n?```\s*$/, '')
        .trim();

      if (!cleaned) {
        throw new Error('EMPTY_RESULT');
      }

      setTextOutput(cleaned);
    } catch {
      setTextOutput('');
      setErrorMsg('This tool is in high demand. Please try later.');
    } finally {
      clearTimeout(timeoutId);
      setIsProcessing(false);
    }
  };

  const runHtmlToImage = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await renderHtmlToImageBlob({
        html: htmlInput,
        css: cssInput,
        width: canvasWidth,
        height: canvasHeight,
        scale: renderScale,
        format: renderFormat,
        backgroundColor: '#FFFFFF',
      });
      setRenderedUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(res.blob);
      });
      setRenderedMeta({
        sizeBytes: res.blob.size,
        width: res.pixelWidth,
        height: res.pixelHeight,
        ext:
          renderFormat === 'image/jpeg'
            ? 'jpg'
            : renderFormat === 'image/webp'
            ? 'webp'
            : 'png',
      });
    } catch {
      setErrorMsg(
        'Could not render this HTML snippet. Ensure all tags are properly structured.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const previewHtmlDocument = `<!doctype html><html><head><style>body{margin:0;font-family:system-ui,-apple-system,sans-serif;}${cssInput}</style></head><body>${htmlInput}</body></html>`;

  return (
    <div className="hero-orange-glow py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
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
            <span className="text-[#9CA3AF]">{tool.title}</span>
          </nav>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-medium text-[#059669]">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{tool.badge}</span>
          </span>
        </div>

        <div className="mx-auto mt-5 max-w-3xl text-center">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl">
            {renderSplitHeadline(tool.title)}
          </h1>
          <p className="mx-auto mt-2.5 max-w-2xl text-sm leading-relaxed text-[#6B7280] sm:text-base">
            {tool.description}
          </p>
        </div>

        {/* Horizontal Format / Mode Strip Above Upload Box */}
        {tool.mode === 'image-to-code' && (
          <div className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Format:
            </span>
            {[
              { id: 'html-tailwind' as const, label: 'HTML + Tailwind CSS' },
              { id: 'react-tailwind' as const, label: 'React JSX + Tailwind' },
              { id: 'html-css' as const, label: 'HTML + Vanilla CSS' },
            ].map((opt) => {
              const active = codeStack === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCodeStack(opt.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C] shadow-[0_1px_3px_rgba(249,115,22,0.15)]'
                      : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#FDBA74]'
                  }`}
                >
                  {active && <Check className="h-3 w-3 text-[#EA580C]" aria-hidden="true" />}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {tool.mode === 'gemini-image-to-prompt' && (
          <div className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Style:
            </span>
            {[
              { id: 'midjourney' as const, label: 'Midjourney / Flux' },
              { id: 'stable-diffusion' as const, label: 'Stable Diffusion Tags' },
              { id: 'video' as const, label: 'AI Video Prompt' },
              { id: 'json' as const, label: 'JSON Schema' },
            ].map((opt) => {
              const active = promptStyle === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPromptStyle(opt.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all ${
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
          </div>
        )}

        {/* HTML TO IMAGE WORKSPACE */}
        {tool.mode === 'html-to-image' ? (
          <div className="mx-auto mt-6 max-w-4xl space-y-5 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_8px_30px_-10px_rgba(17,24,39,0.08)] sm:p-7">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#111827]">
                  HTML Markup
                </label>
                <textarea
                  rows={10}
                  value={htmlInput}
                  onChange={(e) => setHtmlInput(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-3 font-mono text-xs text-[#111827] focus:border-[#F97316] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827]">
                  CSS Styles
                </label>
                <textarea
                  rows={10}
                  value={cssInput}
                  onChange={(e) => setCssInput(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-3 font-mono text-xs text-[#111827] focus:border-[#F97316] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Export Options Bar */}
            <div className="flex flex-wrap items-end justify-between gap-4 border-t border-[#F3F4F6] pt-5">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6B7280]">
                    Width (px)
                  </label>
                  <input
                    type="number"
                    min={200}
                    max={2400}
                    value={canvasWidth}
                    onChange={(e) =>
                      setCanvasWidth(Math.max(200, Number(e.target.value) || 800))
                    }
                    className="mt-1 h-9 w-24 rounded-xl border border-[#E5E7EB] bg-white px-2.5 font-mono text-xs text-[#111827] tabular-nums focus:border-[#F97316] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280]">
                    Height (px)
                  </label>
                  <input
                    type="number"
                    min={150}
                    max={2400}
                    value={canvasHeight}
                    onChange={(e) =>
                      setCanvasHeight(Math.max(150, Number(e.target.value) || 450))
                    }
                    className="mt-1 h-9 w-24 rounded-xl border border-[#E5E7EB] bg-white px-2.5 font-mono text-xs text-[#111827] tabular-nums focus:border-[#F97316] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280]">
                    Scale
                  </label>
                  <div className="mt-1 flex gap-1.5">
                    {([1, 2] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRenderScale(s)}
                        className={`h-9 rounded-xl border px-3 font-mono text-xs font-semibold ${
                          renderScale === s
                            ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                            : 'border-[#E5E7EB] bg-white text-[#4B5563]'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280]">
                    Format
                  </label>
                  <div className="mt-1 flex gap-1.5">
                    {(['image/png', 'image/jpeg', 'image/webp'] as const).map(
                      (fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setRenderFormat(fmt)}
                          className={`h-9 rounded-xl border px-3 text-xs font-semibold ${
                            renderFormat === fmt
                              ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                              : 'border-[#E5E7EB] bg-white text-[#4B5563]'
                          }`}
                        >
                          {fmt === 'image/png'
                            ? 'PNG'
                            : fmt === 'image/jpeg'
                            ? 'JPG'
                            : 'WebP'}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={runHtmlToImage}
                className="btn-orange-gradient inline-flex min-h-[42px] items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                <span>Render Image</span>
              </button>
            </div>

            {errorMsg && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700">
                {errorMsg}
              </p>
            )}

            {/* Live Preview */}
            <div>
              <p className="mb-2 text-xs font-medium text-[#6B7280]">
                Live Sandbox Preview ({canvasWidth} &times; {canvasHeight} px):
              </p>
              <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-3">
                <iframe
                  title="HTML to Image Preview"
                  sandbox=""
                  srcDoc={previewHtmlDocument}
                  style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
                  className="mx-auto block rounded-lg border border-[#E5E7EB] bg-white"
                />
              </div>
            </div>

            {renderedUrl && renderedMeta && (
              <div className="card-orange-sheen flex flex-col gap-4 rounded-xl border border-[#FED7AA] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={renderedUrl}
                    alt="Rendered HTML output"
                    referrerPolicy="no-referrer"
                    className="h-20 w-28 rounded-xl border border-[#E5E7EB] bg-white object-contain p-1"
                  />
                  <div>
                    <p className="text-sm font-bold text-[#111827]">
                      Rendered Successfully
                    </p>
                    <p className="mt-0.5 font-mono text-xs font-medium text-[#059669] tabular-nums">
                      {formatBytes(renderedMeta.sizeBytes)} &middot;{' '}
                      {renderedMeta.width} &times; {renderedMeta.height} px
                    </p>
                  </div>
                </div>
                <a
                  href={renderedUrl}
                  download={`html-render.${renderedMeta.ext}`}
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-[#059669] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#047857]"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span>Download .{renderedMeta.ext.toUpperCase()}</span>
                </a>
              </div>
            )}
          </div>
        ) : (
          /* VISION OCR / CODE / PROMPT WORKSPACE */
          <div className="mx-auto mt-6 max-w-4xl">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="sr-only"
            />

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
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#F9FAFB] px-4 py-2 text-xs font-semibold text-[#111827] hover:bg-[#FFF7ED] hover:text-[#C2410C]"
                    >
                      <ImagePlus className="h-4 w-4 text-[#EA580C]" aria-hidden="true" />
                      <span>Change Image</span>
                    </button>
                  </div>
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
                    Supports PNG, JPG, and WebP screenshots or photos
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

            {/* Tool-specific controls */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              {tool.mode === 'hindi-handwriting-to-text' && (
                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#111827]">
                  <input
                    type="checkbox"
                    checked={includeEnglishTranslation}
                    onChange={(e) =>
                      setIncludeEnglishTranslation(e.target.checked)
                    }
                    className="h-4 w-4 rounded border-[#D1D5DB] accent-[#EA580C]"
                  />
                  <span>Also include English translation below Hindi text</span>
                </label>
              )}

              <button
                type="button"
                disabled={!sourceImage || isProcessing}
                onClick={runVisionTool}
                className="btn-orange-gradient ml-auto inline-flex min-h-[42px] items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                <span>
                  {isProcessing
                    ? 'Analyzing image...'
                    : tool.mode === 'image-to-code'
                    ? 'Generate Code'
                    : tool.mode === 'gemini-image-to-prompt'
                    ? 'Generate Prompt'
                    : 'Extract Text'}
                </span>
              </button>
            </div>

            {errorMsg && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700">
                {errorMsg}
              </p>
            )}

            {textOutput && (
              <div className="mt-6 space-y-3 border-t border-[#F3F4F6] pt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#111827]">
                      Extracted Output
                    </span>
                    {tool.mode === 'image-to-code' &&
                      codeStack !== 'react-tailwind' && (
                        <div className="ml-2 flex rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-0.5">
                          <button
                            type="button"
                            onClick={() => setCodeTab('code')}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                              codeTab === 'code'
                                ? 'bg-white text-[#EA580C] shadow-2xs'
                                : 'text-[#6B7280]'
                            }`}
                          >
                            <Code2 className="h-3.5 w-3.5" />
                            <span>Code</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCodeTab('preview')}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                              codeTab === 'preview'
                                ? 'bg-white text-[#EA580C] shadow-2xs'
                                : 'text-[#6B7280]'
                            }`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Preview</span>
                          </button>
                        </div>
                      )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#111827] hover:border-[#FDBA74] hover:bg-[#FFF7ED]"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#059669]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Output</span>
                        </>
                      )}
                    </button>
                    <a
                      href={`data:text/plain;charset=utf-8,${encodeURIComponent(
                        textOutput
                      )}`}
                      download={`${tool.slug}.${
                        tool.mode === 'image-to-code' ? 'html' : 'txt'
                      }`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#059669] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#047857]"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>

                {tool.mode === 'image-to-code' &&
                codeTab === 'preview' &&
                codeStack !== 'react-tailwind' ? (
                  <iframe
                    title="Generated Code Preview"
                    sandbox=""
                    srcDoc={
                      codeStack === 'html-tailwind'
                        ? `<!doctype html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="p-6 bg-white">${textOutput}</body></html>`
                        : textOutput
                    }
                    className="h-96 w-full rounded-xl border border-[#E5E7EB] bg-white"
                  />
                ) : (
                  <textarea
                    rows={12}
                    value={textOutput}
                    onChange={(e) => setTextOutput(e.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-4 font-mono text-xs leading-relaxed text-[#111827] focus:border-[#F97316] focus:bg-white focus:outline-none"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* 4-Step Workflow Strip */}
        <div className="mt-12">
          <div className="text-center">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-extrabold text-[#111827] sm:text-2xl">
              How {tool.title} Works in{' '}
              <span className="text-orange-gradient">4 Simple Steps</span>
            </h2>
            <p className="mt-1.5 text-xs text-[#6B7280] sm:text-sm">
              Clean, production-ready output in seconds
            </p>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: 'STEP 01',
                title: 'Provide Your Input',
                copy:
                  tool.mode === 'html-to-image'
                    ? 'Edit or paste your HTML markup and CSS styles into the live workspace.'
                    : 'Upload, paste (Ctrl+V), or test a built-in sample image in one click.',
              },
              {
                step: 'STEP 02',
                title: 'Choose Output Format',
                copy: 'Select your target framework, prompt structure, or export dimensions.',
              },
              {
                step: 'STEP 03',
                title: 'Instant Conversion',
                copy: 'Generate clean code, structured text, or crisp Retina exports immediately.',
              },
              {
                step: 'STEP 04',
                title: 'Copy or Download',
                copy: 'Preview live output, copy to clipboard, or save files directly to disk.',
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

        {/* Sibling /tools/* links */}
        <div className="mt-12">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[#111827]">
            More OCR, Code &amp; Creator Tools
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {CREATOR_TOOLS.filter((ct) => ct.slug !== tool.slug).map((ct) => (
              <Link
                key={ct.slug}
                href={ct.href}
                className="card-orange-sheen rounded-2xl border border-[#E5E7EB] p-4 transition-all hover:-translate-y-0.5 hover:border-[#FDBA74]"
              >
                <p className="text-sm font-bold text-[#111827]">
                  {ct.title}
                </p>
                <p className="mt-1 text-xs text-[#6B7280]">{ct.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
