import { Link } from 'react-router';
import { Image } from '@shopify/hydrogen';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

export type BlogPostListItemArticle = {
  id: string;
  handle: string;
  title: string;
  excerpt?: string | null;
  contentHtml?: string | null;
  tags?: string[] | null;
  image?: {
    id?: string | null;
    altText?: string | null;
    url: string;
    width?: number | null;
    height?: number | null;
  } | null;
};

export function BlogPostListItem({
  article,
  loading,
  className,
}: {
  article: BlogPostListItemArticle;
  loading?: HTMLImageElement['loading'];
  className?: string;
}) {
  const excerptText =
    article.excerpt ||
    (article.contentHtml
      ? `${article.contentHtml.replace(/<[^>]*>?/gm, '').slice(0, 170)}...`
      : 'Explora este articulo para conocer consejos, experiencias y mejores practicas de impresion 3D.');

  const tags = (article.tags ?? []).length > 0 ? (article.tags ?? []) : ['Blog'];

  return (
    <article
      className={cn(
        'self-stretch border-t border-[#8F8F8F] bg-white pb-10 pt-5',
        className,
      )}
    >
      <Link
        to={`/blog/${article.handle}`}
        prefetch="intent"
        className="group block w-full"
      >
        <span className="sr-only">Leer articulo {article.title}</span>
        <div className="flex flex-col items-start gap-5 xl:flex-row">
          <div className="w-full shrink-0 overflow-hidden rounded-sm border border-dark/10 bg-lightgray xl:w-[600px]">
            {article.image ? (
              <Image
                alt={article.image.altText || article.title}
                aspectRatio="600/338"
                data={article.image}
                loading={loading}
                sizes="(min-width: 1280px) 600px, 100vw"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex aspect-[600/338] w-full items-center justify-center bg-dark/5 text-xs font-bold uppercase tracking-wide text-dark/40">
                Sin imagen
              </div>
            )}
          </div>

          <div className="flex w-full flex-col justify-between gap-6 xl:min-h-[338px] xl:w-[600px] xl:px-5">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-start gap-1.5">
                {tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex h-7 items-center rounded-full border border-[#CACACA] px-3 font-manrope text-xs font-semibold uppercase text-dark"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <h3 className="font-manrope text-[32px] font-extrabold uppercase leading-tight tracking-tight text-[#0B0604] transition-colors group-hover:text-primary">
                {article.title}
              </h3>

              <p className="font-manrope text-base font-normal normal-case leading-6 text-dark/90">
                {excerptText}
              </p>
            </div>

            <Button asChild variant="secondary" className="w-fit px-5 py-3">
              <span>Leer articulo</span>
            </Button>
          </div>
        </div>
      </Link>
    </article>
  );
}
