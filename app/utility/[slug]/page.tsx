import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  EXTENDED_TOOLS,
  resolveExtendedToolBySlug,
} from '@/lib/extended-tools-data';
import { ExtendedToolWorkspace } from '@/components/ExtendedToolWorkspace';

interface UtilityPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return EXTENDED_TOOLS.map((tool) => ({
    slug: tool.slug,
  }));
}

export async function generateMetadata({
  params,
}: UtilityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = resolveExtendedToolBySlug(slug);

  if (!tool) {
    return {
      title: 'Utility Not Found | toolimg.online',
      robots: {
        index: false,
        follow: false,
        nocache: true,
      },
    };
  }

  return {
    title: `${tool.title} — Private Browser Utility | toolimg.online`,
    description: tool.description,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}

export default async function ExtendedUtilityPage({ params }: UtilityPageProps) {
  const { slug } = await params;
  const tool = resolveExtendedToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  return (
    <>
      <ExtendedToolWorkspace tool={tool} />
      <section className="border-t border-[#F3F4F6] bg-white py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[#111827]">
            How {tool.title} Runs Privately
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#6B7280]">
            {tool.description} Every step executes directly inside your browser using
            HTML5 Canvas and Web APIs—your files never leave your device.
          </p>
        </div>
      </section>
    </>
  );
}
