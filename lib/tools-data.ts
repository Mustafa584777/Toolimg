export type SiloCategory =
  | 'compress'
  | 'convert'
  | 'social-resize'
  | 'privacy-dev'
  | 'ai-tools';

export interface SiloPillar {
  id: SiloCategory;
  name: string;
  tabLabel: string;
  href: string;
  headline: string;
  description: string;
}

export interface ProgrammaticTag {
  label: string;
  href: string;
}

export type ToolMode =
  | 'compress-kb'
  | 'convert-format'
  | 'exif-remove'
  | 'instagram-split'
  | 'discord-resize'
  | 'passport-photo'
  | 'svg-to-png'
  | 'base64'
  | 'circle-crop'
  | 'color-picker'
  | 'handwriting-to-text'
  | 'hindi-handwriting-to-text'
  | 'image-to-code'
  | 'html-to-image'
  | 'gemini-image-to-prompt';

export interface HubTool {
  id: string;
  title: string;
  benefit: string;
  href: string;
  category: SiloCategory;
  iconName:
    | 'Gauge'
    | 'RefreshCw'
    | 'ShieldOff'
    | 'Grid3x3'
    | 'Smile'
    | 'UserSquare2'
    | 'FileCode2'
    | 'Binary'
    | 'CircleDot'
    | 'Pipette'
    | 'PenLine'
    | 'Languages'
    | 'Code2'
    | 'ImageDown'
    | 'Wand2';
  tags: ProgrammaticTag[];
  mode: ToolMode;
  defaultPreset?: {
    targetKb?: number;
    outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
    gridCols?: number;
    gridRows?: number;
    width?: number;
    height?: number;
    passportPreset?: 'us-2x2' | 'uk-35x45' | 'print-4x6';
    base64Direction?: 'encode' | 'decode';
  };
}

export interface ShortcutRoute {
  slug: string;
  href: string;
  title: string;
  description: string;
  category: SiloCategory;
  parentToolId: string;
  mode: ToolMode;
  preset?: HubTool['defaultPreset'];
}

export interface CreatorToolRoute {
  slug:
    | 'handwriting-to-text'
    | 'hindi-handwriting-to-text'
    | 'image-to-code'
    | 'html-to-image'
    | 'gemini-image-to-prompt';
  href: string;
  title: string;
  metaTitle: string;
  description: string;
  mode:
    | 'handwriting-to-text'
    | 'hindi-handwriting-to-text'
    | 'image-to-code'
    | 'html-to-image'
    | 'gemini-image-to-prompt';
  badge: string;
}

export const SILO_PILLARS: SiloPillar[] = [
  {
    id: 'compress',
    name: 'Compress',
    tabLabel: 'Compress & Size',
    href: '/compress',
    headline: 'Precision Image Compression to Exact KB',
    description:
      'Shrink JPG, PNG, and WebP files to strict portal thresholds like 20KB, 50KB, or 100KB locally in your browser.',
  },
  {
    id: 'convert',
    name: 'Convert',
    tabLabel: 'Format Converters',
    href: '/convert',
    headline: 'Lossless & High-Res Format Converters',
    description:
      'Convert iPhone HEIC photos, upscale SVG vector graphics to 4K PNG, and switch between JPG, PNG, and WebP.',
  },
  {
    id: 'social-resize',
    name: 'Social & Resize',
    tabLabel: 'Social & Passport',
    href: '/social-resize',
    headline: 'Exact Specs for Social, Discord & Passports',
    description:
      'Split Instagram grids, size Discord emojis under 256KB, circle-crop avatars, and generate compliant passport photos.',
  },
  {
    id: 'privacy-dev',
    name: 'Privacy & Dev',
    tabLabel: 'Privacy & Dev',
    href: '/privacy-dev',
    headline: 'EXIF Scrubbing, Base64 & Color Extraction',
    description:
      'Strip GPS coordinates and camera EXIF headers, encode/decode Data URIs, and sample HEX/RGB palettes offline.',
  },
];

