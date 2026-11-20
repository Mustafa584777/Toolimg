import { ChevronDown } from 'lucide-react';
import { FAQ_ITEMS } from '@/lib/tools-data';

export function FaqSection() {
  return (
    <section
      id="faq"
      className="border-b border-[#F3F4F6] bg-white py-14 sm:py-16"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight text-[#111827] sm:text-3xl">
            Frequently Asked{' '}
            <span className="text-orange-gradient">Questions</span>
          </h2>
          <p className="mt-2 text-sm text-[#6B7280] sm:text-base">
            How local browser image processing keeps your files fast and private.
          </p>
        </div>

        <div className="mt-8 divide-y divide-[#F3F4F6] overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(17,24,39,0.04)]">
          {FAQ_ITEMS.map((item, idx) => (
            <details
              key={item.question}
              open={idx === 0}
              className="group"
            >
              <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[#FFF7ED]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F97316] sm:px-6 sm:py-5 [&::-webkit-details-marker]:hidden">
                <span className="font-[family-name:var(--font-display)] text-sm font-semibold text-[#111827] sm:text-base">
                  {item.question}
                </span>
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-[#6B7280] transition-transform duration-150 group-open:rotate-180 group-open:text-[#EA580C]"
                  aria-hidden="true"
                />
              </summary>
              <div className="px-5 pb-5 text-sm leading-relaxed text-[#6B7280] sm:px-6">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
