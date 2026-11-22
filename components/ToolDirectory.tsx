'use client';

import Link from 'next/link';
import { Clock, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  CORE_TOOLS,
  SILO_PILLARS,
  type SiloCategory,
} from '@/lib/tools-data';
import { ToolIcon } from '@/components/ToolIcon';

type FilterTab = 'all' | SiloCategory;

function formatElapsedLaunch(launchedAt: string, nowMs: number): {
  hoursLabel: string;
  timerText: string;
} {
  const startMs = Date.parse(launchedAt);
  const diffSec = Math.max(0, Math.floor((nowMs - startMs) / 1000));
  const hours = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;
  const hh = String(hours).padStart(2, '0');
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  const hoursLabel =
    hours >= 1
      ? `Launched ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
      : `Launched ${mins}m ago`;
  return { hoursLabel, timerText: `${hh}:${mm}:${ss}` };
}

function LaunchedTimerBadge({ launchedAt }: { launchedAt: string }) {
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNowMs(Date.now());
    const initialTimer = setTimeout(update, 0);
    const intervalId = setInterval(update, 1000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalId);
    };
  }, []);

  const elapsed = nowMs !== null ? formatElapsedLaunch(launchedAt, nowMs) : null;

  return (
    <div className="mt-1.5 inline-flex max-w-full items-center gap-1 rounded-md bg-[#FFF7ED] px-2 py-0.5 text-[10px] font-semibold text-[#C2410C] sm:mt-2 sm:gap-1.5 sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-[11px]">
      <span className="relative flex h-1.5 w-1.5 shrink-0 sm:h-2 sm:w-2" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F97316] opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#EA580C] sm:h-2 sm:w-2" />
      </span>
      <Clock className="h-2.5 w-2.5 shrink-0 text-[#EA580C] sm:h-3 sm:w-3" aria-hidden="true" />
      <span className="truncate">{elapsed ? elapsed.hoursLabel : 'Launched 2 hours ago'}</span>
      <span aria-hidden="true">&middot;</span>
      <span className="shrink-0 font-mono tabular-nums text-[#EA580C]">
        {elapsed ? elapsed.timerText : '02:00:00'}
      </span>
    </div>
  );
}

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
          <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {filteredTools.map((tool, index) => (
              <article
                key={tool.id}
                className="card-orange-sheen group relative flex h-full flex-col justify-between rounded-2xl p-3.5 shadow-[0_10px_28px_-6px_rgba(17,24,39,0.10),0_4px_12px_-4px_rgba(234,88,12,0.08)] transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[0_22px_44px_-10px_rgba(17,24,39,0.16),0_10px_22px_-8px_rgba(234,88,12,0.22)] sm:p-5"
              >
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="min-w-0 font-[family-name:var(--font-display)] text-[13px] font-bold leading-snug text-[#111827] sm:text-base">
                      <Link
                        href={tool.href}
                        className="inline-flex items-start gap-1.5 text-left transition-colors group-hover:text-[#EA580C] after:absolute after:inset-0 after:z-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-[#F97316] sm:gap-2"
                      >
                        <ToolIcon
                          name={tool.iconName}
                          className="mt-0.5 h-4 w-4 shrink-0 text-[#EA580C] transition-transform group-hover:scale-110 sm:h-5 sm:w-5"
                        />
                        <span className="line-clamp-2 min-h-[2.25rem] sm:min-h-[2.75rem]">
                          {tool.title}
                        </span>
                      </Link>
                    </h3>

                    <span className="mt-0.5 shrink-0 font-mono text-[10px] font-semibold text-[#EA580C]/80 tabular-nums sm:text-xs">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="mt-1.5 min-h-[3.25rem] sm:mt-2 sm:min-h-[4rem]">
                    {tool.launchedAt && (
                      <LaunchedTimerBadge launchedAt={tool.launchedAt} />
                    )}

                    <p
                      className={`${
                        tool.launchedAt ? 'mt-1 line-clamp-2' : 'line-clamp-3'
                      } text-[11px] leading-relaxed text-[#6B7280] sm:text-sm`}
                    >
                      {tool.benefit}
                    </p>
                  </div>
                </div>

                <div className="mt-3 border-t border-[#F3F4F6] pt-2.5 sm:mt-4 sm:pt-3.5">
                  {/* Clickable Programmatic Preset Tags */}
                  <div className="flex min-h-[2.75rem] flex-wrap content-start items-start gap-1 sm:min-h-[3.25rem] sm:gap-1.5">
                    {tool.tags.map((tag) => (
                      <Link
                        key={`${tool.id}-${tag.label}`}
                        href={tag.href}
                        className="relative z-10 inline-flex items-center whitespace-nowrap rounded-md bg-[#F9FAFB] px-1.5 py-0.5 text-[10px] font-medium text-[#4B5563] transition-colors hover:bg-[#FFF7ED] hover:text-[#C2410C] sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-xs"
                      >
                        {tag.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
