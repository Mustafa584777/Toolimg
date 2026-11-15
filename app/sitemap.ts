import type { MetadataRoute } from 'next';
import {
  CORE_TOOLS,
  CREATOR_TOOLS,
  PROGRAMMATIC_SHORTCUTS,
  SILO_PILLARS,
} from '@/lib/tools-data';
import { LEGAL_PAGES } from '@/lib/legal-pages';

const BASE_URL = 'https://toolimg.online';

export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const seen = new Set<string>();
  const entries: MetadataRoute.Sitemap = [];

  const addEntry = (
    path: string,
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
    priority: number
  ) => {
    const url = `${BASE_URL}${path}`;
    if (seen.has(url)) return;
    seen.add(url);
    entries.push({
      url,
      lastModified: now,
      changeFrequency,
      priority,
    });
  };

  // 1. Homepage
  addEntry('/', 'daily', 1.0);

  // 2. Silo Pillar Hubs
  for (const pillar of SILO_PILLARS) {
    addEntry(pillar.href, 'weekly', 0.9);
  }

  // 3. All Tools (dynamically derived from CORE_TOOLS & CREATOR_TOOLS)
  for (const tool of CORE_TOOLS) {
    addEntry(tool.href, 'weekly', 0.85);
  }
  for (const tool of CREATOR_TOOLS) {
    addEntry(tool.href, 'weekly', 0.85);
  }

  // 4. Programmatic Spec Shortcuts
  for (const shortcut of PROGRAMMATIC_SHORTCUTS) {
    addEntry(shortcut.href, 'weekly', 0.8);
  }

  // 5. Important Policy & Info Pages
  for (const slug of Object.keys(LEGAL_PAGES)) {
    addEntry(`/${slug}`, 'monthly', 0.5);
  }

  return entries;
}
