'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { FAQ_ITEMS } from '@/lib/tools-data';

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-b border-[#E2E8F0] bg-[#F8FAFC] py-14 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm text-[#475569] sm:text-base">
            How local browser image processing keeps your files fast and private.
          </p>
        </div>

        <div className="mt-8 divide-y divide-[#E2E8F0] overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={item.question}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563EB] sm:px-6 sm:py-5"
                >
                  <span className="font-[family-name:var(--font-display)] text-sm font-semibold text-[#0F172A] sm:text-base">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[#64748B] transition-transform duration-150 ${
                      isOpen ? 'rotate-180 text-[#2563EB]' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm leading-relaxed text-[#475569] sm:px-6">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
