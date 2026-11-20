import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { FAQ_ITEMS } from '@/lib/tools-data';
import { ImageSessionProvider } from '@/components/ImageSessionProvider';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { DeferredOverlays } from '@/components/DeferredOverlays';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title:
    'toolimg.online – Free Private Online Image Tools (Compress, Convert & Resize)',
  description:
    'Fast, 100% browser-based image tools. Compress images to exact KB, convert HEIC & SVG, remove EXIF metadata, and resize for Instagram, Discord & Passports with zero uploads.',
  metadataBase: new URL('https://toolimg.online'),
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'toolimg.online',
    title:
      'toolimg.online – Free Private Online Image Tools (Compress, Convert & Resize)',
    description:
      'Fast, 100% browser-based image tools. Compress images to exact KB, convert HEIC & SVG, remove EXIF metadata, and resize for Instagram, Discord & Passports with zero uploads.',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'toolimg.online logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'toolimg.online – Free Private Online Image Tools (Compress, Convert & Resize)',
    description:
      'Fast, 100% browser-based image tools. Compress images to exact KB, convert HEIC & SVG, remove EXIF metadata, and resize with zero uploads.',
    images: ['/logo.png'],
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://toolimg.online/#website',
      url: 'https://toolimg.online',
      name: 'toolimg.online',
      description:
        'Private, 100% browser-based online image compression, conversion, EXIF removal, and resizing tools.',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://toolimg.online/?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://toolimg.online/#software',
      name: 'toolimg.online Browser Image Suite',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires HTML5 Canvas and JavaScript',
      url: 'https://toolimg.online',
      description:
        'Client-side image toolkit for exact KB compression, HEIC/SVG conversion, EXIF metadata removal, passport photo sizing, and Base64 encoding with zero server uploads.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://toolimg.online/#faq',
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ],
};

const gtagLoaderScript = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
(function(){
  var loaded = false;
  function loadGtm(){
    if(loaded) return;
    loaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=G-3PK1RHDJ2S';
    document.head.appendChild(s);
  }
  ['pointerdown','keydown','scroll','touchstart'].forEach(function(evt){
    window.addEventListener(evt, loadGtm, {once:true, passive:true});
  });
  window.addEventListener('load', function(){
    if('requestIdleCallback' in window){
      window.requestIdleCallback(loadGtm, {timeout: 3500});
    } else {
      setTimeout(loadGtm, 2500);
    }
  }, {once:true});
})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link
          rel="preconnect"
          href="https://www.googletagmanager.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://www.google-analytics.com"
          crossOrigin="anonymous"
        />
        <script
          id="gtag-init"
          dangerouslySetInnerHTML={{ __html: gtagLoaderScript }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen flex flex-col bg-white text-[#111827]"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <ImageSessionProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <DeferredOverlays />
        </ImageSessionProvider>
      </body>
    </html>
  );
}
