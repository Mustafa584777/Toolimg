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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface UpcomingToolItem {
  title: string;
  description: string;
  Icon: LucideIcon;
}

const UPCOMING_IMAGE_TOOLS: UpcomingToolItem[] = [
  {
    title: 'Image Cropper & Aspect Ratio Editor',
    description: 'Crop photos freely or lock 16:9, 4:3, 1:1, and 9:16 social ratios.',
    Icon: Crop,
  },
  {
    title: 'Bulk Image Resizer',
    description: 'Resize multiple photos by exact pixels or percentage scale at once.',
    Icon: Maximize2,
  },
  {
    title: 'WebP to JPG & PNG Converter',
    description: 'Decode modern WebP images back into classic JPG or PNG files.',
    Icon: FileImage,
  },
  {
    title: 'AVIF to PNG & JPG Converter',
    description: 'Convert next-gen AVIF images into widely supported formats locally.',
    Icon: Layers,
  },
  {
    title: 'Image Background Remover',
    description: 'Isolate portraits and products cleanly with transparent cutouts.',
    Icon: Scissors,
  },
  {
    title: 'AI Image Upscaler (2x & 4x)',
    description: 'Enhance low-resolution photos into sharp HD and 4K exports.',
    Icon: ZoomIn,
  },
  {
    title: 'Photo Watermark Adder',
    description: 'Stamp custom logos, tiled text, or copyright marks onto images.',
    Icon: Stamp,
  },
  {
    title: 'Watermark & Object Remover',
    description: 'Cleanly erase unwanted stamps, blemishes, or clutter from photos.',
    Icon: Eraser,
  },
  {
    title: 'Blur Faces & Sensitive Text',
    description: 'Redact license plates, faces, and ID numbers before sharing online.',
    Icon: EyeOff,
  },
  {
    title: 'Pixelate Image Region',
    description: 'Apply adjustable mosaic pixelation blocks to selected areas.',
    Icon: Grid,
  },
  {
    title: 'Grayscale & Black-and-White Filter',
    description: 'Convert color photos into crisp monochrome and editorial B&W.',
    Icon: Contrast,
  },
  {
    title: 'Flip & Rotate Image (90° / 180°)',
    description: 'Mirror horizontally, flip vertically, or straighten tilted angles.',
    Icon: FlipHorizontal2,
  },
  {
    title: 'Brightness & Contrast Editor',
    description: 'Fine-tune exposure, saturation, highlights, and shadows live.',
    Icon: SunMedium,
  },
  {
    title: 'Rounded Corners Image Maker',
    description: 'Apply smooth custom border radius with transparent PNG corners.',
    Icon: Square,
  },
  {
    title: 'Photo Frame & Border Studio',
    description: 'Add Polaroid, clean gallery borders, and padding around photos.',
    Icon: Frame,
  },
  {
    title: 'Image Collage Maker',
    description: 'Combine multiple photos into clean grid layouts and photo strips.',
    Icon: LayoutGrid,
  },
  {
    title: 'Side-by-Side Image Merger',
    description: 'Stitch two or more images horizontally or vertically seamlessly.',
    Icon: CopyCheck,
  },
  {
    title: 'PNG to ICO Favicon Generator',
    description: 'Bundle 16x16, 32x32, and 48x48 multi-size website favicons.',
    Icon: Monitor,
  },
  {
    title: 'App & PWA Icon Pack Generator',
    description: 'Export full Android, iOS, and Web Manifest icon bundles from one PNG.',
    Icon: Sticker,
  },
  {
    title: 'Image to PDF Converter',
    description: 'Merge JPG and PNG scans into clean A4 or Letter PDF documents.',
    Icon: FileText,
  },
  {
    title: 'PDF Pages to High-Res PNG',
    description: 'Render individual PDF pages as crisp PNG or JPG snapshots.',
    Icon: FileSpreadsheet,
  },
  {
    title: 'Animated GIF Maker from Photos',
    description: 'Sequence frames into smooth looping GIFs with speed controls.',
    Icon: Film,
  },
  {
    title: 'GIF to Sprite Sheet & Frames',
    description: 'Extract every frame from animated GIFs as PNGs or sprite grids.',
    Icon: RotateCw,
  },
  {
    title: 'Screenshot Mockup Frame Maker',
    description: 'Wrap app screenshots in sleek browser windows and gradient backdrops.',
    Icon: ImageIcon,
  },
  {
    title: 'Social Media OG Image Maker',
    description: 'Build crisp 1200x630 Open Graph link preview banners fast.',
    Icon: Sparkles,
  },
  {
    title: 'YouTube Thumbnail Resizer',
    description: 'Size and optimize 1280x720 thumbnails strictly under 2MB.',
    Icon: Youtube,
  },
  {
    title: 'LinkedIn & X Banner Cropper',
    description: 'Fit wide header cover photos without clipped profile overlaps.',
    Icon: SlidersHorizontal,
  },
  {
    title: 'WhatsApp DP Square No-Crop Fit',
    description: 'Add blur or solid background padding to fit full photos in DPs.',
    Icon: Minimize2,
  },
  {
    title: 'Transparent Signature Maker',
    description: 'Clean white paper off scanned ink signatures for digital PDFs.',
    Icon: Wand,
  },
  {
    title: 'White Background Product Studio',
    description: 'Center e-commerce product shots on pure #FFFFFF backgrounds.',
    Icon: Palette,
  },
  {
    title: 'Sepia & Vintage Film Filter',
    description: 'Apply warm analog film grain, fade, and classic sepia tones.',
    Icon: Film,
  },
  {
    title: 'Duotone & Gradient Map Studio',
    description: 'Recolor highlights and shadows with bold two-tone brand palettes.',
    Icon: Palette,
  },
  {
    title: 'Image Noise & Grain Reducer',
    description: 'Smooth low-light digital speckles while preserving crisp edges.',
    Icon: SlidersHorizontal,
  },
  {
    title: 'Photo Sharpen & Clarity Booster',
    description: 'Restore crisp detail on slightly soft portraits and scans.',
    Icon: ZoomIn,
  },
  {
    title: 'Image DPI & Print Size Checker',
    description: 'Inspect and adjust 300 DPI print resolution metadata for posters.',
    Icon: Printer,
  },
  {
    title: 'Image Histogram & Info Viewer',
    description: 'View RGB luminance graphs, bit depth, and color profile metrics.',
    Icon: ScanEye,
  },
  {
    title: 'Color Blindness Image Simulator',
    description: 'Preview UI graphics for deuteranopia, protanopia, and tritanopia.',
    Icon: EyeOff,
  },
  {
    title: 'Image Diff & Visual Compare',
    description: 'Spot pixel-level differences between two image versions side-by-side.',
    Icon: GitCompare,
  },
  {
    title: 'Sprite Sheet Slicer & Packer',
    description: 'Slice game tile sheets or pack individual PNG sprites cleanly.',
    Icon: Grid,
  },
  {
    title: 'RAW / DNG Preview to JPG',
    description: 'Extract embedded full-size previews from camera RAW files.',
    Icon: FileImage,
  },
  {
    title: 'Meme Text & Caption Generator',
    description: 'Add bold outlined captions and clean spacing above or on images.',
    Icon: Type,
  },
];

