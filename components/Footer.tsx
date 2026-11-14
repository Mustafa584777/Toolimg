import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { CORE_TOOLS, CREATOR_TOOLS, SILO_PILLARS } from '@/lib/tools-data';

const IMPORTANT_PAGES = [
  { label: 'Privacy Policy', href: '/privacy-policy.html' },
  { label: 'Terms & Conditions', href: '/terms.html' },
  { label: 'Contact Us', href: '/contact.html' },
  { label: 'Refund Policy', href: '/refund-policy.html' },
  { label: 'Disclaimer', href: '/disclaimer.html' },
  { label: 'About Us', href: '/about.html' },
];

export function Footer() {
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
            <p className="mt-3 text-xs leading-relaxed text-[#475569]">
              Fast, private image compression, format conversion, OCR, HTML
              rendering, and exact-spec resizing in your browser.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] px-2.5 py-1 text-xs font-medium text-[#059669]">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Privacy-First Utilities</span>
            </div>
          </div>

          {/* Silo Pillars + Core Tools Column */}
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-wider text-[#0F172A]">
              Core Image Silos
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
              {CORE_TOOLS.slice(0, 2).map((tool) => (
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

          {/* OCR, Code & HTML Tools Column */}
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-wider text-[#0F172A]">
              OCR, Code &amp; Prompts
            </h3>
            <ul className="mt-3 space-y-2">
              {CREATOR_TOOLS.map((tool) => (
                <li key={tool.slug}>
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

          {/* Important Policy & Info Pages Column */}
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-wider text-[#0F172A]">
              Company &amp; Legal
            </h3>
            <ul className="mt-3 space-y-2">
              {IMPORTANT_PAGES.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-[#2563EB]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-3 text-xs text-[#64748B] sm:flex-row sm:items-center">
          <p>&copy; {new Date().getFullYear()} toolimg.online. Built for speed &amp; privacy.</p>
          <p>Browser Canvas · OCR · Creator Tools</p>
        </div>
      </div>
    </footer>
  );
}
