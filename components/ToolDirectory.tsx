'use client';

import Link from 'next/link';
import { ExternalLink, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  CORE_TOOLS,
  SILO_PILLARS,
  type SiloCategory,
} from '@/lib/tools-data';
import { ToolIcon } from '@/components/ToolIcon';

type FilterTab = 'all' | SiloCategory;

export function ToolDirectory() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs: { id: FilterTab; label: string; count: number }[] = useMemo(
    () => [
      { id: 'all', label: `All Tools (${CORE_TOOLS.length})`, count: CORE_TOOLS.length },
      ...SILO_PILLARS.map((p) => ({
        id: p.id as FilterTab,
        label: p.tabLabel,
        count: CORE_TOOLS.filter((t) => t.category === p.id).length,
      })),
      {
        id: 'ai-tools',
        label: 'OCR, Code & Prompts',
        count: CORE_TOOLS.filter((t) => t.category === 'ai-tools').length,
      },
    ],
    []
  );

  const filteredTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CORE_TOOLS.filter((tool) => {
      const matchesTab = activeTab === 'all' || tool.category === activeTab;
      if (!matchesTab) return false;
      if (!q) return true;
      return (
        tool.title.toLowerCase().includes(q) ||
        tool.benefit.toLowerCase().includes(q) ||
        tool.tags.some((t) => t.label.toLowerCase().includes(q)) ||
        tool.href.toLowerCase().includes(q)
      );
    });
  }, [activeTab, searchQuery]);

  return (
    <section id="tools" className="border-b border-[#F3F4F6] bg-white py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Centered Editorial Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight text-[#111827] sm:text-4xl">
            <span className="mr-2 font-medium text-[#F97316]" aria-hidden="true">
              &rsaquo;
            </span>
            Core Image{' '}
            <span className="text-orange-gradient">Tools Hub</span>
            <span className="ml-2 font-medium text-[#F97316]" aria-hidden="true">
              &lsaquo;
            </span>
          </h2>
          <p className="mt-2.5 text-sm text-[#6B7280] sm:text-base">
            Pick a specialized browser utility below or jump straight to a
            preset specification.
          </p>
        </div>

        {/* Category Filter Tabs + Search Bar */}
        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="tablist"
            aria-label="Tool categories"
            className="flex items-center gap-2 overflow-x-auto pb-1"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex min-h-[38px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-all sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] ${
                    isActive
                      ? 'btn-orange-gradient'
                      : 'bg-[#F9FAFB] text-[#4B5563] hover:bg-[#FFF7ED] hover:text-[#EA580C]'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-72 shrink-0">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#F97316]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tools (50KB, HEIC, EXIF, SVG)..."
              aria-label="Filter image tools"
              className="h-10 w-full rounded-xl border border-[#E5E7EB] bg-white pl-10 pr-9 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-colors focus:border-[#F97316] focus:outline-none focus:ring-2 focus:ring-[#F97316]/15"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear tool filter"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[#F97316] hover:text-[#EA580C]"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Core Hub Tool Cards Grid */}
        {filteredTools.length === 0 ? (
          <div className="card-orange-sheen mt-8 rounded-2xl px-6 py-12 text-center shadow-[0_10px_28px_-6px_rgba(17,24,39,0.10),0_4px_12px_-4px_rgba(234,88,12,0.08)]">
            <p className="text-sm font-semibold text-[#111827]">
              No tools match &ldquo;{searchQuery}&rdquo;
            </p>
            <p className="mt-1 text-xs text-[#6B7280]">
              Try searching for KB compression, HEIC, EXIF, Discord, Passport, or
              Base64.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
              }}
              className="btn-orange-gradient mt-4 rounded-xl px-5 py-2 text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTools.map((tool, index) => (
              <article
                key={tool.id}
                className="card-orange-sheen group flex flex-col justify-between rounded-2xl p-5 shadow-[0_10px_28px_-6px_rgba(17,24,39,0.10),0_4px_12px_-4px_rgba(234,88,12,0.08)] transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[0_22px_44px_-10px_rgba(17,24,39,0.16),0_10px_22px_-8px_rgba(234,88,12,0.22)]"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-[family-name:var(--font-display)] text-base font-bold text-[#111827]">
                      <Link
                        href={tool.href}
                        className="inline-flex items-center gap-2.5 hover:text-[#EA580C] focus-visible:outline-none focus-visible:underline"
                      >
                        <ToolIcon
                          name={tool.iconName}
                          className="h-5 w-5 shrink-0 text-[#EA580C] transition-transform group-hover:scale-110"
                        />
                        <span>{tool.title}</span>
                      </Link>
                    </h3>

                    <span className="mt-0.5 shrink-0 font-mono text-xs font-semibold text-[#EA580C]/80 tabular-nums">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
                    {tool.benefit}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2.5 border-t border-[#F3F4F6] pt-3.5">
                  {/* Clickable Programmatic Preset Tags */}
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    {tool.tags.map((tag) => (
                      <Link
                        key={`${tool.id}-${tag.label}`}
                        href={tag.href}
                        className="inline-flex items-center whitespace-nowrap rounded-lg bg-[#F9FAFB] px-2 py-1 text-[11px] font-medium text-[#4B5563] transition-colors hover:bg-[#FFF7ED] hover:text-[#C2410C]"
                      >
                        {tag.label}
                      </Link>
                    ))}
                  </div>

                  <Link
                    href={tool.href}
                    className="btn-orange-gradient inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>Open Tool</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
