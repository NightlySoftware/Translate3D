import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { Image } from '@shopify/hydrogen';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '~/components/ui/carousel';
import { InfiniteText } from '~/components/landing/InfiniteText';
import { TagChip } from '~/components/landing/TagChip';
import { cn, focusStyle } from '~/lib/utils';

export type FeaturedArticle = {
  id: string;
  title: string;
  handle: string;
  blog: { handle: string };
  image?: {
    id?: string | null;
    altText?: string | null;
    url: string;
    width?: number | null;
    height?: number | null;
  } | null;
};

export function Featured({ articles }: { articles: FeaturedArticle[] }) {
  return (
    <section className="flex w-full flex-col items-center justify-between gap-20 bg-light py-20 text-dark">
      <InfiniteText />

      <div className="w-full px-5">
        <Carousel opts={{ align: 'start', loop: true }}>
          <CarouselContent>
            {articles.map((article) => (
              <CarouselItem key={article.id} className="basis-[85%] md:basis-[60%] lg:basis-[40%]">
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

function FeaturedCard({ article }: { article: FeaturedArticle }) {
  return (
    <Link
      to={`/blog/${article.handle}`}
      className={cn(
        "group flex flex-col font-extrabold text-dark rounded-lg",
        focusStyle({ theme: 'dark' })
      )}
      prefetch="intent"
    >
      <div className="flex items-start gap-2">
        <p className="text-2xl h-[2.1em] leading-[1] tracking-tight line-clamp-2 uppercase">
          {article.title}
        </p>
        <ArrowRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-2" />
      </div>

      <div className="relative mt-4 aspect-[634/500] w-full overflow-hidden rounded-lg">
        {article.image ? (
          <Image
            data={article.image}
            alt={article.image.altText || article.title}
            sizes="(min-width: 1024px) 25vw, 80vw"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase text-tgray bg-lightgray">
            Sin imagen
          </div>
        )}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-5 left-[18px] right-[18px] flex justify-start items-center gap-2.5">
          <TagChip label="Blog" />
        </div>
      </div>
    </Link>
  );
}