export const CREATOR_TOOLS: CreatorToolRoute[] = [
  {
    slug: 'handwriting-to-text',
    href: '/tools/handwriting-to-text/',
    title: 'Handwriting to Text (OCR)',
    metaTitle: 'Handwriting to Text OCR Online | toolimg.online',
    description:
      'Convert handwritten notes, whiteboard snapshots, and scanned notebooks into clean editable text.',
    mode: 'handwriting-to-text',
    badge: 'Smart Vision OCR',
  },
  {
    slug: 'hindi-handwriting-to-text',
    href: '/tools/hindi-handwriting-to-text/',
    title: 'Hindi Handwriting to Text',
    metaTitle: 'Hindi Handwriting to Text (Devanagari OCR) | toolimg.online',
    description:
      'Transcribe handwritten Hindi (Devanagari) notes into clean Unicode text with optional English translation.',
    mode: 'hindi-handwriting-to-text',
    badge: 'Devanagari OCR',
  },
  {
    slug: 'image-to-code',
    href: '/tools/image-to-code/',
    title: 'Image to Code Generator',
    metaTitle: 'Image to HTML & Tailwind CSS Code | toolimg.online',
    description:
      'Turn any UI screenshot, card design, or wireframe photo into clean HTML, React JSX, and Tailwind CSS code.',
    mode: 'image-to-code',
    badge: 'UI to Code',
  },
  {
    slug: 'html-to-image',
    href: '/tools/html-to-image/',
    title: 'HTML to Image Converter',
    metaTitle: 'HTML & CSS to PNG/JPG/WebP Image | toolimg.online',
    description:
      'Render custom HTML & CSS snippets directly into crisp 1x or 2x Retina PNG, JPG, or WebP images locally.',
    mode: 'html-to-image',
    badge: '100% Client-Side',
  },
  {
    slug: 'gemini-image-to-prompt',
    href: '/tools/gemini-image-to-prompt/',
    title: 'Gemini Image to Prompt',
    metaTitle: 'Image to AI Prompt Generator | toolimg.online',
    description:
      'Reverse-engineer any image into detailed Midjourney, Stable Diffusion, video, or structured JSON prompts.',
    mode: 'gemini-image-to-prompt',
    badge: 'Prompt Engineer',
  },
];

