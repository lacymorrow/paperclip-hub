import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Suspense } from "react";
import remarkGfm from "remark-gfm";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { constructMetadata } from "@/config/metadata";
import { siteConfig } from "@/config/site-config";
import { getAllDocSlugsFromFileSystem, getDocFromParams } from "@/lib/docs";
import { getMDXComponents } from "@/mdx-components";

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export async function generateStaticParams() {
  const slugs = await getAllDocSlugsFromFileSystem();

  return slugs.map((slug: string) => {
    // For the index page, return empty array for slug
    if (slug === "index") {
      return { slug: [] };
    }
    // For other pages, split the slug into segments
    return { slug: slug.split("/") };
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const defaultMetadata = constructMetadata({
    title: `Documentation | ${siteConfig.title}`,
    description: `Browse and search plugins, submit your own, and learn the registry format for ${siteConfig.title}.`,
    openGraph: {
      type: "article",
      siteName: `${siteConfig.title} Documentation`,
      locale: "en_US",
    },
  });

  try {
    const doc = await getDocFromParams(params);

    if (!doc) {
      return defaultMetadata;
    }

    return constructMetadata({
      title: `${doc.title} - ${siteConfig.title} Documentation`,
      description: doc.description || `${doc.title} — ${siteConfig.title} documentation.`,
      openGraph: {
        type: "article",
        siteName: `${siteConfig.title} Documentation`,
        title: doc.title,
        description: doc.description,
        locale: "en_US",
      },
    });
  } catch (_error) {
    return defaultMetadata;
  }
}

export default async function DocsPage({ params }: PageProps) {
  const doc = await getDocFromParams(params);

  if (!doc?.content) {
    notFound();
  }

  return (
    <article className="docs-content">
      <Suspense fallback={<SuspenseFallback />}>
        <MDXRemote
          source={doc.content}
          components={getMDXComponents({})}
          options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
        />
      </Suspense>
    </article>
  );
}
