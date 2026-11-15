import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get('host')?.toLowerCase() ?? '';

  if (host.startsWith('prompts.toolimg.online')) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/de/tools/image-to-code/',
        '/ar/tools/hindi-handwriting-to-text/',
        '/es/tools/hindi-handwriting-to-text/',
        '/de/tools/html-to-image/',
        '/ar/tools/handwriting-to-text/',
        '/es/tools/image-to-code/',
        '/ar/tools/image-to-code/',
        '/ru/',
        '/fr/',
        '/es/tools/handwriting-to-text/',
        '/en/',
        '/de/tools/handwriting-to-text/',
        '/de/tools/hindi-handwriting-to-text/',
        '/ar/tools/html-to-image/',
        '/ar/',
        '/ru/tools/image-to-code/',
        '/fr/pricing/',
        '/pricing/',
        '/api/image-to-code',
      ],
    },
    sitemap: 'https://toolimg.online/sitemap.xml',
  };
}
