import type { Metadata } from 'next';
import { LEGAL_PAGES } from '@/lib/legal-pages';
import { LegalPageLayout } from '@/components/LegalPageLayout';

const page = LEGAL_PAGES['about'];

export const metadata: Metadata = {
  title: page.metaTitle,
  description: page.metaDescription,
  alternates: { canonical: `https://toolimg.online/${page.slug}` },
  openGraph: {
    url: `https://toolimg.online/${page.slug}`,
    title: page.metaTitle,
    description: page.metaDescription,
  },
};

export default function AboutPage() {
  return <LegalPageLayout page={page} />;
}
