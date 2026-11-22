import Link from 'next/link';
import {
  Contrast,
  CopyCheck,
  Crop,
  Eraser,
  EyeOff,
  FileImage,
  FileSpreadsheet,
  FileText,
  Film,
  FlipHorizontal2,
  Frame,
  GitCompare,
  Grid,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Monitor,
  Palette,
  Printer,
  RotateCw,
  ScanEye,
  Scissors,
  SlidersHorizontal,
  Sparkles,
  Square,
  Stamp,
  Sticker,
  SunMedium,
  Type,
  Wand,
  Youtube,
  ZoomIn,
  type LucideIcon,
} from 'lucide-react';
import {
  EXTENDED_TOOLS,
  type ExtendedIconName,
} from '@/lib/extended-tools-data';

const ICON_MAP: Record<ExtendedIconName, LucideIcon> = {
  Contrast,
  CopyCheck,
  Crop,
  Eraser,
  EyeOff,
  FileImage,
  FileSpreadsheet,
  FileText,
  Film,
  FlipHorizontal2,
  Frame,
  GitCompare,
  Grid,
  ImageIcon,
  Layers,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Monitor,
  Palette,
  Printer,
  RotateCw,
  ScanEye,
  Scissors,
  SlidersHorizontal,
  Sparkles,
  Square,
  Stamp,
  Sticker,
  SunMedium,
  Type,
  Wand,
  Youtube,
  ZoomIn,
};

export function UpcomingImageTools() {
  return (
    <section
      id="extended-utilities"
      aria-label="Extended Image Utilities"
      className="border-b border-[#F3F4F6] bg-white py-14 sm:py-16"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight text-[#111827] sm:text-3xl">
            <span className="mr-2 font-medium text-[#F97316]" aria-hidden="true">
              &rsaquo;
            </span>
            Extended Image{' '}
            <span className="text-orange-gradient">
              Utilities ({EXTENDED_TOOLS.length})
            </span>
            <span className="ml-2 font-medium text-[#F97316]" aria-hidden="true">
              &lsaquo;
            </span>
          </h2>
          <p className="mt-2 text-sm text-[#6B7280]">
            Instant browser-side image editors, converters, redaction tools, and
            export generators.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {EXTENDED_TOOLS.map((tool, index) => {
            const Icon = ICON_MAP[tool.iconName] ?? ImageIcon;
            return (
              <article
                key={tool.slug}
                className="card-orange-sheen group relative flex h-full flex-col justify-between rounded-2xl p-3.5 shadow-[0_10px_28px_-6px_rgba(17,24,39,0.10),0_4px_12px_-4px_rgba(234,88,12,0.08)] transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[0_22px_44px_-10px_rgba(17,24,39,0.16),0_10px_22px_-8px_rgba(234,88,12,0.22)] sm:p-5"
              >
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center justify-center text-[#EA580C]">
                      <Icon
                        className="h-7 w-7 transition-transform duration-200 group-hover:scale-110 sm:h-8 sm:w-8"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="mt-0.5 shrink-0 font-mono text-[10px] font-semibold text-[#EA580C]/80 tabular-nums sm:text-xs">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <h3 className="mt-2.5 min-w-0 font-[family-name:var(--font-display)] text-[13px] font-bold leading-snug text-[#111827] sm:mt-3 sm:text-base">
                    <Link
                      href={tool.href}
                      rel="nofollow"
                      className="block text-left transition-colors group-hover:text-[#EA580C] after:absolute after:inset-0 after:z-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-[#F97316]"
                    >
                      <span className="line-clamp-2 min-h-[2.25rem] sm:min-h-[2.75rem]">
                        {tool.title}
                      </span>
                    </Link>
                  </h3>

                  <p className="mt-1.5 line-clamp-2 min-h-[2.25rem] text-[11px] leading-relaxed text-[#6B7280] sm:mt-2 sm:line-clamp-3 sm:min-h-[3.75rem] sm:text-sm">
                    {tool.description}
                  </p>
                </div>

                <div className="mt-3 border-t border-[#F3F4F6] pt-2.5 sm:mt-4 sm:pt-3.5">
                  <span className="inline-flex items-center rounded-md bg-[#FFF7ED] px-2 py-0.5 text-[10px] font-semibold text-[#C2410C] sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-xs">
                    {tool.badge}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
