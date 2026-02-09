import {ArrowRight} from 'lucide-react';
import {Link} from 'react-router';
import {cn} from '~/lib/utils';

export type StoreCategory = {
  title: string;
  to: string;
  imageSrc: string;
  rounded?: 'left' | 'right' | 'none';
};

export function StoreCategories({categories}: {categories: StoreCategory[]}) {
  return (
    <section className="flex w-full flex-col items-center justify-between gap-10 bg-light py-20 text-dark">
      <div className="flex w-full flex-col px-5">
        <h2 className="text-[clamp(2.25rem,5vw,4rem)] font-extrabold uppercase leading-[0.95] tracking-tight">
          Visita nuestra tienda
        </h2>

        <div className="group/categories mt-8 flex flex-col gap-4 text-2xl font-extrabold md:flex-row">
          {categories.map((category) => (
            <CategoryCard key={category.to} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryCard({category}: {category: StoreCategory}) {
  return (
    <Link
      to={category.to}
      prefetch="intent"
      className="group/tile relative flex flex-[1] cursor-pointer flex-col gap-3 overflow-hidden transition-[flex] duration-200 hover:flex-[2]"
    >
      <div
        className={cn('relative h-[360px] overflow-hidden', {
          'rounded-l-lg md:rounded-l-lg md:rounded-r-none': category.rounded === 'left',
          'rounded-r-lg md:rounded-r-lg md:rounded-l-none': category.rounded === 'right',
          'rounded-lg': category.rounded === 'none',
        })}
      >
        <img
          src={category.imageSrc}
          alt={category.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover/tile:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 transition-opacity duration-300 group-hover/categories:bg-black/40 group-hover/tile:bg-black/0" />
      </div>

      <div className="flex items-center gap-2.5">
        <p className="uppercase tracking-tight">{category.title}</p>
        <ArrowRight className="h-6 w-6 transition-transform duration-300 group-hover/tile:translate-x-2" />
      </div>
    </Link>
  );
}

