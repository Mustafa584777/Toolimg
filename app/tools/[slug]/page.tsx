import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CREATOR_TOOLS, resolveCreatorToolBySlug } from '@/lib/tools-data';
import { CreatorToolWorkspace } from '@/components/CreatorToolWorkspace';

interface CreatorToolPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return CREATOR_TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: CreatorToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = resolveCreatorToolBySlug(slug);
  if (!tool) {
    return { title: 'Tool Not Found | toolimg.online' };
  }

  return {
    title: tool.metaTitle,
    description: tool.description,
    alternates: { canonical: `https://toolimg.online${tool.href}` },
  };
}

export default async function CreatorToolPage({ params }: CreatorToolPageProps) {
  const { slug } = await params;
  const tool = resolveCreatorToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  return <CreatorToolWorkspace tool={tool} />;
}