export function UpcomingImageTools() {
  return (
    <section
      aria-label="Upcoming Image Tools"
      className="border-b border-[#F3F4F6] bg-white py-14 sm:py-16"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight text-[#4B5563] sm:text-3xl">
            Upcoming Image Tools ({UPCOMING_IMAGE_TOOLS.length})
          </h2>
          <p className="mt-2 text-sm text-[#9CA3AF]">
            More browser-first image utilities currently in development.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {UPCOMING_IMAGE_TOOLS.map((tool, index) => {
            const Icon = tool.Icon;
            return (
              <article
                key={tool.title}
                className="upcoming-grey-card relative flex h-full cursor-default select-none flex-col justify-between overflow-hidden rounded-2xl bg-[#F3F4F6] p-3.5 shadow-[0_10px_26px_-6px_rgba(17,24,39,0.10),0_4px_10px_-4px_rgba(17,24,39,0.06)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_36px_-8px_rgba(17,24,39,0.16)] sm:p-5"
              >
                <div className="opacity-65">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="inline-flex min-w-0 items-start gap-1.5 font-[family-name:var(--font-display)] text-[13px] font-bold leading-snug text-[#4B5563] sm:gap-2 sm:text-base">
                      <Icon
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#9CA3AF] sm:h-5 sm:w-5"
                        aria-hidden="true"
                      />
                      <span className="line-clamp-2 min-h-[2.25rem] sm:min-h-[2.75rem]">
                        {tool.title}
                      </span>
                    </h3>
                    <span className="mt-0.5 shrink-0 font-mono text-[10px] font-semibold text-[#9CA3AF] tabular-nums sm:text-xs">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-[#6B7280] sm:mt-2 sm:line-clamp-3 sm:text-sm">
                    {tool.description}
                  </p>
                </div>

                {/* Grey Launching Soon Overlay */}
                <div className="upcoming-grey-overlay pointer-events-none absolute inset-0 flex items-center justify-center bg-[#F3F4F6]/50">
                  <span className="upcoming-grey-badge rounded-lg bg-[#E5E7EB]/95 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#4B5563] shadow-2xs sm:px-3.5 sm:py-1.5 sm:text-xs">
                    Launching Soon
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
