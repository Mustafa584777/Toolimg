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
  fileToDataUrl,
  formatBytes,
  inspectImageFile,
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
    <span>·</span>
    <span>800 × 450 px</span>
  </div>
</div>`;

const STARTER_CSS = `.card {
  width: 100%;
  height: 100%;
  padding: 48px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #2563EB 100%);
  color: #FFFFFF;
}
.pill {
  display: inline-block;
  width: fit-content;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(236, 253, 245, 0.16);
  color: #6EE7B7;
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
  color: #CBD5E1;
}
.meta {
  display: flex;
  gap: 10px;
  font-size: 14px;
  color: #93C5FD;
  font-weight: 600;
}`;

export function CreatorToolWorkspace({ tool }: { tool: CreatorToolRoute }) {
  const { pendingFile, setPendingFile } = useImageSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sourceImage, setSourceImage] = useState<InspectedImage | null>(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void loadFile(f);
    e.target.value = '';
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

    try {
      const dataUrl = await fileToDataUrl(sourceImage.file);
      const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/);
      const mimeType = mimeMatch?.[1] || sourceImage.mimeType || 'image/png';

      const response = await fetch('/api/gemini/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: tool.mode,
          imageBase64: dataUrl,
          mimeType,
          options: {
            codeStack,
            promptStyle,
            includeEnglishTranslation,
          },
        }),
      });

      const payload = (await response.json()) as {
        result?: string;
        error?: string;
      };
      if (!response.ok || payload.error) {
        throw new Error(payload.error || 'Processing failed.');
      }

      const cleaned = (payload.result ?? '')
        .replace(/^```[a-zA-Z]*\n?/, '')
        .replace(/\n?```$/, '')
        .trim();
      setTextOutput(cleaned);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Unable to process image right now.'
      );
    } finally {
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
    <div className="bg-[#F8FAFC] py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
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
          <span aria-hidden="true">/</span>
          <span className="text-[#64748B]">{tool.title}</span>
        </nav>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
              {tool.title}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-[#475569] sm:text-base">
              {tool.description}
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-medium text-[#059669]">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{tool.badge}</span>
          </span>
        </div>

        {/* HTML TO IMAGE WORKSPACE */}
        {tool.mode === 'html-to-image' ? (
          <div className="mt-6 space-y-5 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs sm:p-7">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A]">
                  HTML Markup
                </label>
                <textarea
                  rows={10}
                  value={htmlInput}
                  onChange={(e) => setHtmlInput(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 font-mono text-xs text-[#0F172A] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A]">
                  CSS Styles
                </label>
                <textarea
                  rows={10}
                  value={cssInput}
                  onChange={(e) => setCssInput(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 font-mono text-xs text-[#0F172A] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Export Options Bar */}
            <div className="flex flex-wrap items-end justify-between gap-4 border-t border-[#E2E8F0] pt-5">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#475569]">
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
                    className="mt-1 h-9 w-24 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 font-mono text-xs text-[#0F172A] tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#475569]">
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
                    className="mt-1 h-9 w-24 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 font-mono text-xs text-[#0F172A] tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#475569]">
                    Scale
                  </label>
                  <div className="mt-1 flex gap-1">
                    {([1, 2] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRenderScale(s)}
                        className={`h-9 rounded-lg px-3 font-mono text-xs font-medium ${
                          renderScale === s
                            ? 'bg-[#0F172A] text-white'
                            : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#475569]">
                    Format
                  </label>
                  <div className="mt-1 flex gap-1">
                    {(['image/png', 'image/jpeg', 'image/webp'] as const).map(
                      (fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setRenderFormat(fmt)}
                          className={`h-9 rounded-lg px-3 text-xs font-medium ${
                            renderFormat === fmt
                              ? 'bg-[#0F172A] text-white'
                              : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]'
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
                className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white shadow-xs transition-colors hover:bg-[#1D4ED8] disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                <span>Render Image</span>
              </button>
            </div>

            {errorMsg && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700">
                {errorMsg}
              </p>
            )}

            {/* Live Preview */}
            <div>
              <p className="mb-2 text-xs font-medium text-[#475569]">
                Live Sandbox Preview ({canvasWidth} × {canvasHeight} px):
              </p>
              <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                <iframe
                  title="HTML to Image Preview"
                  sandbox=""
                  srcDoc={previewHtmlDocument}
                  style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
                  className="mx-auto block rounded-lg border border-[#E2E8F0] bg-white"
                />
              </div>
            </div>

            {renderedUrl && renderedMeta && (
              <div className="flex flex-col gap-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={renderedUrl}
                    alt="Rendered HTML output"
                    referrerPolicy="no-referrer"
                    className="h-20 w-28 rounded-lg border border-[#E2E8F0] bg-white object-contain p-1"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">
                      Rendered Successfully
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-[#059669] tabular-nums">
                      {formatBytes(renderedMeta.sizeBytes)} ·{' '}
                      {renderedMeta.width} × {renderedMeta.height} px
                    </p>
                  </div>
                </div>
                <a
                  href={renderedUrl}
                  download={`html-render.${renderedMeta.ext}`}
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-[#059669] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#047857]"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span>Download .{renderedMeta.ext.toUpperCase()}</span>
                </a>
              </div>
            )}
          </div>
        ) : (
          /* VISION OCR / CODE / PROMPT WORKSPACE */
          <div className="mt-6 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs sm:p-7">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="sr-only"
            />

            <div className="flex flex-col gap-4 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3.5">
                {sourceImage?.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={sourceImage.previewUrl}
                    alt={sourceImage.name}
                    referrerPolicy="no-referrer"
                    className="h-14 w-14 shrink-0 rounded-lg border border-[#E2E8F0] bg-white object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#2563EB]">
                    <UploadCloud className="h-5 w-5" aria-hidden="true" />
                  </div>
                )}

                <div className="min-w-0">
                  {sourceImage ? (
                    <>
                      <p className="truncate text-sm font-semibold text-[#0F172A]">
                        {sourceImage.name}
                      </p>
                      <p className="font-mono text-xs text-[#475569] tabular-nums">
                        {sourceImage.formatLabel} ·{' '}
                        {formatBytes(sourceImage.sizeBytes)}
                        {sourceImage.width && sourceImage.height
                          ? ` · ${sourceImage.width} × ${sourceImage.height} px`
                          : ''}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-[#0F172A]">
                        Upload or try a sample image
                      </p>
                      <p className="text-xs text-[#475569]">
                        Supports PNG, JPG, and WebP screenshots or photos
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8]"
                >
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                  <span>{sourceImage ? 'Change Image' : 'Select Image'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleTrySample}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden="true" />
                  <span>Try Sample</span>
                </button>
              </div>
            </div>

            {/* Tool-specific controls */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              {tool.mode === 'hindi-handwriting-to-text' && (
                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#0F172A]">
                  <input
                    type="checkbox"
                    checked={includeEnglishTranslation}
                    onChange={(e) =>
                      setIncludeEnglishTranslation(e.target.checked)
                    }
                    className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB]"
                  />
                  <span>Also include English translation below Hindi text</span>
                </label>
              )}

              {tool.mode === 'image-to-code' && (
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'html-tailwind' as const, label: 'HTML + Tailwind CSS' },
                    { id: 'react-tailwind' as const, label: 'React JSX + Tailwind' },
                    { id: 'html-css' as const, label: 'HTML + Vanilla CSS' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setCodeStack(opt.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                        codeStack === opt.id
                          ? 'bg-[#0F172A] text-white'
                          : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {tool.mode === 'gemini-image-to-prompt' && (
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'midjourney' as const, label: 'Midjourney / Flux' },
                    { id: 'stable-diffusion' as const, label: 'Stable Diffusion Tags' },
                    { id: 'video' as const, label: 'AI Video Prompt' },
                    { id: 'json' as const, label: 'JSON Schema' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPromptStyle(opt.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                        promptStyle === opt.id
                          ? 'bg-[#0F172A] text-white'
                          : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                disabled={!sourceImage || isProcessing}
                onClick={runVisionTool}
                className="ml-auto inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white shadow-xs transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50"
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
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700">
                {errorMsg}
              </p>
            )}

            {textOutput && (
              <div className="mt-6 space-y-3 border-t border-[#E2E8F0] pt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#0F172A]">
                      Extracted Output
                    </span>
                    {tool.mode === 'image-to-code' &&
                      codeStack !== 'react-tailwind' && (
                        <div className="ml-2 flex rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-0.5">
                          <button
                            type="button"
                            onClick={() => setCodeTab('code')}
                            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${
                              codeTab === 'code'
                                ? 'bg-white text-[#0F172A] shadow-2xs'
                                : 'text-[#64748B]'
                            }`}
                          >
                            <Code2 className="h-3.5 w-3.5" />
                            <span>Code</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCodeTab('preview')}
                            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${
                              codeTab === 'preview'
                                ? 'bg-white text-[#0F172A] shadow-2xs'
                                : 'text-[#64748B]'
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
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-xs font-medium text-[#0F172A] hover:bg-white"
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
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#059669] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#047857]"
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
                        ? `<!doctype html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="p-6 bg-slate-50">${textOutput}</body></html>`
                        : textOutput
                    }
                    className="h-96 w-full rounded-xl border border-[#E2E8F0] bg-white"
                  />
                ) : (
                  <textarea
                    rows={12}
                    value={textOutput}
                    onChange={(e) => setTextOutput(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 font-mono text-xs leading-relaxed text-[#0F172A] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Sibling /tools/* links */}
        <div className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#0F172A]">
            More OCR, Code &amp; Creator Tools
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {CREATOR_TOOLS.filter((ct) => ct.slug !== tool.slug).map((ct) => (
              <Link
                key={ct.slug}
                href={ct.href}
                className="rounded-xl border border-[#E2E8F0] bg-white p-4 transition-colors hover:border-[#2563EB]/40"
              >
                <p className="text-sm font-semibold text-[#0F172A]">
                  {ct.title}
                </p>
                <p className="mt-1 text-xs text-[#475569]">{ct.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
