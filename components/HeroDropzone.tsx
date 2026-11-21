'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  FileImage,
  ImagePlus,
  Infinity as InfinityIcon,
  Lock,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { InspectedImage } from '@/lib/image-processor';
import { useImageSession } from '@/components/ImageSessionProvider';

interface QuickAction {
  label: string;
  href: string;
  primary?: boolean;
}

function formatReadableBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export function HeroDropzone() {
  const router = useRouter();
  const { setPendingFile } = useImageSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspected, setInspected] = useState<InspectedImage | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (inspected?.previewUrl) {
        URL.revokeObjectURL(inspected.previewUrl);
      }
    };
  }, [inspected]);

  const handleFile = useCallback(async (file: File) => {
    setErrorMsg(null);
    setIsInspecting(true);
    try {
      const { inspectImageFile } = await import('@/lib/image-processor');
      const result = await inspectImageFile(file);
      setInspected((prev) => {
        if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
        return result;
      });
    } catch {
      setErrorMsg('Unable to read this file. Please choose a valid image.');
    } finally {
      setIsInspecting(false);
    }
  }, []);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            void handleFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [handleFile]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) {
        void handleFile(droppedFile);
      }
    },
    [handleFile]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      void handleFile(selected);
    }
    e.target.value = '';
  };

  const handleTrySample = async () => {
    setIsInspecting(true);
    setErrorMsg(null);
    try {
      const { createSampleImageFile } = await import('@/lib/image-processor');
      const sampleFile = await createSampleImageFile();
      await handleFile(sampleFile);
    } catch {
      setErrorMsg('Could not generate sample image in this browser.');
      setIsInspecting(false);
    }
  };

  const handleClear = () => {
    if (inspected?.previewUrl) {
      URL.revokeObjectURL(inspected.previewUrl);
    }
    setInspected(null);
    setPendingFile(null);
    setErrorMsg(null);
  };

  const launchToolWithImage = (href: string) => {
    if (inspected?.file) {
      setPendingFile(inspected.file);
    }
    router.push(href);
  };

  const getQuickActions = (img: InspectedImage): QuickAction[] => {
    const actions: QuickAction[] = [];

    if (img.isHeic) {
      actions.push({
        label: 'Convert HEIC to JPG',
        href: '/convert/heic-to-jpg',
        primary: true,
      });
      actions.push({
        label: 'HEIC to PNG',
        href: '/heic-to-png',
      });
    } else if (img.isSvg) {
      actions.push({
        label: 'SVG to 4K PNG',
        href: '/convert/svg-to-png',
        primary: true,
      });
      actions.push({
        label: 'Convert to WebP',
        href: '/convert/svg-to-png?format=webp',
      });
    } else {
      actions.push({
        label: 'Compress to 50KB',
        href: '/compress/compress-image-to-50kb',
        primary: true,
      });
      actions.push({
        label: 'Compress to 20KB',
        href: '/compress-image-to-20kb',
      });
    }

    actions.push({
      label: 'Handwriting to Text',
      href: '/tools/handwriting-to-text',
    });
    actions.push({
      label: 'Image to Code',
      href: '/tools/image-to-code',
    });
    actions.push({
      label: 'Image to Prompt',
      href: '/tools/gemini-image-to-prompt',
    });
    actions.push({
      label: 'Strip EXIF Data',
      href: '/privacy-dev/remove-exif-data',
    });
    actions.push({
      label: 'Circle Crop',
      href: '/social-resize/circle-crop-image',
    });
    actions.push({
      label: 'Convert to WebP',
      href: '/convert/heic-to-jpg?format=webp',
    });

    const seen = new Set<string>();
    return actions.filter((a) => {
      if (seen.has(a.href)) return false;
      seen.add(a.href);
      return true;
    });
  };

  return (
    <section className="hero-orange-glow relative border-b border-[#F3F4F6] pt-8 pb-14 sm:pt-12 sm:pb-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          {/* Subtle top pill link */}
          <Link
            href="#tools"
            className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-[#374151] shadow-[0_2px_10px_rgba(17,24,39,0.06)] transition-colors hover:bg-[#FFF7ED]/60"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#F97316]" aria-hidden="true" />
            <span>100% Browser-Based</span>
            <span className="h-3.5 w-px bg-[#E5E7EB]" aria-hidden="true" />
            <span className="font-semibold text-[#EA580C]">Explore tools &rarr;</span>
          </Link>

          <h1 className="mt-5 font-[family-name:var(--font-display)] text-[clamp(2.2rem,4.6vw,3.5rem)] font-extrabold leading-[1.08] tracking-tight text-[#111827] text-balance">
            All Image Tools{' '}
            <span className="relative inline-block">
              <span className="text-orange-gradient">Right in Your Browser</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 280 14"
                fill="none"
                className="pointer-events-none absolute -bottom-1.5 left-0 h-3 w-full"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="heroCurveGrad" x1="0" y1="0" x2="280" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#F97316" />
                    <stop offset="100%" stopColor="#EA580C" />
                  </linearGradient>
                </defs>
                <path
                  d="M3 10.5C75 3.2 195 2.4 277 9.5"
                  stroke="url(#heroCurveGrad)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#6B7280] sm:text-lg">
            Compress to exact KB, convert HEIC/SVG, strip EXIF metadata, and
            resize for social media. No server uploads, no file limits, 100%
            free forever.
          </p>

        </div>

        {/* Interactive Quick-Start Smart Dropzone */}
        <div className="mx-auto mt-7 max-w-4xl">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`overflow-hidden rounded-2xl border-2 border-dotted px-4 py-8 transition-all sm:px-6 sm:py-10 ${
              isDragging
                ? 'border-[#F97316] bg-[#FFF7ED]/50 ring-4 ring-[#F97316]/15'
                : 'border-[#D1D5DB] bg-white hover:border-[#FDBA74]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif,.svg"
              onChange={handleFileChange}
              className="sr-only"
              aria-label="Choose an image file to inspect and process"
            />

            {!inspected ? (
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex items-center justify-center text-[#EA580C]">
                  <UploadCloud className="h-8 w-8" aria-hidden="true" />
                </div>

                <h2 className="mt-4 font-[family-name:var(--font-display)] text-base font-semibold text-[#111827] sm:text-lg">
                  {isInspecting
                    ? 'Inspecting image locally...'
                    : 'Drag & drop, paste or select an image'}
                </h2>
                <p className="mt-1 text-xs text-[#6B7280] sm:text-sm">
                  Supports JPG, PNG, WebP, HEIC, and SVG · Processed in browser
                  memory
                </p>

                {errorMsg && (
                  <p className="mt-3 text-xs font-medium text-red-600" role="alert">
                    {errorMsg}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-orange-gradient inline-flex min-h-[42px] items-center gap-2 whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2"
                  >
                    <ImagePlus className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Select Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTrySample}
                    disabled={isInspecting}
                    className="inline-flex min-h-[42px] items-center gap-2 whitespace-nowrap rounded-xl bg-[#F9FAFB] px-4 py-2.5 text-sm font-semibold text-[#111827] transition-colors hover:bg-[#FFF7ED] hover:text-[#C2410C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2 disabled:opacity-60"
                  >
                    <Sparkles className="h-4 w-4 shrink-0 text-[#F97316]" aria-hidden="true" />
                    <span>Try Sample Image</span>
                  </button>
                </div>

                <p className="mt-4 text-[11px] text-[#9CA3AF]">
                  or drag &amp; drop, paste (Ctrl + V) your file anywhere here
                </p>
              </div>
            ) : (
              /* Inspected Image State + 1-Click Quick Action Pills */
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="relative flex h-36 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] sm:h-40 sm:w-48">
                  {inspected.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={inspected.previewUrl}
                      alt={inspected.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-contain p-1.5"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                      <FileImage className="h-8 w-8 text-[#EA580C]" aria-hidden="true" />
                      <span className="font-mono text-xs font-medium text-[#4B5563]">
                        {inspected.formatLabel} File Ready
                      </span>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-[family-name:var(--font-display)] text-base font-semibold text-[#111827]">
                        {inspected.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-xs text-[#6B7280] tabular-nums">
                        <span className="font-semibold text-[#EA580C]">
                          {inspected.formatLabel}
                        </span>
                        <span aria-hidden="true">&middot;</span>
                        <span>{formatReadableBytes(inspected.sizeBytes)}</span>
                        {inspected.width && inspected.height && (
                          <>
                            <span aria-hidden="true">&middot;</span>
                            <span>
                              {inspected.width} &times; {inspected.height} px
                            </span>
                          </>
                        )}
                        <span aria-hidden="true">&middot;</span>
                        <span className="font-medium text-[#059669]">
                          {inspected.hasExifMarkers
                            ? 'EXIF metadata detected'
                            : 'Ready locally'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleClear}
                      aria-label="Clear selected image"
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-[#EA580C] transition-colors hover:text-[#C2410C]"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  <p className="mt-4 text-xs font-medium text-[#4B5563]">
                    Choose a 1-click action to open with this image:
                  </p>

                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {getQuickActions(inspected).map((action) => (
                      <button
                        key={action.href}
                        type="button"
                        onClick={() => launchToolWithImage(action.href)}
                        className={`inline-flex min-h-[38px] items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] ${
                          action.primary
                            ? 'btn-orange-gradient'
                            : 'bg-[#F9FAFB] text-[#111827] hover:bg-[#FFF7ED] hover:text-[#C2410C]'
                        }`}
                      >
                        <span>{action.label}</span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-[#EA580C] hover:underline"
                    >
                      Drop or choose a different file
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4-Item Inline Feature Strip (No horizontal scroll on mobile) */}
          <div className="mx-auto mt-7 grid grid-cols-2 gap-x-4 gap-y-3.5 sm:grid-cols-4 sm:gap-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex shrink-0 items-center justify-center text-[#EA580C]">
                <Zap className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[#111827]">
                  Fast &amp; Reliable
                </p>
                <p className="truncate text-[11px] text-[#6B7280]">
                  Results in milliseconds
                </p>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex shrink-0 items-center justify-center text-[#EA580C]">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[#111827]">
                  Zero Uploads
                </p>
                <p className="truncate text-[11px] text-[#6B7280]">
                  Private on your device
                </p>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex shrink-0 items-center justify-center text-[#EA580C]">
                <InfinityIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[#111827]">
                  Free &amp; Unlimited
                </p>
                <p className="truncate text-[11px] text-[#6B7280]">
                  No watermarks or caps
                </p>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex shrink-0 items-center justify-center text-[#EA580C]">
                <Lock className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[#111827]">
                  Exact Specs
                </p>
                <p className="truncate text-[11px] text-[#6B7280]">
                  KB, DPI &amp; social sizes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
