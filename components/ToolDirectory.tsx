'use client';

import Link from 'next/link';
import { ArrowUpRight, Search, X } from 'lucide-react';
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
    <section id="tools" className="bg-white py-14 sm:py-16 border-b border-[#E2E8F0]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header + Search Bar */}
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
              Core Image Tools Hub
            </h2>
            <p className="mt-1.5 text-sm text-[#475569] sm:text-base">
              Pick a specialized browser utility below or jump straight to a
              preset specification.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tools (50KB, HEIC, EXIF, SVG)..."
              aria-label="Filter image tools"
              className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] pl-10 pr-9 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-colors focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear tool filter"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div
          role="tablist"
          aria-label="Tool categories"
          className="mt-6 flex items-center gap-1.5 overflow-x-auto pb-1"
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
                className={`inline-flex min-h-[38px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-medium transition-colors sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                  isActive
                    ? 'bg-[#0F172A] text-white shadow-2xs'
                    : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] hover:border-[#CBD5E1] hover:bg-white hover:text-[#0F172A]'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 10 Core Hub Tool Cards Grid */}
        {filteredTools.length === 0 ? (
          <div className="mt-8 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-6 py-12 text-center">
            <p className="text-sm font-medium text-[#0F172A]">
              No tools match &ldquo;{searchQuery}&rdquo;
            </p>
            <p className="mt-1 text-xs text-[#475569]">
              Try searching for KB compression, HEIC, EXIF, Discord, Passport, or
              Base64.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
              }}
              className="mt-4 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTools.map((tool) => (
              <article
                key={tool.id}
                className="group flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#CBD5E1] hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={tool.href}
                      aria-label={tool.title}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#2563EB] transition-colors group-hover:border-[#BFDBFE] group-hover:bg-[#EFF6FF]"
                    >
                      <ToolIcon name={tool.iconName} className="h-5 w-5" />
                    </Link>

                    <Link
                      href={tool.href}
                      aria-label={`Open ${tool.title}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] transition-colors group-hover:bg-[#F8FAFC] group-hover:text-[#2563EB]"
                    >
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>

                  <h3 className="mt-4 font-[family-name:var(--font-display)] text-base font-semibold text-[#0F172A]">
                    <Link
                      href={tool.href}
                      className="hover:text-[#2563EB] focus-visible:outline-none focus-visible:underline"
                    >
                      {tool.title}
                    </Link>
                  </h3>

                  <p className="mt-1.5 text-sm leading-relaxed text-[#475569]">
                    {tool.benefit}
                  </p>
                </div>

                {/* Clickable Programmatic Preset Tags */}
                <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-[#F1F5F9] pt-3.5">
                  {tool.tags.map((tag) => (
                    <Link
                      key={`${tool.id}-${tag.label}`}
                      href={tag.href}
                      className="inline-flex items-center whitespace-nowrap rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-xs font-medium text-[#475569] transition-colors hover:border-[#2563EB]/40 hover:bg-[#EFF6FF] hover:text-[#1D4ED8]"
                    >
                      {tag.label}
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
