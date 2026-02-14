import { Link } from 'react-router';
import { Image, Money } from '@shopify/hydrogen';
import { urlWithTrackingParams, type RegularSearchReturn } from '~/lib/search';
import type {ReactNode} from 'react';

type SearchItems = {
  products?: {nodes: Array<any>};
  pages?: {nodes: Array<any>};
  articles?: {nodes: Array<any>};
};
type PartialSearchResult<ItemType extends keyof SearchItems> = Pick<
  SearchItems,
  ItemType
> &
  Pick<RegularSearchReturn, 'term'>;

type SearchResultsProps = RegularSearchReturn & {
  children: (args: SearchItems & { term: string }) => ReactNode;
};

export function SearchResults({
  term,
  result,
  children,
}: Omit<SearchResultsProps, 'error' | 'type'>) {
  if (!result?.total) {
    return null;
  }

  return children({
    articles: result.items.articles,
    pages: result.items.pages,
    products: result.items.products,
    term,
  });
}

SearchResults.Articles = SearchResultsArticles;
SearchResults.Pages = SearchResultsPages;
SearchResults.Products = SearchResultsProducts;
SearchResults.Empty = SearchResultsEmpty;

function SearchResultsArticles({
  term,
  articles,
}: PartialSearchResult<'articles'>) {
  if (!articles?.nodes.length) {
    return null;
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-extrabold uppercase tracking-tight">
        Art\u00edculos
      </h2>
      <div className="mt-4 flex flex-col gap-2">
        {articles?.nodes?.map((article: any) => {
          const articleUrl = urlWithTrackingParams({
            baseUrl: `/blog/${article.handle}`,
            trackingParams: article.trackingParameters,
            term,
          });

          return (
            <div key={article.id}>
              <Link prefetch="intent" to={articleUrl}>
                <span className="link-dark text-sm font-extrabold uppercase tracking-tight text-dark hover:text-primary">
                  {article.title}
                </span>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SearchResultsPages({ term, pages }: PartialSearchResult<'pages'>) {
  if (!pages?.nodes.length) {
    return null;
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-extrabold uppercase tracking-tight">
        P\u00e1ginas
      </h2>
      <div className="mt-4 flex flex-col gap-2">
        {pages?.nodes?.map((page: any) => {
          const pageUrl = urlWithTrackingParams({
            baseUrl: `/pages/${page.handle}`,
            trackingParams: page.trackingParameters,
            term,
          });

          return (
            <div key={page.id}>
              <Link prefetch="intent" to={pageUrl}>
                <span className="link-dark text-sm font-extrabold uppercase tracking-tight text-dark hover:text-primary">
                  {page.title}
                </span>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SearchResultsProducts({
  term,
  products,
}: PartialSearchResult<'products'>) {
  if (!products?.nodes.length) {
    return null;
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-extrabold uppercase tracking-tight">
        Productos
      </h2>
      <div className="mt-4 flex flex-col gap-2">
        {products.nodes.map((product: any) => {
          const productUrl = urlWithTrackingParams({
            baseUrl: `/tienda/p/${product.handle}`,
            trackingParams: product.trackingParameters,
            term,
          });

          const price = product?.selectedOrFirstAvailableVariant?.price;
          const image = product?.selectedOrFirstAvailableVariant?.image;

          return (
            <div key={product.id}>
              <Link prefetch="intent" to={productUrl}>
                <div className="flex items-center gap-3 rounded-lg border border-dark/10 bg-light p-3 hover:bg-dark hover:text-light">
                  {image ? (
                    <Image
                      data={image}
                      alt={product.title}
                      width={50}
                      height={50}
                      className="rounded-md border border-dark/10"
                    />
                  ) : null}
                  <div className="flex flex-col">
                    <p className="text-sm font-extrabold uppercase tracking-tight">
                      {product.title}
                    </p>
                    <small className="text-xs font-semibold uppercase tracking-tight text-tgray">
                      {price ? <Money data={price} /> : null}
                    </small>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SearchResultsEmpty() {
  return (
    <p className="mt-10 text-sm font-semibold uppercase tracking-tight text-tgray">
      Sin resultados. Prueba otra b\u00fasqueda.
    </p>
  );
}
