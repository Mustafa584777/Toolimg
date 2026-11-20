import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import type { LegalPageSpec } from '@/lib/legal-pages';
import { ContactForm } from '@/components/ContactForm';

export function LegalPageLayout({ page }: { page: LegalPageSpec }) {
  return (
    <section className="hero-orange-glow py-10 sm:py-14">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B7280] hover:text-[#EA580C]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Back to toolimg.online</span>
        </Link>

        <article className="mt-5 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_8px_30px_-10px_rgba(17,24,39,0.06)] sm:p-9">
          <div className="border-b border-[#F3F4F6] pb-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF7ED] px-3 py-1 text-xs font-semibold text-[#EA580C]">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                <span>toolimg.online Policy &amp; Info</span>
              </span>
              <span className="font-mono text-xs text-[#9CA3AF]">
                Updated {page.updatedAt}
              </span>
            </div>

            <h1 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight text-[#111827] sm:text-3xl">
              {page.title}
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-[#6B7280] sm:text-base">
              {page.summary}
            </p>
          </div>

          <div className="mt-6 space-y-6">
            {page.sections.map((section) => (
              <div key={section.heading}>
                <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-[#111827] sm:text-lg">
                  {section.heading}
                </h2>
                <div className="mt-2 space-y-2.5 text-sm leading-relaxed text-[#4B5563]">
                  {section.paragraphs.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>
                {section.bullets && (
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-[#4B5563]">
                    {section.bullets.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {page.showContactForm && <ContactForm />}
        </article>
      </div>
    </section>
  );
}
