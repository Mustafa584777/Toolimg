'use client';

import Link from 'next/link';
import { Layers, ShieldCheck } from 'lucide-react';
import { CORE_TOOLS, SILO_PILLARS } from '@/lib/tools-data';
import { useImageSession } from '@/components/ImageSessionProvider';

export function Footer() {
  const { setActiveInfoModal } = useImageSession();

  return (
    <footer className="bg-white py-12 text-sm text-[#475569]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 border-b border-[#E2E8F0] pb-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-[family-name:var(--font-display)] text-base font-bold tracking-tight text-[#0F172A]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#2563EB] text-white">
                <Layers className="h-4 w-4" aria-hidden="true" />
              </span>
              <span>toolimg.online</span>
            </Link>
            <p className="mt-3 text-xs leading-relaxed text-[#475569]">
              Fast, private image compression, format conversion, EXIF removal,
              and exact-spec resizing—executed 100% locally in your browser.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] px-2.5 py-1 text-xs font-medium text-[#059669]">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Zero Server Uploads</span>
            </div>
          </div>

          {/* Silo Pillars Column */}
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-wider text-[#0F172A]">
              Tool Silos
            </h3>
            <ul className="mt-3 space-y-2">
              {SILO_PILLARS.map((pillar) => (
                <li key={pillar.id}>
                  <Link
                    href={pillar.href}
                    className="transition-colors hover:text-[#2563EB]"
                  >
                    {pillar.tabLabel}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Tools Column */}
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-wider text-[#0F172A]">
              Popular Tools
            </h3>
            <ul className="mt-3 space-y-2">
              {CORE_TOOLS.slice(0, 5).map((tool) => (
                <li key={tool.id}>
                  <Link
                    href={tool.href}
                    className="transition-colors hover:text-[#2563EB]"
                  >
                    {tool.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company & Legal Modals Column */}
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-wider text-[#0F172A]">
              Trust &amp; Legal
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveInfoModal('privacy')}
                  className="transition-colors hover:text-[#2563EB]"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveInfoModal('terms')}
                  className="transition-colors hover:text-[#2563EB]"
                >
                  Terms of Use
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveInfoModal('about')}
                  className="transition-colors hover:text-[#2563EB]"
                >
                  About toolimg.online
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveInfoModal('contact')}
                  className="transition-colors hover:text-[#2563EB]"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-3 text-xs text-[#64748B] sm:flex-row sm:items-center">
          <p>&copy; {new Date().getFullYear()} toolimg.online. All processing stays on your device.</p>
          <p>Client-Side Canvas &amp; Web APIs · Built for Speed</p>
        </div>
      </div>
    </footer>
  );
}
