'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, Menu, Search, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import { SILO_PILLARS } from '@/lib/tools-data';
import { useImageSession } from '@/components/ImageSessionProvider';

export function Navbar() {
  const pathname = usePathname();
  const { setIsSearchOpen } = useImageSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-[#FFFFFF]/92 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:gap-8">
        {/* Zone 1: Brand Mark + Wordmark */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 whitespace-nowrap text-[#0F172A] transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 rounded-md"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB] text-white shadow-xs">
            <Layers className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight">
            toolimg.online
          </span>
        </Link>

        {/* Zone 2: 4 Silo Pillar Navigation Links */}
        <nav
          aria-label="Primary Silo Navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-[#475569]"
        >
          {SILO_PILLARS.map((pillar) => {
            const isActive =
              pathname === pillar.href || pathname.startsWith(`${pillar.href}/`);
            return (
              <Link
                key={pillar.id}
                href={pillar.href}
                className={`whitespace-nowrap shrink-0 py-1 transition-colors hover:text-[#0F172A] hover:underline hover:decoration-[#2563EB]/60 hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-sm ${
                  isActive
                    ? 'text-[#0F172A] underline decoration-[#2563EB] underline-offset-4'
                    : ''
                }`}
              >
                {pillar.name}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Emerald Trust Badge + Quick Search (⌘K) */}
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="hidden lg:inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-medium text-[#059669] border border-[#059669]/15">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>100% Client-Side · Zero Uploads</span>
          </span>

          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Open quick tool search (Command+K or slash)"
            className="inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs font-medium text-[#475569] transition-colors hover:border-[#CBD5E1] hover:bg-white hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-[#64748B]" aria-hidden="true" />
            <span className="hidden sm:inline">Search tools</span>
            <kbd className="hidden sm:inline-flex items-center rounded border border-[#E2E8F0] bg-white px-1.5 py-0.5 font-mono text-[11px] font-medium text-[#64748B]">
              ⌘K
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
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
        <div className="border-t border-[#E2E8F0] bg-white px-4 py-3 md:hidden">
          <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] px-2.5 py-1 text-xs font-medium text-[#059669]">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>100% Client-Side · Zero Uploads</span>
          </div>
          <nav aria-label="Mobile Silo Navigation" className="grid grid-cols-2 gap-2">
            {SILO_PILLARS.map((pillar) => (
              <Link
                key={pillar.id}
                href={pillar.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm font-medium text-[#0F172A] transition-colors hover:border-[#2563EB]/40 hover:bg-white"
              >
                {pillar.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
