import { Link, useLoaderData } from 'react-router';
import type { Route } from './+types/($locale).blog._index';
import { Image, getPaginationVariables } from '@shopify/hydrogen';
import type { ArticleItemFragment } from 'storefrontapi.generated';
import { PaginatedResourceSection } from '~/components/PaginatedResourceSection';
import { PaginationProgress } from '~/components/PaginationProgress';
import { Button } from '~/components/ui/button';
import { CallToAction } from '~/components/landing/CallToAction';
import { RotatingCube } from '~/components/landing/RotatingCube';
import { redirectIfHandleIsLocalized } from '~/lib/redirect';
import { useState, useMemo } from 'react';

export const meta: Route.MetaFunction = ({ data }: { data: any }) => {
  return [{ title: `Translate3D | ${data?.blog.title ?? 'Blog'}` }];
};

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return { ...deferredData, ...criticalData };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({ context, request, params }: Route.LoaderArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 4,
  });

  const blogHandle = 'blog';

  const [{ blog }] = await Promise.all([
    context.storefront.query(BLOGS_QUERY, {
      variables: {
        blogHandle,
        ...paginationVariables,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!blog?.articles) {
    throw new Response('Not found', { status: 404 });
  }

  redirectIfHandleIsLocalized(request, { handle: blogHandle, data: blog });

  return { blog };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({ context }: Route.LoaderArgs) {
  return {};
}

export default function Blog() {
  const { blog } = useLoaderData<typeof loader>();
  const { articles } = blog;
  const [activeFilter, setActiveFilter] = useState('RECIENTES');

  // Derived tags from loaded articles + default "RECIENTES"
  const filters = useMemo(() => {
    const allTags = new Set<string>();
    articles.nodes.forEach((article: ArticleItemFragment) => {
      (article as any).tags?.forEach((tag: string) => allTags.add(tag));
    });
    return ['RECIENTES', ...Array.from(allTags)].map((label) => ({
      label: label.toUpperCase(),
      value: label,
    }));
  }, [articles]);

  const filteredArticles = useMemo(() => {
    if (activeFilter === 'RECIENTES') return articles;
    return {
      ...articles,
      nodes: articles.nodes.filter(
        (article: ArticleItemFragment) =>
          (article as any).tags?.some((tag: string) => tag.toUpperCase() === activeFilter)
      ),
    };
  }, [articles, activeFilter]);

  return (
    <>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-10 px-6 py-10 pt-20 md:px-10 md:pt-28 lg:pt-32">
        {/* Header Section */}
        <div className="flex w-full flex-col items-start justify-start gap-[10px]">
          <div className="flex w-full flex-col items-start justify-start gap-6 lg:flex-row lg:items-end lg:gap-10">
            <div className="flex-1 font-manrope text-6xl font-extrabold uppercase leading-none text-dark md:text-7xl lg:text-8xl">
              blog
            </div>
            <div className="flex w-full flex-wrap content-start items-start justify-start gap-2 lg:max-w-[800px]">
              {filters.map((filter) => (
                <Button
                  key={filter.label}
                  variant={activeFilter === filter.value ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setActiveFilter(filter.value)}
                  className="transition-all"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Articles List */}
        <div className="flex w-full flex-col">
          <PaginatedResourceSection<ArticleItemFragment>
            connection={filteredArticles}
            resourcesClassName="flex flex-col gap-10"
          >
            {({ node: article, index }) => (
              <ArticleItem
                article={article}
                key={article.id}
                loading={index < 2 ? 'eager' : 'lazy'}
              />
            )}
          </PaginatedResourceSection>
        </div>

        {/* Pagination Progress */}
        <PaginationProgress
          currentCount={filteredArticles.nodes.length}
          totalCount={filteredArticles.nodes.length}
          pageBy={4}
          resourceName="Posts"
        />
      </div>

      {/* New Sections */}
      <RotatingCube />
      <CallToAction />
    </>
  );
}

function ArticleItem({
  article,
  loading,
}: {
  article: ArticleItemFragment;
  loading?: HTMLImageElement['loading'];
}) {
  return (
    <div className="group relative flex w-full flex-col items-start justify-start gap-5 border-t border-[#8F8F8F] bg-white pb-10 pt-5 md:flex-row">
      {/* Clickable Overlay */}
      <Link
        to={`/blog/${article.handle}`}
        prefetch="intent"
        className="absolute inset-0 z-0"
      >
        <span className="sr-only">Ver art&iacute;culo {article.title}</span>
      </Link>

      {/* Image Part */}
      <div className="relative z-10 w-full shrink-0 overflow-hidden md:w-[600px]">
        {article.image ? (
          <Image
            alt={article.image.altText || article.title}
            aspectRatio="600/338"
            data={article.image}
            loading={loading}
            sizes="(min-width: 768px) 600px, 100vw"
            className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex aspect-[600/338] w-full items-center justify-center bg-dark/5">
            <span className="font-anton text-sm uppercase text-dark/20">
              No Image
            </span>
          </div>
        )}
      </div>

      {/* Content Part */}
      <div className="pointer-events-none relative z-10 flex h-full flex-1 flex-col justify-between px-0 md:min-h-[338px] md:px-5">
        <div className="flex flex-col items-start justify-start gap-[10px]">
          {/* Tags */}
          <div className="flex flex-wrap items-start justify-start gap-[5px]">
            {((article as any).tags && (article as any).tags.length > 0
              ? (article as any).tags
              : ['blog']
            ).map((tag: string) => (
              <div
                key={tag}
                className="flex h-7 flex-col items-center justify-center gap-[10px] rounded-[53px] px-3 outline outline-1 outline-offset-[-1px] outline-[#CACACA]"
              >
                <div className="font-anton text-xs font-normal uppercase text-dark">
                  {tag}
                </div>
              </div>
            ))}
          </div>

          {/* Title */}
          <h3 className="self-stretch font-anton text-[32px] font-normal uppercase leading-tight text-[#0B0604] transition-colors group-hover:text-primary">
            {article.title}
          </h3>

          {/* Excerpt */}
          <div className="line-clamp-3 self-stretch font-manrope text-sm font-semibold leading-relaxed text-dark md:text-base md:leading-6">
            {(article as any).excerpt ||
              article.contentHtml
                .replace(/<[^>]*>?/gm, '')
                .substring(0, 160) + '...'}
          </div>
        </div>

        {/* CTA Button - Visual Only */}
        <div className="mt-6 flex items-center justify-start gap-[10px] self-start md:mt-0">
          <Button variant="primary">
            Leer art&iacute;culo
          </Button>
        </div>
      </div>
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog
const BLOGS_QUERY = `#graphql
  query Blog(
    $language: LanguageCode
    $blogHandle: String!
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(language: $language) {
    blog(handle: $blogHandle) {
      title
      handle
      seo {
        title
        description
      }
      articles(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ArticleItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          hasNextPage
          endCursor
          startCursor
        }

      }
    }
  }
  fragment ArticleItem on Article {
    author: authorV2 {
      name
    }
    contentHtml
    handle
    id
    image {
      id
      altText
      url
      width
      height
    }
    publishedAt
    title
    excerpt
    tags
    blog {
      handle
    }
  }
` as const;
