import Link from 'next/link';
import { ArrowRight, Check, Minus } from 'lucide-react';
import {
  COMPARISON_FEATURES,
  SILO_SHORTCUT_GROUPS,
} from '@/lib/tools-data';

const COMPARISON_ROWS = [
  {
    feature: 'Processing Architecture',
    ours: '100% Client-Side Canvas',
    cloudFree: 'Remote Upload Queue',
    paidSuites: 'Cloud / Desktop Install',
  },
  {
    feature: 'Exact-KB Target Precision',
    ours: 'Binary-Search KB Lock',
    cloudFree: 'Generic % Slider Only',
    paidSuites: 'Manual Export Guesswork',
  },
  {
    feature: 'Zero File Limits & Watermarks',
    ours: true,
    cloudFree: false,
    paidSuites: false,
  },
  {
    feature: 'EXIF & GPS Stripping Privacy',
    ours: 'Never Leaves Device',
    cloudFree: 'Uploaded Before Strip',
    paidSuites: 'Manual Inspector',
  },
  {
    feature: 'Price',
    ours: '$0 Forever',
    cloudFree: 'Ad-Gated / Captchas',
    paidSuites: '$12–$24 / month',
  },
];

export function TrustAndShortcuts() {
  return (
    <>
      {/* Why toolimg.online Beats Cloud Image Sites */}
      <section className="border-b border-[#F3F4F6] bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight text-[#111827] sm:text-3xl">
              Why <span className="text-orange-gradient">toolimg.online</span>{' '}
              Beats Cloud Image Sites
            </h2>
            <p className="mt-2 text-sm text-[#6B7280] sm:text-base">
              Built for privacy-sensitive documents, strict form portals, and
              instant everyday editing without upload queues.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {COMPARISON_FEATURES.map((feat) => (
              <div
                key={feat.index}
                className="card-orange-sheen flex flex-col justify-between rounded-2xl p-6 shadow-[0_10px_28px_-6px_rgba(17,24,39,0.10),0_4px_12px_-4px_rgba(234,88,12,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(17,24,39,0.15),0_8px_20px_-6px_rgba(234,88,12,0.18)]"
              >
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-xs font-semibold text-[#EA580C] tabular-nums">
                      {feat.index}.
                    </span>
                    <span className="rounded-lg border border-[#FED7AA] bg-[#FFF7ED] px-2.5 py-0.5 font-mono text-xs font-semibold text-[#C2410C] tabular-nums">
                      {feat.metric}
                    </span>
                  </div>
                  <h3 className="mt-4 font-[family-name:var(--font-display)] text-lg font-bold leading-snug text-[#111827]">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
                    {feat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Clean Comparison Matrix */}
          <div className="mt-10 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(17,24,39,0.04)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                    <th className="px-5 py-4">Feature</th>
                    <th className="bg-[#FFF7ED] px-5 py-4 text-[#111827]">
                      <span className="inline-flex items-center gap-2">
                        <span className="text-orange-gradient font-bold normal-case text-sm">
                          toolimg.online
                        </span>
                        <span className="btn-orange-gradient rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide">
                          FREE
                        </span>
                      </span>
                    </th>
                    <th className="px-5 py-4">Cloud Uploaders</th>
                    <th className="px-5 py-4">Paid Suites</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.feature} className="hover:bg-[#FAFAFA]">
                      <td className="px-5 py-3.5 font-medium text-[#111827]">
                        {row.feature}
                      </td>
                      <td className="bg-[#FFF7ED]/70 px-5 py-3.5 font-semibold text-[#111827]">
                        {typeof row.ours === 'boolean' ? (
                          <span className="inline-flex items-center gap-1.5 text-[#EA580C]">
                            <Check className="h-4 w-4 text-[#EA580C]" aria-hidden="true" />
                            <span>Included</span>
                          </span>
                        ) : (
                          row.ours
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[#6B7280]">
                        {typeof row.cloudFree === 'boolean' ? (
                          <span className="inline-flex items-center gap-1 text-[#9CA3AF]">
                            <Minus className="h-4 w-4" aria-hidden="true" />
                            <span>Limited</span>
                          </span>
                        ) : (
                          row.cloudFree
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[#6B7280]">
                        {typeof row.paidSuites === 'boolean' ? (
                          <span className="inline-flex items-center gap-1 text-[#9CA3AF]">
                            <Minus className="h-4 w-4" aria-hidden="true" />
                            <span>Subscription</span>
                          </span>
                        ) : (
                          row.paidSuites
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Quick-Access Shortcuts (Silo Internal Links Grid) */}
      <section className="border-b border-[#F3F4F6] bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight text-[#111827] sm:text-3xl">
              Popular Quick-Access{' '}
              <span className="text-orange-gradient">Shortcuts</span>
            </h2>
            <p className="mt-2 text-sm text-[#6B7280]">
              Direct links to exact-KB presets, passport specs, and developer
              decoders organized by silo.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SILO_SHORTCUT_GROUPS.map((group) => (
              <div
                key={group.href}
                className="card-orange-sheen rounded-2xl p-5 shadow-[0_10px_28px_-6px_rgba(17,24,39,0.10),0_4px_12px_-4px_rgba(234,88,12,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(17,24,39,0.15),0_8px_20px_-6px_rgba(234,88,12,0.18)]"
              >
                <Link
                  href={group.href}
                  className="inline-flex items-center gap-1.5 font-[family-name:var(--font-display)] text-sm font-bold text-[#111827] hover:text-[#EA580C]"
                >
                  <span>{group.title}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#F97316]" aria-hidden="true" />
                </Link>

                <ul className="mt-3.5 space-y-2">
                  {group.links.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="group inline-flex items-center gap-1.5 text-sm text-[#6B7280] transition-colors hover:text-[#EA580C]"
                      >
                        <span className="underline decoration-[#E5E7EB] underline-offset-4 group-hover:decoration-[#F97316]">
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
