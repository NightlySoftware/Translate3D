import {Link, useFetcher, type Fetcher} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import React, {useRef, useEffect} from 'react';
import {
  getEmptyPredictiveSearchResult,
  urlWithTrackingParams,
  type PredictiveSearchReturn,
} from '~/lib/search';
import {useAside} from './Aside';

type PredictiveSearchItems = PredictiveSearchReturn['result']['items'];

type UsePredictiveSearchReturn = {
  term: React.MutableRefObject<string>;
  total: number;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  items: PredictiveSearchItems;
  fetcher: Fetcher<PredictiveSearchReturn>;
};

type SearchResultsPredictiveArgs = Pick<
  UsePredictiveSearchReturn,
  'term' | 'total' | 'inputRef' | 'items'
> & {
  state: Fetcher['state'];
  closeSearch: () => void;
};

type PartialPredictiveSearchResult<
  ItemType extends keyof PredictiveSearchItems,
  ExtraProps extends keyof SearchResultsPredictiveArgs = 'term' | 'closeSearch',
> = Pick<PredictiveSearchItems, ItemType> &
  Pick<SearchResultsPredictiveArgs, ExtraProps>;

type SearchResultsPredictiveProps = {
  children: (args: SearchResultsPredictiveArgs) => React.ReactNode;
};

/**
 * Component that renders predictive search results
 */
export function SearchResultsPredictive({
  children,
}: SearchResultsPredictiveProps) {
  const aside = useAside();
  const {term, inputRef, fetcher, total, items} = usePredictiveSearch();

  /*
   * Utility that resets the search input
   */
  function resetInput() {
    if (inputRef.current) {
      inputRef.current.blur();
      inputRef.current.value = '';
    }
  }

  /**
   * Utility that resets the search input and closes the search aside
   */
  function closeSearch() {
    resetInput();
    aside.close();
  }

  return children({
    items,
    closeSearch,
    inputRef,
    state: fetcher.state,
    term,
    total,
  });
}

SearchResultsPredictive.Articles = SearchResultsPredictiveArticles;
SearchResultsPredictive.Collections = SearchResultsPredictiveCollections;
SearchResultsPredictive.Pages = SearchResultsPredictivePages;
SearchResultsPredictive.Products = SearchResultsPredictiveProducts;
SearchResultsPredictive.Queries = SearchResultsPredictiveQueries;
SearchResultsPredictive.Empty = SearchResultsPredictiveEmpty;