export const CORE_TOOLS: HubTool[] = [
  {
    id: 'compress-exact-kb',
    title: 'Compress Image to Exact KB',
    benefit: 'Hit strict 20KB, 50KB, or 100KB form limits with binary-search precision.',
    href: '/compress/compress-image-to-50kb',
    category: 'compress',
    iconName: 'Gauge',
    mode: 'compress-kb',
    defaultPreset: { targetKb: 50, outputFormat: 'image/jpeg' },
    tags: [
      { label: '20KB', href: '/compress-image-to-20kb' },
      { label: '50KB', href: '/compress/compress-image-to-50kb' },
      { label: '100KB', href: '/compress-image-to-100kb' },
    ],
  },
  {
    id: 'heic-to-jpg',
    title: 'HEIC to JPG Converter',
    benefit: 'Turn Apple HEIC photos into universal JPG, PNG, or WebP files privately.',
    href: '/convert/heic-to-jpg',
    category: 'convert',
    iconName: 'RefreshCw',
    mode: 'convert-format',
    defaultPreset: { outputFormat: 'image/jpeg' },
    tags: [
      { label: 'iPhone Photos', href: '/convert/heic-to-jpg' },
      { label: 'Bulk PNG', href: '/heic-to-png' },
      { label: 'WebP', href: '/convert/heic-to-jpg?format=webp' },
    ],
  },
  {
    id: 'remove-exif-data',
    title: 'EXIF Metadata Remover',
    benefit: 'Scrub GPS coordinates, device serials, and timestamps before sharing.',
    href: '/privacy-dev/remove-exif-data',
    category: 'privacy-dev',
    iconName: 'ShieldOff',
    mode: 'exif-remove',
    tags: [
      { label: 'Strip GPS', href: '/privacy-dev/remove-exif-data' },
      { label: 'Camera Info', href: '/privacy-dev/remove-exif-data' },
      { label: 'Private', href: '/privacy-dev/remove-exif-data' },
    ],
  },
  {
    id: 'instagram-carousel-splitter',
    title: 'Instagram Grid Splitter',
    benefit: 'Slice wide panoramas or portraits into seamless 3x3 grids and carousels.',
    href: '/social-resize/instagram-carousel-splitter',
    category: 'social-resize',
    iconName: 'Grid3x3',
    mode: 'instagram-split',
    defaultPreset: { gridCols: 3, gridRows: 1 },
    tags: [
      { label: '3x3 Grid', href: '/split-image-into-3x3-grid' },
      { label: 'Seamless Swipe', href: '/social-resize/instagram-carousel-splitter' },
      { label: 'Panorama', href: '/social-resize/instagram-carousel-splitter' },
    ],
  },
  {
    id: 'discord-emoji-resizer',
    title: 'Discord Emoji & Banner Resizer',
    benefit: 'Resize custom emotes to 128x128 under 256KB and format server banners.',
    href: '/social-resize/discord-emoji-resizer-128x128',
    category: 'social-resize',
    iconName: 'Smile',
    mode: 'discord-resize',
    defaultPreset: { width: 128, height: 128, targetKb: 256 },
    tags: [
      { label: '128x128', href: '/social-resize/discord-emoji-resizer-128x128' },
      { label: 'Under 256KB', href: '/social-resize/discord-emoji-resizer-128x128' },
      { label: 'Server Banner', href: '/social-resize/discord-emoji-resizer-128x128?mode=banner' },
    ],
  },
  {
    id: 'passport-photo-maker',
    title: 'Passport Size Photo Maker',
    benefit: 'Crop compliant US 2x2", UK 35x45mm, and 4x6 printable photo sheets.',
    href: '/social-resize/us-passport-photo-2x2',
    category: 'social-resize',
    iconName: 'UserSquare2',
    mode: 'passport-photo',
    defaultPreset: { passportPreset: 'us-2x2' },
    tags: [
      { label: 'US 2x2"', href: '/social-resize/us-passport-photo-2x2' },
      { label: 'UK 35x45mm', href: '/uk-passport-photo-35x45mm' },
      { label: '4x6 Print Sheet', href: '/social-resize/us-passport-photo-2x2?sheet=4x6' },
    ],
  },
  {
    id: 'svg-to-png',
    title: 'SVG to PNG High-Res Converter',
    benefit: 'Rasterize crisp vector logos to 4K transparent PNG or lightweight WebP.',
    href: '/convert/svg-to-png',
    category: 'convert',
    iconName: 'FileCode2',
    mode: 'svg-to-png',
    defaultPreset: { width: 3840, outputFormat: 'image/png' },
    tags: [
      { label: '4K Export', href: '/convert/svg-to-png' },
      { label: 'Transparent', href: '/convert/svg-to-png' },
      { label: 'WebP', href: '/convert/svg-to-png?format=webp' },
    ],
  },
  {
    id: 'image-to-base64',
    title: 'Image to Base64 Encoder',
    benefit: 'Generate inline Data URIs, CSS background snippets, or decode Base64 strings.',
    href: '/privacy-dev/image-to-base64',
    category: 'privacy-dev',
    iconName: 'Binary',
    mode: 'base64',
    defaultPreset: { base64Direction: 'encode' },
    tags: [
      { label: 'Data URI', href: '/privacy-dev/image-to-base64' },
      { label: 'CSS Ready', href: '/privacy-dev/image-to-base64' },
      { label: 'Base64 Decoder', href: '/base64-to-image' },
    ],
  },
  {
    id: 'circle-crop-image',
    title: 'Circle Crop Image Online',
    benefit: 'Cut clean transparent circular avatars for Slack, GitHub, and X profiles.',
    href: '/social-resize/circle-crop-image',
    category: 'social-resize',
    iconName: 'CircleDot',
    mode: 'circle-crop',
    defaultPreset: { outputFormat: 'image/png' },
    tags: [
      { label: 'Round PFP', href: '/social-resize/circle-crop-image' },
      { label: 'Transparent PNG', href: '/social-resize/circle-crop-image' },
      { label: 'Avatar', href: '/social-resize/circle-crop-image' },
    ],
  },
  {
    id: 'pick-color-from-image',
    title: 'Image Color Picker & Palette',
    benefit: 'Inspect exact pixel HEX/RGB codes and extract dominant color palettes.',
    href: '/privacy-dev/pick-color-from-image',
    category: 'privacy-dev',
    iconName: 'Pipette',
    mode: 'color-picker',
    tags: [
      { label: 'HEX & RGB', href: '/privacy-dev/pick-color-from-image' },
      { label: 'Extract Palette', href: '/privacy-dev/pick-color-from-image' },
      { label: 'Eyedropper', href: '/privacy-dev/pick-color-from-image' },
    ],
  },
  {
    id: 'handwriting-to-text',
    title: 'Handwriting to Text (OCR)',
    benefit: 'Extract clean editable text from handwritten notes, notebooks, and whiteboards.',
    href: '/tools/handwriting-to-text/',
    category: 'ai-tools',
    iconName: 'PenLine',
    mode: 'handwriting-to-text',
    tags: [
      { label: 'Handwritten OCR', href: '/tools/handwriting-to-text/' },
      { label: 'Notes to TXT', href: '/tools/handwriting-to-text/' },
    ],
  },
  {
    id: 'hindi-handwriting-to-text',
    title: 'Hindi Handwriting to Text',
    benefit: 'Transcribe Hindi (Devanagari) handwritten pages into Unicode text cleanly.',
    href: '/tools/hindi-handwriting-to-text/',
    category: 'ai-tools',
    iconName: 'Languages',
    mode: 'hindi-handwriting-to-text',
    tags: [
      { label: 'Devanagari OCR', href: '/tools/hindi-handwriting-to-text/' },
      { label: 'Hindi Unicode', href: '/tools/hindi-handwriting-to-text/' },
    ],
  },
  {
    id: 'image-to-code',
    title: 'Image to Code Generator',
    benefit: 'Convert UI screenshots and mockups into responsive HTML and Tailwind CSS.',
    href: '/tools/image-to-code/',
    category: 'ai-tools',
    iconName: 'Code2',
    mode: 'image-to-code',
    tags: [
      { label: 'HTML + Tailwind', href: '/tools/image-to-code/' },
      { label: 'React JSX', href: '/tools/image-to-code/' },
    ],
  },
  {
    id: 'html-to-image',
    title: 'HTML to Image Converter',
    benefit: 'Render HTML & CSS cards into crisp PNG, JPG, or WebP downloads locally.',
    href: '/tools/html-to-image/',
    category: 'ai-tools',
    iconName: 'ImageDown',
    mode: 'html-to-image',
    tags: [
      { label: 'HTML to PNG', href: '/tools/html-to-image/' },
      { label: '2x Retina', href: '/tools/html-to-image/' },
    ],
  },
  {
    slug: 'gemini-image-to-prompt',
    id: 'gemini-image-to-prompt',
    title: 'Gemini Image to Prompt',
    benefit: 'Generate detailed Midjourney, Flux, or Stable Diffusion prompts from any photo.',
    href: '/tools/gemini-image-to-prompt/',
    category: 'ai-tools',
    iconName: 'Wand2',
    mode: 'gemini-image-to-prompt',
    tags: [
      { label: 'Image to Prompt', href: '/tools/gemini-image-to-prompt/' },
      { label: 'JSON Describe', href: '/tools/gemini-image-to-prompt/' },
    ],
  } as HubTool,
];

