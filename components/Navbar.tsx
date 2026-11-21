'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, Sun, X } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { SILO_PILLARS } from '@/lib/tools-data';
import { useImageSession } from '@/components/ImageSessionProvider';

let themeListeners: Array<() => void> = [];

function subscribeTheme(listener: () => void) {
  themeListeners.push(listener);
  return () => {
    themeListeners = themeListeners.filter((l) => l !== listener);
  };
}

function getThemeSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem('toolimg-theme') === 'dark';
}

function getThemeServerSnapshot(): boolean {
  return false;
}

export function Navbar() {
  const pathname = usePathname();
  const { setIsSearchOpen } = useImageSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isThemeActive = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isThemeActive);
  }, [isThemeActive]);

  const handleToggleTheme = () => {
    const next = !isThemeActive;
    window.localStorage.setItem('toolimg-theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
    themeListeners.forEach((l) => l());
  };

  return (
    <>
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
            <span className="font-[family-name:var(--font-space-mono)] text-base font-bold tracking-tight">
              <span>TOOL</span>
              <span className="text-[#EA580C]">IMG</span>
            </span>
          </Link>

          {/* Zone 2: Clean Centered Navigation Links */}
          <nav
            aria-label="Primary Silo Navigation"
            className="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-medium text-[#4B5563]"
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

          {/* Zone 3: Quick Search + Theme Toggle + Primary CTA + Mobile Sidebar Trigger */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Open quick tool search (Command+K or slash)"
              className="inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-[#F9FAFB] px-3 text-xs font-medium text-[#4B5563] transition-colors hover:bg-[#FFF7ED] hover:text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-[#F97316]" aria-hidden="true" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline-flex items-center rounded-md bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-[#6B7280]">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label="Toggle theme"
              aria-pressed={isThemeActive}
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-[#FFF7ED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] ${
                isThemeActive ? 'text-[#F97316]' : 'text-[#6B7280]'
              }`}
            >
              <Sun className="h-4 w-4" aria-hidden="true" />
            </button>

            <Link
              href="/contact"
              className="hidden sm:inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-xl bg-[#FFF7ED] px-3.5 text-xs font-semibold text-[#C2410C] transition-colors hover:bg-[#FFEDD5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2"
            >
              Request a Tool
            </Link>

            <Link
              href="/#tools"
              className="btn-orange-gradient hidden sm:inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-xl px-4 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2"
            >
              Browse Tools
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#EA580C] transition-colors hover:bg-[#FFF7ED] md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Right-Side Slide-Over Sidebar */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-[#111827]/35 backdrop-blur-[2px] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="flex h-full w-72 max-w-[82vw] flex-col justify-between bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sidebar Top Header */}
            <div>
              <div className="flex items-center justify-between border-b border-[#F3F4F6] px-5 py-4">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 text-[#111827]"
                >
                  <Image
                    src="/logo.png"
                    alt="toolimg.online logo"
                    width={26}
                    height={26}
                    referrerPolicy="no-referrer"
                    className="h-6.5 w-6.5 rounded-md object-contain"
                  />
                  <span className="font-[family-name:var(--font-space-mono)] text-base font-bold tracking-tight">
                    <span>TOOL</span>
                    <span className="text-[#EA580C]">IMG</span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation sidebar"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#FFF7ED] hover:text-[#EA580C]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {/* Sidebar Nav Links (borderless vertical list) */}
              <nav aria-label="Mobile Silo Navigation" className="space-y-1 px-3 py-4">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex min-h-[42px] items-center rounded-xl px-3.5 text-sm transition-colors ${
                    pathname === '/'
                      ? 'bg-[#FFF7ED] font-semibold text-[#C2410C]'
                      : 'font-medium text-[#374151] hover:bg-[#FFF7ED]/60 hover:text-[#EA580C]'
                  }`}
                >
                  Home
                </Link>
                {SILO_PILLARS.map((pillar) => {
                  const isActive =
                    pathname === pillar.href ||
                    pathname.startsWith(`${pillar.href}/`);
                  return (
                    <Link
                      key={pillar.id}
                      href={pillar.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex min-h-[42px] items-center rounded-xl px-3.5 text-sm transition-colors ${
                        isActive
                          ? 'bg-[#FFF7ED] font-semibold text-[#C2410C]'
                          : 'font-medium text-[#374151] hover:bg-[#FFF7ED]/60 hover:text-[#EA580C]'
                      }`}
                    >
                      {pillar.name}
                    </Link>
                  );
                })}
                <Link
                  href="/tools/image-to-code"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex min-h-[42px] items-center rounded-xl px-3.5 text-sm transition-colors ${
                    pathname.startsWith('/tools/')
                      ? 'bg-[#FFF7ED] font-semibold text-[#C2410C]'
                      : 'font-medium text-[#374151] hover:bg-[#FFF7ED]/60 hover:text-[#EA580C]'
                  }`}
                >
                  AI &amp; OCR Tools
                </Link>
              </nav>
            </div>

            {/* Sidebar Bottom Actions */}
            <div className="space-y-2.5 border-t border-[#F3F4F6] px-4 py-4">
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#FFF7ED] px-4 text-sm font-semibold text-[#C2410C] transition-colors hover:bg-[#FFEDD5]"
              >
                Request a Tool
              </Link>
              <Link
                href="/#tools"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-orange-gradient flex min-h-[44px] w-full items-center justify-center rounded-xl px-4 text-sm font-semibold"
              >
                Browse Tools
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