function SearchResultsPredictiveArticles({
  term,
  articles,
  closeSearch,
}: PartialPredictiveSearchResult<'articles'>) {
  if (!articles.length) return null;

  return (
    <div className="mt-6" key="articles">
      <h5 className="text-xs font-extrabold uppercase tracking-tight text-tgray">
        Art&iacute;culos
      </h5>
      <ul className="mt-2 flex flex-col gap-2">
        {articles.map((article) => {
          const articleUrl = urlWithTrackingParams({
            baseUrl: `/blogs/${article.blog.handle}/${article.handle}`,
            trackingParams: article.trackingParameters,
            term: term.current ?? '',
          });

          return (
            <li key={article.id}>
              <Link
                onClick={closeSearch}
                to={articleUrl}
                className="group flex items-center gap-3 rounded-lg border border-dark/10 bg-light p-3 hover:bg-dark hover:text-light"
              >
                {article.image?.url ? (
                  <Image
                    alt={article.image.altText ?? article.title}
                    src={article.image.url}
                    width={50}
                    height={50}
                    className="rounded-md border border-dark/10"
                  />
                ) : null}
                <div className="flex flex-col">
                  <span className="text-sm font-extrabold uppercase tracking-tight">
                    {article.title}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SearchResultsPredictiveCollections({
  term,
  collections,
  closeSearch,
}: PartialPredictiveSearchResult<'collections'>) {
  if (!collections.length) return null;

  return (
    <div className="mt-6" key="collections">
      <h5 className="text-xs font-extrabold uppercase tracking-tight text-tgray">
        Colecciones
      </h5>
      <ul className="mt-2 flex flex-col gap-2">
        {collections.map((collection) => {
          const collectionUrl = urlWithTrackingParams({
            baseUrl: `/collections/${collection.handle}`,
            trackingParams: collection.trackingParameters,
            term: term.current,
          });

          return (
            <li key={collection.id}>
              <Link
                onClick={closeSearch}
                to={collectionUrl}
                className="group flex items-center gap-3 rounded-lg border border-dark/10 bg-light p-3 hover:bg-dark hover:text-light"
              >
                {collection.image?.url ? (
                  <Image
                    alt={collection.image.altText ?? collection.title}
                    src={collection.image.url}
                    width={50}
                    height={50}
                    className="rounded-md border border-dark/10"
                  />
                ) : null}
                <div className="flex flex-col">
                  <span className="text-sm font-extrabold uppercase tracking-tight">
                    {collection.title}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SearchResultsPredictivePages({
  term,
  pages,
  closeSearch,
}: PartialPredictiveSearchResult<'pages'>) {
  if (!pages.length) return null;

  return (
    <div className="mt-6" key="pages">
      <h5 className="text-xs font-extrabold uppercase tracking-tight text-tgray">
        P&aacute;ginas
      </h5>
      <ul className="mt-2 flex flex-col gap-2">
        {pages.map((page) => {
          const pageUrl = urlWithTrackingParams({
            baseUrl: `/pages/${page.handle}`,
            trackingParams: page.trackingParameters,
            term: term.current,
          });

          return (
            <li key={page.id}>
              <Link
                onClick={closeSearch}
                to={pageUrl}
                className="group flex items-center gap-3 rounded-lg border border-dark/10 bg-light p-3 hover:bg-dark hover:text-light"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-extrabold uppercase tracking-tight">
                    {page.title}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SearchResultsPredictiveProducts({
  term,
  products,
  closeSearch,
}: PartialPredictiveSearchResult<'products'>) {
  if (!products.length) return null;

  return (
    <div className="mt-6" key="products">
      <h5 className="text-xs font-extrabold uppercase tracking-tight text-tgray">
        Productos
      </h5>
      <ul className="mt-2 flex flex-col gap-2">
        {products.map((product) => {
          const productUrl = urlWithTrackingParams({
            baseUrl: `/products/${product.handle}`,
            trackingParams: product.trackingParameters,
            term: term.current,
          });

          const price = product?.selectedOrFirstAvailableVariant?.price;
          const image = product?.selectedOrFirstAvailableVariant?.image;
          return (
            <li key={product.id}>
              <Link
                to={productUrl}
                onClick={closeSearch}
                className="group flex items-center gap-3 rounded-lg border border-dark/10 bg-light p-3 hover:bg-dark hover:text-light"
              >
                {image ? (
                  <Image
                    alt={image.altText ?? product.title}
                    src={image.url}
                    width={50}
                    height={50}
                    className="rounded-md border border-dark/10"
                  />
                ) : null}
                <div className="flex flex-1 flex-col">
                  <p className="text-sm font-extrabold uppercase tracking-tight">
                    {product.title}
                  </p>
                  <small className="text-xs font-semibold uppercase tracking-tight text-tgray group-hover:text-light/70">
                    {price ? <Money data={price} /> : null}
                  </small>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SearchResultsPredictiveQueries({
  queries,
  queriesDatalistId,
}: PartialPredictiveSearchResult<'queries', never> & {
  queriesDatalistId: string;
}) {
  if (!queries.length) return null;

  return (
    <datalist id={queriesDatalistId}>
      {queries.map((suggestion) => {
        if (!suggestion) return null;

        return <option key={suggestion.text} value={suggestion.text} />;
      })}
    </datalist>
  );
}

function SearchResultsPredictiveEmpty({
  term,
}: {
  term: React.MutableRefObject<string>;
}) {
  if (!term.current) {
    return null;
  }

  return (
    <p className="mt-6 text-sm font-semibold uppercase tracking-tight text-tgray">
      Sin resultados para <q>{term.current}</q>
    </p>
  );
}

/**
 * Hook that returns the predictive search results and fetcher and input ref.
 * @example
 * '''ts
 * const { items, total, inputRef, term, fetcher } = usePredictiveSearch();
 * '''
 **/
function usePredictiveSearch(): UsePredictiveSearchReturn {
  const fetcher = useFetcher<PredictiveSearchReturn>({key: 'search'});
  const term = useRef<string>('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  if (fetcher?.state === 'loading') {
    term.current = String(fetcher.formData?.get('q') || '');
  }

  // capture the search input element as a ref
  useEffect(() => {
    if (!inputRef.current) {
      inputRef.current = document.querySelector('input[type="search"]');
    }
  }, []);

  const {items, total} =
    fetcher?.data?.result ?? getEmptyPredictiveSearchResult();

  return {items, total, inputRef, term, fetcher};
}
