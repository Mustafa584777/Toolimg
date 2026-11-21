import type { Metadata } from 'next';
import { HeroDropzone } from '@/components/HeroDropzone';
import { ToolDirectory } from '@/components/ToolDirectory';
import { UpcomingImageTools } from '@/components/UpcomingImageTools';
import { TrustAndShortcuts } from '@/components/TrustAndShortcuts';
import { FaqSection } from '@/components/FaqSection';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://toolimg.online/',
  },
  openGraph: {
    url: 'https://toolimg.online/',
  },
};

export default function HomePage() {
  return (
    <>
      <HeroDropzone />
      <ToolDirectory />
      <UpcomingImageTools />
      <TrustAndShortcuts />
      <FaqSection />
    </>
  );
}
