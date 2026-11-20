import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, ShieldCheck } from 'lucide-react';
import {
  CORE_TOOLS,
  PROGRAMMATIC_SHORTCUTS,
  SILO_PILLARS,
  resolveToolByPath,
} from '@/lib/tools-data';
import { ToolIcon } from '@/components/ToolIcon';
import { ToolWorkspace } from '@/components/ToolWorkspace';

interface PillarOrShortcutPageProps {
  params: Promise<{ pillar: string }>;
}

export function generateStaticParams() {
  return [
    ...SILO_PILLARS.map((p) => ({ pillar: p.id })),
    ...PROGRAMMATIC_SHORTCUTS.map((s) => ({ pillar: s.slug })),
  ];
}

export async function generateMetadata({
  params,
}: PillarOrShortcutPageProps): Promise<Metadata> {
  const { pillar } = await params;
  const resolved = resolveToolByPath(pillar);
  if (!resolved) {
    return { title: 'Tool Not Found | toolimg.online' };
  }

  if (resolved.kind === 'pillar' && resolved.pillar) {
    const canonicalUrl = `https://toolimg.online${resolved.pillar.href}`;
    const title = `${resolved.pillar.headline} | toolimg.online`;
    return {
      title,
      description: resolved.pillar.description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        url: canonicalUrl,
        title,
        description: resolved.pillar.description,
      },
    };
  }

  if (resolved.kind === 'shortcut' && resolved.shortcut) {
    const canonicalUrl = `https://toolimg.online${resolved.shortcut.href}`;
    const title = `${resolved.shortcut.title} — Free Private Online Tool | toolimg.online`;
    return {
      title,
      description: resolved.shortcut.description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        url: canonicalUrl,
        title,
        description: resolved.shortcut.description,
      },
    };
  }

  return {};
}

export default async function PillarOrShortcutPage({
  params,
}: PillarOrShortcutPageProps) {
  const { pillar } = await params;
  const resolved = resolveToolByPath(pillar);

  if (!resolved) {
    notFound();
  }

  if (resolved.kind === 'shortcut' && resolved.shortcut) {
    return (
      <ToolWorkspace
        title={resolved.shortcut.title}
        description={resolved.shortcut.description}
        category={resolved.shortcut.category}
        mode={resolved.shortcut.mode}
        preset={resolved.shortcut.preset}
      />
    );
  }

  const silo = resolved.pillar!;
  const toolsInPillar = CORE_TOOLS.filter((t) => t.category === silo.id);
  const shortcutsInPillar = PROGRAMMATIC_SHORTCUTS.filter(
    (s) => s.category === silo.id
  );

  return (
    <section className="hero-orange-glow py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B7280] hover:text-[#EA580C]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Back to toolimg.online Hub</span>
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl">
              {silo.headline}
            </h1>
            <p className="mt-2 max-w-2xl text-base text-[#6B7280]">
              {silo.description}
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-medium text-[#059669]">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>100% Browser-Based</span>
          </span>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {toolsInPillar.map((tool) => (
            <article
              key={tool.id}
              className="card-orange-sheen group flex flex-col justify-between rounded-2xl border border-[#E5E7EB] p-5 shadow-[0_1px_3px_rgba(17,24,39,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#FDBA74] hover:shadow-[0_12px_28px_-10px_rgba(234,88,12,0.14)]"
            >
              <div>
                <div className="flex items-start justify-between">
                  <Link
                    href={tool.href}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#FED7AA] bg-[#FFF7ED] text-[#EA580C]"
                  >
                    <ToolIcon name={tool.iconName} className="h-5 w-5" />
                  </Link>
                  <Link
                    href={tool.href}
                    aria-label={`Open ${tool.title}`}
                    className="p-1.5 text-[#9CA3AF] group-hover:text-[#EA580C]"
                  >
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>

                <h2 className="mt-4 font-[family-name:var(--font-display)] text-base font-bold text-[#111827]">
                  <Link href={tool.href} className="hover:text-[#EA580C]">
                    {tool.title}
                  </Link>
                </h2>
                <p className="mt-1.5 text-sm text-[#6B7280]">{tool.benefit}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[#F3F4F6] pt-3.5">
                {tool.tags.map((tag) => (
                  <Link
                    key={`${tool.id}-${tag.label}`}
                    href={tag.href}
                    className="rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1 text-xs font-medium text-[#4B5563] hover:border-[#FB923C] hover:bg-[#FFF7ED] hover:text-[#C2410C]"
                  >
                    {tag.label}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>

        {shortcutsInPillar.length > 0 && (
          <div className="card-orange-sheen mt-12 rounded-2xl border border-[#E5E7EB] p-6">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[#111827]">
              Direct Spec Shortcuts
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {shortcutsInPillar.map((sc) => (
                <Link
                  key={sc.slug}
                  href={sc.href}
                  className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#111827] hover:border-[#FB923C] hover:bg-[#FFF7ED]"
                >
                  <span>{sc.title}</span>
                  <ArrowUpRight className="h-4 w-4 text-[#EA580C]" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
