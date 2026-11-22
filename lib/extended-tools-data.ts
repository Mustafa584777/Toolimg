export type ExtendedToolMode =
  | 'cropper'
  | 'bulk-resizer'
  | 'webp-convert'
  | 'avif-convert'
  | 'background-remover'
  | 'upscaler'
  | 'watermark-adder'
  | 'watermark-remover'
  | 'blur-region'
  | 'pixelate-region'
  | 'grayscale-bw'
  | 'flip-rotate'
  | 'brightness-contrast'
  | 'rounded-corners'
  | 'photo-frame'
  | 'collage-maker'
  | 'side-by-side'
  | 'png-to-ico'
  | 'pwa-icon-pack'
  | 'image-to-pdf'
  | 'pdf-to-png'
  | 'gif-maker'
  | 'gif-to-sprites'
  | 'screenshot-mockup'
  | 'og-image-maker'
  | 'youtube-thumbnail'
  | 'banner-cropper'
  | 'whatsapp-dp'
  | 'transparent-signature'
  | 'white-bg-studio'
  | 'sepia-vintage'
  | 'duotone-studio'
  | 'noise-reducer'
  | 'sharpen-booster'
  | 'dpi-checker'
  | 'histogram-viewer'
  | 'color-blindness'
  | 'image-diff'
  | 'sprite-slicer'
  | 'raw-preview'
  | 'meme-generator';

export type ExtendedIconName =
  | 'Contrast'
  | 'CopyCheck'
  | 'Crop'
  | 'Eraser'
  | 'EyeOff'
  | 'FileImage'
  | 'FileSpreadsheet'
  | 'FileText'
  | 'Film'
  | 'FlipHorizontal2'
  | 'Frame'
  | 'GitCompare'
  | 'Grid'
  | 'ImageIcon'
  | 'Layers'
  | 'LayoutGrid'
  | 'Maximize2'
  | 'Minimize2'
  | 'Monitor'
  | 'Palette'
  | 'Printer'
  | 'RotateCw'
  | 'ScanEye'
  | 'Scissors'
  | 'SlidersHorizontal'
  | 'Sparkles'
  | 'Square'
  | 'Stamp'
  | 'Sticker'
  | 'SunMedium'
  | 'Type'
  | 'Wand'
  | 'Youtube'
  | 'ZoomIn';

export interface ExtendedToolItem {
  slug: string;
  href: string;
  title: string;
  description: string;
  iconName: ExtendedIconName;
  mode: ExtendedToolMode;
  badge: string;
}