export const PROGRAMMATIC_SHORTCUTS: ShortcutRoute[] = [
  {
    slug: 'compress-image-to-20kb',
    href: '/compress-image-to-20kb',
    title: 'Compress Image to 20KB',
    description:
      'Reduce JPG or WebP photos strictly under 20KB for government portals, exam forms, and signature uploads.',
    category: 'compress',
    parentToolId: 'compress-exact-kb',
    mode: 'compress-kb',
    preset: { targetKb: 20, outputFormat: 'image/jpeg' },
  },
  {
    slug: 'compress-image-to-100kb',
    href: '/compress-image-to-100kb',
    title: 'Compress Image to 100KB',
    description:
      'Balance sharp visual clarity with a strict 100KB file ceiling for web CMS, portfolios, and email attachments.',
    category: 'compress',
    parentToolId: 'compress-exact-kb',
    mode: 'compress-kb',
    preset: { targetKb: 100, outputFormat: 'image/jpeg' },
  },
  {
    slug: 'heic-to-png',
    href: '/heic-to-png',
    title: 'HEIC to PNG Converter',
    description:
      'Convert iPhone HEIC images into lossless PNGs right inside your browser without uploading personal photos.',
    category: 'convert',
    parentToolId: 'heic-to-jpg',
    mode: 'convert-format',
    preset: { outputFormat: 'image/png' },
  },
  {
    slug: 'split-image-into-3x3-grid',
    href: '/split-image-into-3x3-grid',
    title: 'Split Image into 3x3 Grid',
    description:
      'Slice any photo into 9 perfectly aligned square tiles for Instagram profile grids and visual murals.',
    category: 'social-resize',
    parentToolId: 'instagram-carousel-splitter',
    mode: 'instagram-split',
    preset: { gridCols: 3, gridRows: 3 },
  },
  {
    slug: 'uk-passport-photo-35x45mm',
    href: '/uk-passport-photo-35x45mm',
    title: 'UK Passport Photo 35x45mm',
    description:
      'Format compliant 35x45mm UK, EU, and Schengen biometric passport photos or export a 4x6 print sheet.',
    category: 'social-resize',
    parentToolId: 'passport-photo-maker',
    mode: 'passport-photo',
    preset: { passportPreset: 'uk-35x45' },
  },
  {
    slug: 'base64-to-image',
    href: '/base64-to-image',
    title: 'Base64 to Image Decoder',
    description:
      'Paste any Base64 string or Data URI to preview, inspect dimensions, and download as PNG, JPG, or WebP.',
    category: 'privacy-dev',
    parentToolId: 'image-to-base64',
    mode: 'base64',
    preset: { base64Direction: 'decode' },
  },
];

