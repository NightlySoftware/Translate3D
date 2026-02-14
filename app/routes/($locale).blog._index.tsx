import { useLoaderData } from 'react-router';
import type { Route } from './+types/($locale).blog._index';
import { getPaginationVariables } from '@shopify/hydrogen';
import type { ArticleItemFragment } from 'storefrontapi.generated';
import { PaginatedResourceSection } from '~/components/PaginatedResourceSection';
import { Button } from '~/components/ui/button';
import { BlogPostListItem } from '~/components/blog/BlogPostListItem';
import { redirectIfHandleIsLocalized } from '~/lib/redirect';
import { useMemo, useState } from 'react';

export const meta: Route.MetaFunction = ({ data }: { data: any }) => {
  return [{ title: `Translate3D | ${data?.blog.title ?? 'Blog'}` }];
};

const BLOG_FILTERS = [
  'TODOS',
  'POPULARES',
  'RECIENTES',
  'EN STOCK',
  'DESCARGA GRATUITA',
  'DE PAGA',
] as const;

type BlogFilter = (typeof BLOG_FILTERS)[number];

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);

  return { ...deferredData, ...criticalData };
}

async function loadCriticalData({ context, request }: Route.LoaderArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 6,
  });

  const blogHandle = 'blog';

  const [{ blog }] = await Promise.all([
    context.storefront.query(BLOGS_QUERY, {
      variables: {
        blogHandle,
        ...paginationVariables,
      },
    }),
  ]);

  if (!blog?.articles) {
    throw new Response('Not found', { status: 404 });
  }

  redirectIfHandleIsLocalized(request, { handle: blogHandle, data: blog });

  return { blog };
}

function loadDeferredData({ context }: Route.LoaderArgs) {
  return {};
}

function normalizeTag(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export default function Blog() {
  const { blog } = useLoaderData<typeof loader>();
  const { articles } = blog;
  const [activeFilter, setActiveFilter] = useState<BlogFilter>('TODOS');

  const filteredArticles = useMemo(() => {
    const nodes = articles.nodes;

    if (activeFilter === 'TODOS' || activeFilter === 'RECIENTES') {
      return articles;
    }

    const filterTagMap: Record<Exclude<BlogFilter, 'TODOS' | 'RECIENTES'>, string> = {
      POPULARES: 'populares',
      'EN STOCK': 'en stock',
      'DESCARGA GRATUITA': 'descarga gratuita',
      'DE PAGA': 'de paga',
    };

    const expectedTag = filterTagMap[activeFilter as Exclude<BlogFilter, 'TODOS' | 'RECIENTES'>];

    return {
      ...articles,
      nodes: nodes.filter((article: ArticleItemFragment) =>
        ((article as any).tags ?? []).some(
          (tag: string) => normalizeTag(tag) === normalizeTag(expectedTag),
        ),
      ),
    };
  }, [articles, activeFilter]);

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-10 px-5 pb-16 pt-24 md:px-10 lg:pt-28">
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
          <h1 className="flex-1 font-manrope text-[clamp(2.75rem,9vw,4.75rem)] font-extrabold uppercase leading-[0.92] tracking-tight text-dark">
            Blog
          </h1>

          <div className="flex w-full flex-wrap content-start gap-2 lg:max-w-[800px]">
            {BLOG_FILTERS.map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? 'primary' : 'secondary'}
                size="default"
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="self-stretch">
        <PaginatedResourceSection<ArticleItemFragment>
          connection={filteredArticles}
          resourcesClassName="flex flex-col"
          resourceName="posts"
          total={filteredArticles.nodes.length}
        >
          {({ node: article, index }) => (
            <BlogPostListItem
              article={article as any}
              key={article.id}
              loading={index < 2 ? 'eager' : 'lazy'}
            />
          )}
        </PaginatedResourceSection>
      </section>
    </div>
  );
}

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
        first: $first
        last: $last
        before: $startCursor
        after: $endCursor
        sortKey: PUBLISHED_AT
        reverse: true
      ) {
        nodes {
          ...ArticleItem
        }
        pageInfo {
          hasPreviousPage
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
