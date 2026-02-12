import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { cn, focusStyle } from '~/lib/utils';

export type StoreCategory = {
  title: string;
  to: string;
  imageSrc: string;
  rounded?: 'left' | 'right' | 'none';
};

export function StoreCategories({ categories }: { categories: StoreCategory[] }) {
  const [hoveredTitle, setHoveredTitle] = useState<string | null>(null);

  return (
    <section className="flex w-full flex-col items-center justify-between gap-20 bg-light py-20 text-dark">
      <div className="flex w-full flex-col px-5">
        <h2 className="text-[64px] font-extrabold uppercase leading-[100%] tracking-tight">
          Visita nuestra tienda
        </h2>

        <div className="mt-8 flex flex-col gap-0 text-2xl font-extrabold md:flex-row min-h-[500px]">
          {categories.map((category) => (
            <CategoryCard
              key={category.to}
              category={category}
              isHovered={hoveredTitle === category.title}
              isDimmed={hoveredTitle !== null && hoveredTitle !== category.title}
              onHover={() => setHoveredTitle(category.title)}
              onLeave={() => setHoveredTitle(null)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryCard({
  category,
  isHovered,
  isDimmed,
  onHover,
  onLeave
}: {
  category: StoreCategory;
  isHovered: boolean;
  isDimmed: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  return (
    <motion.div
      className="relative flex cursor-pointer flex-col gap-2.5 overflow-hidden outline-none min-w-0"
      initial={{ flex: 1 }}
      animate={{ flex: isHovered ? 2 : 1 }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Link
        to={category.to}
        prefetch="intent"
        className={cn(
          "flex h-full w-full flex-col gap-2.5",
          focusStyle({ theme: 'dark', focusType: 'inner' })
        )}
      >
        <div
          className={cn('relative flex-1 overflow-hidden transition-[border-radius] duration-200', {
            'rounded-l-lg': category.rounded === 'left',
            'rounded-r-lg': category.rounded === 'right',
          })}
        >
          <img
            src={category.imageSrc}
            alt={category.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover/tile:scale-105"
            loading="lazy"
          />
          <div className={cn(
            "absolute inset-0 bg-black transition-opacity duration-300 pointer-events-none",
            isDimmed ? "opacity-40" : "opacity-0"
          )} />
        </div>

        <div className="flex items-center gap-2.5">
          <p className="tracking-tight uppercase text-xl lg:text-3xl">{category.title}</p>
          <ArrowRight className="h-6 w-6 transition-transform duration-200 group-hover/tile:translate-x-2" />
        </div>
      </Link>
    </motion.div>
  );
}
