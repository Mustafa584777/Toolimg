'use client';

import { ShieldCheck, X } from 'lucide-react';
import { useImageSession } from '@/components/ImageSessionProvider';

const MODAL_CONTENT = {
  privacy: {
    title: 'Privacy Policy — Zero Server Uploads',
    paragraphs: [
      'toolimg.online is engineered as a 100% client-side image utility. Whenever you compress, convert, strip EXIF data, crop, or extract colors, every byte is processed locally inside your browser using HTML5 Canvas and Web APIs.',
      'We do not upload, store, inspect, log, or retain your images on any remote server. Once you close or refresh your browser tab, any working image buffers are immediately released from device memory.',
      'No account registration, tracking cookies, or personal identifiers are required to use any tool.',
    ],
  },
  terms: {
    title: 'Terms of Use',
    paragraphs: [
      'All utilities on toolimg.online are provided free of charge for personal, educational, and commercial workflows without daily limits or watermarks.',
      'Because processing happens entirely on your device, you retain 100% ownership and copyright of all input and output files.',
      'Always verify strict portal or passport requirements (dimensions, background rules, and KB caps) against the target agency specification before final submission.',
    ],
  },
  about: {
    title: 'About toolimg.online',
    paragraphs: [
      'toolimg.online was built to eliminate slow upload queues, daily file limits, and privacy risks on traditional cloud image converters.',
      'By combining modern browser Canvas pipelines, binary-search KB compression, and clean siloed workflows, you get instant precision for strict 20KB/50KB portals, social media specs, passport layouts, and developer utilities.',
    ],
  },
  contact: {
    title: 'Contact & Feedback',
    paragraphs: [
      'Have a suggestion for a new exact-KB preset, passport country specification, or developer image utility?',
      'Reach our team directly at support@toolimg.online. Please do not email sensitive personal documents—remember all image processing happens privately right in your browser.',
    ],
  },
};

export function InfoModal() {
  const { activeInfoModal, setActiveInfoModal } = useImageSession();

  if (!activeInfoModal) return null;

  const content = MODAL_CONTENT[activeInfoModal];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-modal-title"
      onClick={() => setActiveInfoModal(null)}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ECFDF5] text-[#059669]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2
              id="info-modal-title"
              className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#0F172A]"
            >
              {content.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setActiveInfoModal(null)}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#475569]">
          {content.paragraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => setActiveInfoModal(null)}
            className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