export const SILO_SHORTCUT_GROUPS: {
  title: string;
  href: string;
  links: { label: string; href: string }[];
}[] = [
  {
    title: 'Compress & Size',
    href: '/compress',
    links: [
      { label: 'Compress Image to 20KB', href: '/compress-image-to-20kb' },
      { label: 'Compress Image to 50KB', href: '/compress/compress-image-to-50kb' },
      { label: 'Compress Image to 100KB', href: '/compress-image-to-100kb' },
    ],
  },
  {
    title: 'Format & HTML',
    href: '/convert',
    links: [
      { label: 'HEIC to JPG Converter', href: '/convert/heic-to-jpg' },
      { label: 'HEIC to PNG Converter', href: '/heic-to-png' },
      { label: 'SVG to 4K PNG Converter', href: '/convert/svg-to-png' },
      { label: 'HTML to Image Converter', href: '/tools/html-to-image/' },
    ],
  },
  {
    title: 'Social & Passport',
    href: '/social-resize',
    links: [
      { label: 'Split Image into 3x3 Grid', href: '/split-image-into-3x3-grid' },
      { label: 'Discord Emoji 128x128', href: '/social-resize/discord-emoji-resizer-128x128' },
      { label: 'UK Passport Photo 35x45mm', href: '/uk-passport-photo-35x45mm' },
      { label: 'US Passport Photo 2x2"', href: '/social-resize/us-passport-photo-2x2' },
      { label: 'Circle Crop Transparent PNG', href: '/social-resize/circle-crop-image' },
    ],
  },
  {
    title: 'OCR, Code & Privacy',
    href: '/privacy-dev',
    links: [
      { label: 'Handwriting to Text (OCR)', href: '/tools/handwriting-to-text/' },
      { label: 'Hindi Handwriting to Text', href: '/tools/hindi-handwriting-to-text/' },
      { label: 'Image to Code Generator', href: '/tools/image-to-code/' },
      { label: 'Gemini Image to Prompt', href: '/tools/gemini-image-to-prompt/' },
      { label: 'EXIF & GPS Metadata Remover', href: '/privacy-dev/remove-exif-data' },
      { label: 'Base64 to Image Decoder', href: '/base64-to-image' },
    ],
  },
];

