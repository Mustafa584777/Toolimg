'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CORE_TOOLS,
  PROGRAMMATIC_SHORTCUTS,
  SILO_PILLARS,
} from '@/lib/tools-data';
import { useImageSession } from '@/components/ImageSessionProvider';
import { ToolIcon } from '@/components/ToolIcon';

interface SearchEntry {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  group: string;
  iconName?: (typeof CORE_TOOLS)[number]['iconName'];
}

export function CommandSearchModal() {
  const { isSearchOpen, setIsSearchOpen } = useImageSession();
  if (!isSearchOpen) return null;
  return <CommandSearchDialog onClose={() => setIsSearchOpen(false)} />;
}

function CommandSearchDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const entries: SearchEntry[] = useMemo(() => {
    const toolEntries: SearchEntry[] = CORE_TOOLS.map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: `${t.benefit} (${t.tags.map((tag) => tag.label).join(', ')})`,
      href: t.href,
      group: 'Core Tools',
      iconName: t.iconName,
    }));

    const shortcutEntries: SearchEntry[] = PROGRAMMATIC_SHORTCUTS.map((s) => ({
      id: s.slug,
      title: s.title,
      subtitle: s.description,
      href: s.href,
      group: 'Quick Specs',
    }));

    const pillarEntries: SearchEntry[] = SILO_PILLARS.map((p) => ({
      id: p.id,
      title: `${p.name} Hub`,
      subtitle: p.description,
      href: p.href,
      group: 'Categories',
    }));

    return [...toolEntries, ...shortcutEntries, ...pillarEntries];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries.slice(0, 10);
    return entries.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.href.toLowerCase().includes(q)
    );
  }, [entries, query]);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 20);
    return () => clearTimeout(timer);
  }, []);

  const navigateTo = (href: string) => {
    onClose();
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filtered.length > 0 ? (prev + 1) % filtered.length : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filtered.length > 0
          ? (prev - 1 + filtered.length) % filtered.length
          : 0
      );
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      navigateTo(filtered[selectedIndex].href);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#111827]/40 px-4 pt-20 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Quick Tool Search"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[#F3F4F6] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-[#F97316]" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search tools (e.g. 50KB, HEIC, EXIF, Passport, Base64)..."
            className="w-full bg-transparent text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="rounded-lg p-1 text-[#6B7280] hover:bg-[#FFF7ED] hover:text-[#111827]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-[#6B7280]">
              No matching image tools for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <ul role="listbox" aria-label="Matching tools" className="space-y-1">
              {filtered.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => navigateTo(item.href)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        isSelected
                          ? 'bg-[#FFF7ED] text-[#111827]'
                          : 'text-[#111827] hover:bg-[#FAFAFA]'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                            isSelected
                              ? 'border-[#FED7AA] bg-white text-[#EA580C]'
                              : 'border-[#E5E7EB] bg-[#FAFAFA] text-[#6B7280]'
                          }`}
                        >
                          {item.iconName ? (
                            <ToolIcon name={item.iconName} className="h-4 w-4" />
                          ) : (
                            <Search className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold">
                              {item.title}
                            </span>
                            <span className="shrink-0 text-xs text-[#9CA3AF]">
                              &middot; {item.group}
                            </span>
                          </div>
                          <p className="truncate text-xs text-[#6B7280]">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                      <ArrowRight
                        className={`h-4 w-4 shrink-0 ${
                          isSelected ? 'text-[#EA580C]' : 'text-[#D1D5DB]'
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#F3F4F6] bg-[#FAFAFA] px-4 py-2 text-xs text-[#9CA3AF]">
          <span>Use &uarr; &darr; to navigate, Enter to open</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}
