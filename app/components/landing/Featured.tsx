import {ArrowRight} from 'lucide-react';
import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from '~/components/ui/carousel';
import {InfiniteText} from '~/components/landing/InfiniteText';

export type FeaturedArticle = {
  id: string;
  title: string;
  handle: string;
  blog: {handle: string};
  image?: {
    id?: string | null;
    altText?: string | null;
    url: string;
    width?: number | null;
    height?: number | null;
  } | null;
};

export function Featured({articles}: {articles: FeaturedArticle[]}) {
  return (
    <section className="flex w-full flex-col items-center justify-between gap-20 bg-light py-20 text-dark">
      <InfiniteText />

      <div className="w-full px-5">
        <Carousel opts={{align: 'start', loop: true}}>
          <CarouselContent>
            {articles.map((article) => (
              <CarouselItem key={article.id} className="basis-[85%] md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <FeaturedCard article={article} />
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="mt-4 flex justify-end gap-2">
            <CarouselPrevious />
            <CarouselNext />
          </div>
        </Carousel>
      </div>
    </section>
  );
}

function FeaturedCard({article}: {article: FeaturedArticle}) {
  return (
    <Link
      to={`/blogs/${article.blog.handle}/${article.handle}`}
      className="group flex flex-col font-extrabold text-dark"
      prefetch="intent"
    >
      <div className="flex items-end gap-2">
        <p className="text-2xl leading-[1] tracking-tight">{article.title}</p>
        <ArrowRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-2" />
      </div>

      <div className="relative mt-4 aspect-[6/5] w-full overflow-hidden rounded-lg border border-dark/10 bg-lightgray">
        {article.image ? (
          <Image
            data={article.image}
            alt={article.image.altText || article.title}
            sizes="(min-width: 1024px) 25vw, 80vw"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase text-tgray">
            Sin imagen
          </div>
        )}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <span className="rounded-full border border-dark/20 bg-light/80 px-3 py-1 text-xs font-extrabold uppercase">
            Blog
          </span>
        </div>
      </div>
    </Link>
  );
}
