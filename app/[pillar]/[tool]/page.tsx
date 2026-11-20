import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CORE_TOOLS, resolveToolByPath } from '@/lib/tools-data';
import { ToolWorkspace } from '@/components/ToolWorkspace';

interface SiloToolPageProps {
  params: Promise<{ pillar: string; tool: string }>;
}

export function generateStaticParams() {
  return CORE_TOOLS.filter((t) => t.category !== 'ai-tools').map((t) => {
    const [, pillar, tool] = t.href.split('/');
    return { pillar, tool };
  });
}

export async function generateMetadata({
  params,
}: SiloToolPageProps): Promise<Metadata> {
  const { pillar, tool } = await params;
  const resolved = resolveToolByPath(pillar, tool);
  if (!resolved || !resolved.tool) {
    return { title: 'Tool Not Found | toolimg.online' };
  }

  const canonicalUrl = `https://toolimg.online${resolved.tool.href}`;

  return {
    title: `${resolved.tool.title} — Free Private Online Tool | toolimg.online`,
    description: resolved.tool.benefit,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      url: canonicalUrl,
      title: `${resolved.tool.title} — Free Private Online Tool | toolimg.online`,
      description: resolved.tool.benefit,
    },
  };
}

export default async function SiloToolPage({ params }: SiloToolPageProps) {
  const { pillar, tool } = await params;
  const resolved = resolveToolByPath(pillar, tool);

  if (!resolved || !resolved.tool) {
    notFound();
  }

  return (
    <>
      <ToolWorkspace
        title={resolved.tool.title}
        description={resolved.tool.benefit}
        category={resolved.tool.category}
        mode={resolved.tool.mode}
        preset={resolved.tool.defaultPreset}
      />
      <section className="border-t border-[#F3F4F6] bg-white py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[#111827]">
            How {resolved.tool.title} Works Privately
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#6B7280]">
            {resolved.tool.benefit} Every step executes directly inside your
            browser using HTML5 Canvas and Web APIs—your image never leaves your
            device.
          </p>
        </div>
      </section>
    </>
  );
}
