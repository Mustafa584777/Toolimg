'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ArrowRight,
  FileImage,
  ImagePlus,
  Lock,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createSampleImageFile,
  formatBytes,
  inspectImageFile,
  type InspectedImage,
} from '@/lib/image-processor';
import { useImageSession } from '@/components/ImageSessionProvider';

interface QuickAction {
  label: string;
  href: string;
  primary?: boolean;
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
    actions.push({
      label: 'Encode Base64',
      href: '/privacy-dev/image-to-base64',
    });

    // Deduplicate by href
    const seen = new Set<string>();
    return actions.filter((a) => {
      if (seen.has(a.href)) return false;
      seen.add(a.href);
      return true;
    });
  };

  return (
    <section className="relative border-b border-[#E2E8F0] bg-[#F8FAFC] pt-10 pb-14 sm:pt-14 sm:pb-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.15rem,4.2vw,3.35rem)] font-bold leading-[1.1] tracking-tight text-[#0F172A] text-balance">
              Private, Instant Image Tools — Right in Your Browser
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#475569] sm:text-lg">
              Compress to exact KB, convert HEIC/SVG, strip EXIF metadata, and
              resize for social media. No server uploads, no file limits, 100%
              free forever.
            </p>
          </motion.div>
        </div>

        {/* Interactive Quick-Start Smart Dropzone */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-8 max-w-4xl"
        >
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`rounded-2xl border bg-white p-5 transition-all sm:p-7 ${
              isDragging
                ? 'border-[#2563EB] bg-[#EFF6FF]/60 ring-4 ring-[#2563EB]/10'
                : 'border-[#E2E8F0] shadow-xs hover:border-[#CBD5E1]'
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
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC]/70 px-4 py-9 text-center sm:py-11">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#2563EB] shadow-2xs">
                  <UploadCloud className="h-6 w-6" aria-hidden="true" />
                </div>

                <h2 className="mt-4 font-[family-name:var(--font-display)] text-base font-semibold text-[#0F172A] sm:text-lg">
                  {isInspecting
                    ? 'Inspecting image locally...'
                    : 'Drop an image here to start instantly'}
                </h2>
                <p className="mt-1 text-xs text-[#475569] sm:text-sm">
                  Supports JPG, PNG, WebP, HEIC, and SVG · Processed in browser
                  memory
                </p>

                {errorMsg && (
                  <p className="mt-3 text-xs font-medium text-red-600" role="alert">
                    {errorMsg}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex min-h-[42px] items-center gap-2 whitespace-nowrap rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white shadow-xs transition-colors hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
                  >
                    <ImagePlus className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Select Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTrySample}
                    disabled={isInspecting}
                    className="inline-flex min-h-[42px] items-center gap-2 whitespace-nowrap rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-medium text-[#0F172A] transition-colors hover:border-[#CBD5E1] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:opacity-60"
                  >
                    <Sparkles className="h-4 w-4 shrink-0 text-[#2563EB]" aria-hidden="true" />
                    <span>Try Sample Image</span>
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[#64748B]">
                  <span className="inline-flex items-center gap-1.5 text-[#059669] font-medium">
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                    Zero network uploads
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>No daily file limits</span>
                  <span aria-hidden="true">·</span>
                  <span>Instant local preview</span>
                </div>
              </div>
            ) : (
              /* Inspected Image State + 1-Click Quick Action Pills */
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                {/* Thumbnail Preview */}
                <div className="relative flex h-36 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] sm:h-40 sm:w-48">
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
                      <FileImage className="h-8 w-8 text-[#2563EB]" aria-hidden="true" />
                      <span className="font-mono text-xs font-medium text-[#475569]">
                        {inspected.formatLabel} File Ready
                      </span>
                    </div>
                  )}
                </div>

                {/* Metadata + Quick 1-Click Action Pills */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-[family-name:var(--font-display)] text-base font-semibold text-[#0F172A]">
                        {inspected.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-xs text-[#475569] tabular-nums">
                        <span className="font-semibold text-[#2563EB]">
                          {inspected.formatLabel}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{formatBytes(inspected.sizeBytes)}</span>
                        {inspected.width && inspected.height && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>
                              {inspected.width} × {inspected.height} px
                            </span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span className="text-[#059669]">
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
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  <p className="mt-4 text-xs font-medium text-[#475569]">
                    Choose a 1-click action to open with this image:
                  </p>

                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {getQuickActions(inspected).map((action) => (
                      <button
                        key={action.href}
                        type="button"
                        onClick={() => launchToolWithImage(action.href)}
                        className={`inline-flex min-h-[38px] items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                          action.primary
                            ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                            : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] hover:border-[#2563EB]/40 hover:bg-[#EFF6FF] hover:text-[#1D4ED8]'
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
                      className="text-xs font-medium text-[#2563EB] hover:underline"
                    >
                      Drop or choose a different file
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
