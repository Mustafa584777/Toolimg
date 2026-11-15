import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CORE_TOOLS, resolveToolByPath } from '@/lib/tools-data';
import { ToolWorkspace } from '@/components/ToolWorkspace';

interface SiloToolPageProps {
  params: Promise<{ pillar: string; tool: string }>;
}

export function generateStaticParams() {
  return CORE_TOOLS.map((t) => {
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

  return {
    title: `${resolved.tool.title} — Free Private Online Tool | toolimg.online`,
    description: resolved.tool.benefit,
    alternates: { canonical: `https://toolimg.online${resolved.tool.href}` },
  };
}

export default async function SiloToolPage({ params }: SiloToolPageProps) {
  const { pillar, tool } = await params;
  const resolved = resolveToolByPath(pillar, tool);

  if (!resolved || !resolved.tool) {
    notFound();
  }

  return (
    <ToolWorkspace
      title={resolved.tool.title}
      description={resolved.tool.benefit}
      category={resolved.tool.category}
      mode={resolved.tool.mode}
      preset={resolved.tool.defaultPreset}
    />
  );
}
