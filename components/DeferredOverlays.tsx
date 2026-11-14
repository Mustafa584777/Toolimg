'use client';

import dynamic from 'next/dynamic';
import { useImageSession } from '@/components/ImageSessionProvider';

const CommandSearchModal = dynamic(
  () =>
    import('@/components/CommandSearchModal').then(
      (mod) => mod.CommandSearchModal
    ),
  { ssr: false }
);

const InfoModal = dynamic(
  () => import('@/components/InfoModal').then((mod) => mod.InfoModal),
  { ssr: false }
);

export function DeferredOverlays() {
  const { isSearchOpen, activeInfoModal } = useImageSession();

  return (
    <>
      {isSearchOpen ? <CommandSearchModal /> : null}
      {activeInfoModal ? <InfoModal /> : null}
    </>
  );
}
