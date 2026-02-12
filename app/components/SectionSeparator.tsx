import { cn } from '~/lib/utils';

export function SectionSeparator({ color = 'light' }: { color?: 'light' | 'dark' }) {
  return (
    <div className={cn('flex w-full p-5', color === 'dark' ? 'bg-dark' : 'bg-light')}>
      <div className={cn('h-[31px] w-full rounded', color === 'dark' ? 'bg-light' : 'bg-dark')} />
    </div>
  );
}

