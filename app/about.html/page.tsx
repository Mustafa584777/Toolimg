import type { Metadata } from 'next';
import { LEGAL_PAGES } from '@/lib/legal-pages';
import { LegalPageLayout } from '@/components/LegalPageLayout';

const page = LEGAL_PAGES['about.html'];

export const metadata: Metadata = {
  title: page.metaTitle,
  description: page.metaDescription,
  alternates: { canonical: `https://toolimg.online/${page.slug}` },
};

export default function AboutPage() {
  return <LegalPageLayout page={page} />;
}
