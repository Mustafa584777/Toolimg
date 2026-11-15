import { HeroDropzone } from '@/components/HeroDropzone';
import { ToolDirectory } from '@/components/ToolDirectory';
import { TrustAndShortcuts } from '@/components/TrustAndShortcuts';
import { FaqSection } from '@/components/FaqSection';

export default function HomePage() {
  return (
    <>
      <HeroDropzone />
      <ToolDirectory />
      <TrustAndShortcuts />
      <FaqSection />
    </>
  );
}