export const EXTENDED_TOOLS: ExtendedToolItem[] = [
  {
    slug: 'image-cropper',
    href: '/utility/image-cropper',
    title: 'Image Cropper & Aspect Ratio Editor',
    description: 'Crop photos freely or lock 16:9, 4:3, 1:1, and 9:16 social ratios.',
    iconName: 'Crop',
    mode: 'cropper',
    badge: 'Browser Cropper',
  },
  {
    slug: 'bulk-image-resizer',
    href: '/utility/bulk-image-resizer',
    title: 'Bulk Image Resizer',
    description: 'Resize multiple photos by exact pixels or percentage scale at once.',
    iconName: 'Maximize2',
    mode: 'bulk-resizer',
    badge: 'Multi-File Batch',
  },
  {
    slug: 'webp-to-jpg-png',
    href: '/utility/webp-to-jpg-png',
    title: 'WebP to JPG & PNG Converter',
    description: 'Decode modern WebP images back into classic JPG or PNG files.',
    iconName: 'FileImage',
    mode: 'webp-convert',
    badge: 'Instant Decode',
  },
  {
    slug: 'avif-to-png-jpg',
    href: '/utility/avif-to-png-jpg',
    title: 'AVIF to PNG & JPG Converter',
    description: 'Convert next-gen AVIF images into widely supported formats locally.',
    iconName: 'Layers',
    mode: 'avif-convert',
    badge: 'Local Convert',
  },
  {
    slug: 'image-background-remover',
    href: '/utility/image-background-remover',
    title: 'Image Background Remover',
    description: 'Isolate portraits and products cleanly with transparent cutouts.',
    iconName: 'Scissors',
    mode: 'background-remover',
    badge: 'Alpha Cutout',
  },
  {
    slug: 'ai-image-upscaler',
    href: '/utility/ai-image-upscaler',
    title: 'AI Image Upscaler (2x & 4x)',
    description: 'Enhance low-resolution photos into sharp HD and 4K exports.',
    iconName: 'ZoomIn',
    mode: 'upscaler',
    badge: '2x / 4x HD',
  },
  {
    slug: 'photo-watermark-adder',
    href: '/utility/photo-watermark-adder',
    title: 'Photo Watermark Adder',
    description: 'Stamp custom logos, tiled text, or copyright marks onto images.',
    iconName: 'Stamp',
    mode: 'watermark-adder',
    badge: 'Custom Stamp',
  },
  {
    slug: 'watermark-object-remover',
    href: '/utility/watermark-object-remover',
    title: 'Watermark & Object Remover',
    description: 'Cleanly erase unwanted stamps, blemishes, or clutter from photos.',
    iconName: 'Eraser',
    mode: 'watermark-remover',
    badge: 'Patch Inpaint',
  },
  {
    slug: 'blur-faces-sensitive-text',
    href: '/utility/blur-faces-sensitive-text',
    title: 'Blur Faces & Sensitive Text',
    description: 'Redact license plates, faces, and ID numbers before sharing online.',
    iconName: 'EyeOff',
    mode: 'blur-region',
    badge: 'Privacy Redact',
  },
  {
    slug: 'pixelate-image-region',
    href: '/utility/pixelate-image-region',
    title: 'Pixelate Image Region',
    description: 'Apply adjustable mosaic pixelation blocks to selected areas.',
    iconName: 'Grid',
    mode: 'pixelate-region',
    badge: 'Mosaic Redact',
  },
  {
    slug: 'grayscale-bw-filter',
    href: '/utility/grayscale-bw-filter',
    title: 'Grayscale & Black-and-White Filter',
    description: 'Convert color photos into crisp monochrome and editorial B&W.',
    iconName: 'Contrast',
    mode: 'grayscale-bw',
    badge: 'Monochrome',
  },
  {
    slug: 'flip-rotate-image',
    href: '/utility/flip-rotate-image',
    title: 'Flip & Rotate Image (90° / 180°)',
    description: 'Mirror horizontally, flip vertically, or straighten tilted angles.',
    iconName: 'FlipHorizontal2',
    mode: 'flip-rotate',
    badge: 'Transform',
  },
  {
    slug: 'brightness-contrast-editor',
    href: '/utility/brightness-contrast-editor',
    title: 'Brightness & Contrast Editor',
    description: 'Fine-tune exposure, saturation, highlights, and shadows live.',
    iconName: 'SunMedium',
    mode: 'brightness-contrast',
    badge: 'Tone Studio',
  },
  {
    slug: 'rounded-corners-image-maker',
    href: '/utility/rounded-corners-image-maker',
    title: 'Rounded Corners Image Maker',
    description: 'Apply smooth custom border radius with transparent PNG corners.',
    iconName: 'Square',
    mode: 'rounded-corners',
    badge: 'Radius Cut',
  },
  {
    slug: 'photo-frame-border-studio',
    href: '/utility/photo-frame-border-studio',
    title: 'Photo Frame & Border Studio',
    description: 'Add Polaroid, clean gallery borders, and padding around photos.',
    iconName: 'Frame',
    mode: 'photo-frame',
    badge: 'Gallery Frame',
  },
  {
    slug: 'image-collage-maker',
    href: '/utility/image-collage-maker',
    title: 'Image Collage Maker',
    description: 'Combine multiple photos into clean grid layouts and photo strips.',
    iconName: 'LayoutGrid',
    mode: 'collage-maker',
    badge: 'Grid Composer',
  },
  {
    slug: 'side-by-side-image-merger',
    href: '/utility/side-by-side-image-merger',
    title: 'Side-by-Side Image Merger',
    description: 'Stitch two or more images horizontally or vertically seamlessly.',
    iconName: 'CopyCheck',
    mode: 'side-by-side',
    badge: 'Image Stitcher',
  },
  {
    slug: 'png-to-ico-favicon-generator',
    href: '/utility/png-to-ico-favicon-generator',
    title: 'PNG to ICO Favicon Generator',
    description: 'Bundle 16x16, 32x32, and 48x48 multi-size website favicons.',
    iconName: 'Monitor',
    mode: 'png-to-ico',
    badge: 'Multi-Size .ICO',
  },
  {
    slug: 'app-pwa-icon-pack-generator',
    href: '/utility/app-pwa-icon-pack-generator',
    title: 'App & PWA Icon Pack Generator',
    description: 'Export full Android, iOS, and Web Manifest icon bundles from one PNG.',
    iconName: 'Sticker',
    mode: 'pwa-icon-pack',
    badge: 'PWA Bundle',
  },
  {
    slug: 'image-to-pdf-converter',
    href: '/utility/image-to-pdf-converter',
    title: 'Image to PDF Converter',
    description: 'Merge JPG and PNG scans into clean A4 or Letter PDF documents.',
    iconName: 'FileText',
    mode: 'image-to-pdf',
    badge: 'Multi-Page PDF',
  },
  {
    slug: 'pdf-pages-to-high-res-png',
    href: '/utility/pdf-pages-to-high-res-png',
    title: 'PDF Pages to High-Res PNG',
    description: 'Render individual PDF pages as crisp PNG or JPG snapshots.',
    iconName: 'FileSpreadsheet',
    mode: 'pdf-to-png',
    badge: 'PDF Extractor',
  },
  {
    slug: 'animated-gif-maker',
    href: '/utility/animated-gif-maker',
    title: 'Animated GIF Maker from Photos',
    description: 'Sequence frames into smooth looping GIFs with speed controls.',
    iconName: 'Film',
    mode: 'gif-maker',
    badge: 'GIF89a Loop',
  },
  {
    slug: 'gif-to-sprite-sheet-frames',
    href: '/utility/gif-to-sprite-sheet-frames',
    title: 'GIF to Sprite Sheet & Frames',
    description: 'Extract every frame from animated GIFs as PNGs or sprite grids.',
    iconName: 'RotateCw',
    mode: 'gif-to-sprites',
    badge: 'Frame Decoder',
  },
  {
    slug: 'screenshot-mockup-frame-maker',
    href: '/utility/screenshot-mockup-frame-maker',
    title: 'Screenshot Mockup Frame Maker',
    description: 'Wrap app screenshots in sleek browser windows and gradient backdrops.',
    iconName: 'ImageIcon',
    mode: 'screenshot-mockup',
    badge: 'Browser Mockup',
  },
  {
    slug: 'social-media-og-image-maker',
    href: '/utility/social-media-og-image-maker',
    title: 'Social Media OG Image Maker',
    description: 'Build crisp 1200x630 Open Graph link preview banners fast.',
    iconName: 'Sparkles',
    mode: 'og-image-maker',
    badge: '1200x630 OG',
  },
  {
    slug: 'youtube-thumbnail-resizer',
    href: '/utility/youtube-thumbnail-resizer',
    title: 'YouTube Thumbnail Resizer',
    description: 'Size and optimize 1280x720 thumbnails strictly under 2MB.',
    iconName: 'Youtube',
    mode: 'youtube-thumbnail',
    badge: '1280x720 <2MB',
  },
  {
    slug: 'linkedin-x-banner-cropper',
    href: '/utility/linkedin-x-banner-cropper',
    title: 'LinkedIn & X Banner Cropper',
    description: 'Fit wide header cover photos without clipped profile overlaps.',
    iconName: 'SlidersHorizontal',
    mode: 'banner-cropper',
    badge: 'Header Presets',
  },
  {
    slug: 'whatsapp-dp-square-no-crop',
    href: '/utility/whatsapp-dp-square-no-crop',
    title: 'WhatsApp DP Square No-Crop Fit',
    description: 'Add blur or solid background padding to fit full photos in DPs.',
    iconName: 'Minimize2',
    mode: 'whatsapp-dp',
    badge: '1:1 No-Crop',
  },
  {
    slug: 'transparent-signature-maker',
    href: '/utility/transparent-signature-maker',
    title: 'Transparent Signature Maker',
    description: 'Clean white paper off scanned ink signatures for digital PDFs.',
    iconName: 'Wand',
    mode: 'transparent-signature',
    badge: 'Clean Ink PNG',
  },
  {
    slug: 'white-background-product-studio',
    href: '/utility/white-background-product-studio',
    title: 'White Background Product Studio',
    description: 'Center e-commerce product shots on pure #FFFFFF backgrounds.',
    iconName: 'Palette',
    mode: 'white-bg-studio',
    badge: 'E-Commerce Shot',
  },
  {
    slug: 'sepia-vintage-film-filter',
    href: '/utility/sepia-vintage-film-filter',
    title: 'Sepia & Vintage Film Filter',
    description: 'Apply warm analog film grain, fade, and classic sepia tones.',
    iconName: 'Film',
    mode: 'sepia-vintage',
    badge: 'Analog Film',
  },
  {
    slug: 'duotone-gradient-map-studio',
    href: '/utility/duotone-gradient-map-studio',
    title: 'Duotone & Gradient Map Studio',
    description: 'Recolor highlights and shadows with bold two-tone brand palettes.',
    iconName: 'Palette',
    mode: 'duotone-studio',
    badge: 'Duotone Map',
  },
  {
    slug: 'image-noise-grain-reducer',
    href: '/utility/image-noise-grain-reducer',
    title: 'Image Noise & Grain Reducer',
    description: 'Smooth low-light digital speckles while preserving crisp edges.',
    iconName: 'SlidersHorizontal',
    mode: 'noise-reducer',
    badge: 'Denoise Filter',
  },
  {
    slug: 'photo-sharpen-clarity-booster',
    href: '/utility/photo-sharpen-clarity-booster',
    title: 'Photo Sharpen & Clarity Booster',
    description: 'Restore crisp detail on slightly soft portraits and scans.',
    iconName: 'ZoomIn',
    mode: 'sharpen-booster',
    badge: 'Unsharp Mask',
  },
  {
    slug: 'image-dpi-print-size-checker',
    href: '/utility/image-dpi-print-size-checker',
    title: 'Image DPI & Print Size Checker',
    description: 'Inspect and adjust 300 DPI print resolution metadata for posters.',
    iconName: 'Printer',
    mode: 'dpi-checker',
    badge: '300 DPI Header',
  },
  {
    slug: 'image-histogram-info-viewer',
    href: '/utility/image-histogram-info-viewer',
    title: 'Image Histogram & Info Viewer',
    description: 'View RGB luminance graphs, bit depth, and color profile metrics.',
    iconName: 'ScanEye',
    mode: 'histogram-viewer',
    badge: 'RGB Telemetry',
  },
  {
    slug: 'color-blindness-image-simulator',
    href: '/utility/color-blindness-image-simulator',
    title: 'Color Blindness Image Simulator',
    description: 'Preview UI graphics for deuteranopia, protanopia, and tritanopia.',
    iconName: 'EyeOff',
    mode: 'color-blindness',
    badge: 'A11y Vision',
  },
  {
    slug: 'image-diff-visual-compare',
    href: '/utility/image-diff-visual-compare',
    title: 'Image Diff & Visual Compare',
    description: 'Spot pixel-level differences between two image versions side-by-side.',
    iconName: 'GitCompare',
    mode: 'image-diff',
    badge: 'Pixel Diff',
  },
  {
    slug: 'sprite-sheet-slicer-packer',
    href: '/utility/sprite-sheet-slicer-packer',
    title: 'Sprite Sheet Slicer & Packer',
    description: 'Slice game tile sheets or pack individual PNG sprites cleanly.',
    iconName: 'Grid',
    mode: 'sprite-slicer',
    badge: 'Sprite Tiles',
  },
  {
    slug: 'raw-dng-preview-to-jpg',
    href: '/utility/raw-dng-preview-to-jpg',
    title: 'RAW / DNG Preview to JPG',
    description: 'Extract embedded full-size previews from camera RAW files.',
    iconName: 'FileImage',
    mode: 'raw-preview',
    badge: 'EXIF Preview',
  },
  {
    slug: 'meme-text-caption-generator',
    href: '/utility/meme-text-caption-generator',
    title: 'Meme Text & Caption Generator',
    description: 'Add bold outlined captions and clean spacing above or on images.',
    iconName: 'Type',
    mode: 'meme-generator',
    badge: 'Caption Studio',
  },
];

export function resolveExtendedToolBySlug(slug: string): ExtendedToolItem | null {
  return EXTENDED_TOOLS.find((t) => t.slug === slug) ?? null;
}
