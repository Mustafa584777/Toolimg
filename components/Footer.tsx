import Image from 'next/image';
import Link from 'next/link';
import { MessageSquare, ShieldCheck } from 'lucide-react';
import { CORE_TOOLS, CREATOR_TOOLS, SILO_PILLARS } from '@/lib/tools-data';

const IMPORTANT_PAGES = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Refund Policy', href: '/refund-policy' },
  { label: 'Disclaimer', href: '/disclaimer' },
];

export function Footer() {
  return (
    <footer className="footer-orange-glow rounded-t-3xl border-t border-[#F3F4F6] py-12 text-sm text-[#6B7280]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 border-b border-[#F3F4F6] pb-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-[family-name:var(--font-display)] text-base font-bold tracking-tight text-[#111827]"
            >
              <Image
                src="/logo.png"
                alt="toolimg.online logo"
                width={28}
                height={28}
                referrerPolicy="no-referrer"
                className="h-7 w-7 rounded-md object-contain"
              />
              <span>toolimg.online</span>
            </Link>
            <p className="mt-3 text-xs leading-relaxed text-[#6B7280]">
              Fast, private image compression, format conversion, OCR, HTML
              rendering, and exact-spec resizing in your browser.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#111827] shadow-[0_1px_2px_rgba(17,24,39,0.03)] transition-colors hover:border-[#FDBA74] hover:text-[#EA580C]"
              >
                <MessageSquare className="h-3.5 w-3.5 text-[#F97316]" aria-hidden="true" />
                <span>Support</span>
              </Link>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#ECFDF5] px-2.5 py-1.5 text-xs font-medium text-[#059669]">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Privacy-First</span>
              </span>
            </div>
          </div>

          {/* Silo Pillars + Core Tools Column */}
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-wider text-[#111827]">
              Core Image Silos
            </h3>
            <ul className="mt-3 space-y-2">
              {SILO_PILLARS.map((pillar) => (
                <li key={pillar.id}>
                  <Link
                    href={pillar.href}
                    className="transition-colors hover:text-[#EA580C]"
                  >
                    {pillar.tabLabel}
                  </Link>
                </li>
              ))}
              {CORE_TOOLS.slice(0, 2).map((tool) => (
                <li key={tool.id}>
                  <Link
                    href={tool.href}
                    className="transition-colors hover:text-[#EA580C]"
                  >
                    {tool.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* OCR, Code & HTML Tools Column */}
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-wider text-[#111827]">
              OCR, Code &amp; Prompts
            </h3>
            <ul className="mt-3 space-y-2">
              {CREATOR_TOOLS.map((tool) => (
                <li key={tool.slug}>
                  <Link
                    href={tool.href}
                    className="transition-colors hover:text-[#EA580C]"
                  >
                    {tool.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Important Policy & Info Pages Column */}
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-wider text-[#111827]">
              Company &amp; Legal
            </h3>
            <ul className="mt-3 space-y-2">
              {IMPORTANT_PAGES.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-[#EA580C]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-3 text-xs text-[#9CA3AF] sm:flex-row sm:items-center">
          <p>&copy; {new Date().getFullYear()} toolimg.online. Built for speed &amp; privacy.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-[#EA580C]">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#EA580C]">
              Terms
            </Link>
            <Link href="/refund-policy" className="hover:text-[#EA580C]">
              Refund
            </Link>
            <Link href="/disclaimer" className="hover:text-[#EA580C]">
              Disclaimer
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
