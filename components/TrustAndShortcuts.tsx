import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  COMPARISON_FEATURES,
  SILO_SHORTCUT_GROUPS,
} from '@/lib/tools-data';

export function TrustAndShortcuts() {
  return (
    <>
      {/* Why toolimg.online Beats Cloud Image Sites */}
      <section className="border-b border-[#E2E8F0] bg-[#F8FAFC] py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
              Why toolimg.online Beats Cloud Image Sites
            </h2>
            <p className="mt-2 text-sm text-[#475569] sm:text-base">
              Built for privacy-sensitive documents, strict form portals, and
              instant everyday editing without upload queues.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {COMPARISON_FEATURES.map((feat) => (
              <div
                key={feat.index}
                className="flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-6"
              >
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-xs font-semibold text-[#2563EB] tabular-nums">
                      {feat.index}.
                    </span>
                    <span className="font-mono text-xs font-medium text-[#059669] tabular-nums">
                      {feat.metric}
                    </span>
                  </div>
                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-lg font-semibold leading-snug text-[#0F172A]">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#475569]">
                    {feat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Quick-Access Shortcuts (Silo Internal Links Grid) */}
      <section className="border-b border-[#E2E8F0] bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[#0F172A]">
                Popular Quick-Access Shortcuts
              </h2>
              <p className="mt-1 text-sm text-[#475569]">
                Direct links to exact-KB presets, passport specs, and developer
                decoders organized by silo.
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SILO_SHORTCUT_GROUPS.map((group) => (
              <div
                key={group.pillar.id}
                className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5"
              >
                <Link
                  href={group.pillar.href}
                  className="inline-flex items-center gap-1.5 font-[family-name:var(--font-display)] text-sm font-semibold text-[#0F172A] hover:text-[#2563EB]"
                >
                  <span>{group.pillar.tabLabel}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#64748B]" aria-hidden="true" />
                </Link>

                <ul className="mt-3.5 space-y-2">
                  {group.links.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="group inline-flex items-center gap-1.5 text-sm text-[#475569] transition-colors hover:text-[#2563EB]"
                      >
                        <span className="underline decoration-[#E2E8F0] underline-offset-4 group-hover:decoration-[#2563EB]">
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
