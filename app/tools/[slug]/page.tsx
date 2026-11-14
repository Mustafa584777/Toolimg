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

  const canonicalUrl = `https://toolimg.online/tools/${tool.slug}`;

  return {
    title: tool.metaTitle,
    description: tool.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      url: canonicalUrl,
      title: tool.metaTitle,
      description: tool.description,
    },
  };
}

export default async function CreatorToolPage({ params }: CreatorToolPageProps) {
  const { slug } = await params;
  const tool = resolveCreatorToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  return (
    <>
      <CreatorToolWorkspace tool={tool} />
      <section className="border-t border-[#E2E8F0] bg-white py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[#0F172A]">
            About {tool.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#475569]">
            {tool.description} Built by toolimg.online for instant browser-based
            workflows with clean output, zero watermarks, and no account
            required.
          </p>
        </div>
      </section>
    </>
  );
}
