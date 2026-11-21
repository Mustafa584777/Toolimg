'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, X } from 'lucide-react';
import { useState } from 'react';
import { SILO_PILLARS } from '@/lib/tools-data';
import { useImageSession } from '@/components/ImageSessionProvider';

export function Navbar() {
  const pathname = usePathname();
  const { setIsSearchOpen } = useImageSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#F3F4F6] bg-white/92 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:gap-8">
        {/* Zone 1: Brand Mark + Wordmark */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg text-[#111827] transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2"
        >
          <Image
            src="/logo.png"
            alt="toolimg.online logo"
            width={32}
            height={32}
            priority
            referrerPolicy="no-referrer"
            className="h-8 w-8 rounded-lg object-contain"
          />
          <span className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight">
            toolimg.online
          </span>
        </Link>

        {/* Zone 2: Clean Centered Navigation Links */}
        <nav
          aria-label="Primary Silo Navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-[#4B5563]"
        >
          <Link
            href="/"
            className={`whitespace-nowrap shrink-0 py-1 transition-colors hover:text-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] rounded-sm ${
              pathname === '/' ? 'font-semibold text-[#111827]' : ''
            }`}
          >
            Home
          </Link>
          {SILO_PILLARS.map((pillar) => {
            const isActive =
              pathname === pillar.href || pathname.startsWith(`${pillar.href}/`);
            return (
              <Link
                key={pillar.id}
                href={pillar.href}
                className={`whitespace-nowrap shrink-0 py-1 transition-colors hover:text-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] rounded-sm ${
                  isActive
                    ? 'font-semibold text-[#EA580C] underline decoration-[#F97316] decoration-2 underline-offset-8'
                    : ''
                }`}
              >
                {pillar.name}
              </Link>
            );
          })}
          <Link
            href="/tools/image-to-code"
            className={`whitespace-nowrap shrink-0 py-1 transition-colors hover:text-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] rounded-sm ${
              pathname.startsWith('/tools/')
                ? 'font-semibold text-[#EA580C] underline decoration-[#F97316] decoration-2 underline-offset-8'
                : ''
            }`}
          >
            AI &amp; OCR Tools
          </Link>
        </nav>

        {/* Zone 3: Quick Search + Primary Orange Gradient CTA */}
        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Open quick tool search (Command+K or slash)"
            className="inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-[#E5E7EB] bg-white px-3 text-xs font-medium text-[#4B5563] shadow-[0_1px_2px_rgba(17,24,39,0.03)] transition-colors hover:border-[#FDBA74] hover:text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-[#F97316]" aria-hidden="true" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline-flex items-center rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-1.5 py-0.5 font-mono text-[10px] font-medium text-[#6B7280]">
              ⌘K
            </kbd>
          </button>

          <Link
            href="/#tools"
            className="btn-orange-gradient hidden sm:inline-flex h-9 items-center justify-center rounded-xl px-4 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2"
          >
            Browse Tools
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#EA580C] md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-[#F3F4F6] bg-white px-4 py-4 md:hidden">
          <nav aria-label="Mobile Silo Navigation" className="grid grid-cols-2 gap-2.5">
            {SILO_PILLARS.map((pillar) => (
              <Link
                key={pillar.id}
                href={pillar.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm font-medium text-[#111827] transition-colors hover:border-[#FDBA74] hover:bg-[#FFF7ED]"
              >
                {pillar.name}
              </Link>
            ))}
            <Link
              href="/tools/image-to-code"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[44px] items-center rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm font-medium text-[#111827] transition-colors hover:border-[#FDBA74] hover:bg-[#FFF7ED]"
            >
              AI &amp; OCR Tools
            </Link>
            <Link
              href="/#tools"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-orange-gradient flex min-h-[44px] items-center justify-center rounded-xl px-3 text-sm font-semibold"
            >
              Browse All Tools
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