export const COMPARISON_FEATURES = [
  {
    index: '01',
    title: 'Zero Server Uploads (WebAssembly & Canvas)',
    description:
      'Your sensitive documents, passport photos, and private camera roll never leave your browser memory or touch an external server.',
    metric: '0 bytes uploaded',
  },
  {
    index: '02',
    title: 'No Daily Limits or Watermarks',
    description:
      'Skip paywalls, account sign-ups, and hourly file caps. Process unlimited images at native device CPU and GPU speed.',
    metric: 'Unlimited runs',
  },
  {
    index: '03',
    title: 'Exact Dimension & KB Precision',
    description:
      'Engineered specifically for strict 20KB/50KB portal ceilings, 128x128 Discord emotes, 35x45mm passport sheets, and 4K SVG exports.',
    metric: 'Pixel & KB locked',
  },
];

export const FAQ_ITEMS = [
  {
    question: 'Are my photos actually processed without uploading to a server?',
    answer:
      'Yes. All core compression, conversion, EXIF removal, cropping, HTML-to-Image, and color picking tools execute 100% locally inside your browser using HTML5 Canvas and Web APIs. AI OCR, Image-to-Code, and Image-to-Prompt tools transmit only the selected image transiently over HTTPS to generate your text output without storing files.',
  },
  {
    question: 'Which image formats are supported across compression and conversion?',
    answer:
      'You can drop JPG, JPEG, PNG, WebP, SVG, GIF, and iPhone HEIC/HEIF files. Outputs can be exported as optimized JPG, transparent PNG, WebP, Base64 Data URIs, or printable 4x6 passport sheets depending on the tool.',
  },
  {
    question: 'How does compressing an image to an exact 20KB or 50KB size work?',
    answer:
      'Instead of guessing a quality slider, our client-side compressor runs a fast binary search across JPEG/WebP quality levels—and automatically scales down oversized pixel dimensions when needed—to land safely underneath your exact KB ceiling.',
  },
  {
    question: 'Can I transcribe Hindi and English handwritten notes accurately?',
    answer:
      'Yes. Our Handwriting to Text and Hindi Handwriting to Text tools support both English cursive/print notes and Unicode Devanagari script, preserving line structure and punctuation.',
  },
];

export function resolveToolByPath(
  pillarOrSlug: string,
  toolSlug?: string
): {
  kind: 'pillar' | 'tool' | 'shortcut';
  pillar?: SiloPillar;
  tool?: HubTool;
  shortcut?: ShortcutRoute;
} | null {
  if (!toolSlug) {
    const pillar = SILO_PILLARS.find((p) => p.id === pillarOrSlug);
    if (pillar) return { kind: 'pillar', pillar };

    const shortcut = PROGRAMMATIC_SHORTCUTS.find((s) => s.slug === pillarOrSlug);
    if (shortcut) return { kind: 'shortcut', shortcut };

    return null;
  }

  const fullHref = `/${pillarOrSlug}/${toolSlug}`;
  const tool = CORE_TOOLS.find((t) => t.href === fullHref);
  if (tool) return { kind: 'tool', tool };

  return null;
}

export function resolveCreatorToolBySlug(slug: string): CreatorToolRoute | null {
  return CREATOR_TOOLS.find((t) => t.slug === slug) ?? null;
}
