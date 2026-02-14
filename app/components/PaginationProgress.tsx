import { cn } from '~/lib/utils';

type PaginationProgressProps = {
  totalCount: number;
  currentCount: number;
  resourceName?: string;
  pageBy: number;
  isLoading?: boolean;
};

export function PaginationProgress({
  totalCount,
  currentCount,
  resourceName = 'productos',
  pageBy,
  isLoading,
}: PaginationProgressProps) {
  if (totalCount === 0) return null;

  const totalPages = Math.ceil(totalCount / pageBy);
  const currentPage = Math.ceil(currentCount / pageBy);
  const normalizedResource = resourceName.toLowerCase();

  return (
    <div className="flex flex-col items-center gap-6 py-12">
      {/* Boxed Page Numbers */}
      <div className="flex items-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <div
            key={page}
            className={cn(
              'w-10 h-10 flex items-center justify-center border border-dark rounded text-[13px] font-extrabold transition-all',
              page <= currentPage
                ? 'bg-dark text-white'
                : 'bg-white text-dark hover:border-primary hover:text-primary',
            )}
          >
            {page}
          </div>
        ))}
      </div>

      {/* Progress Text */}
      <div className="flex flex-col items-center leading-[0.85]">
        <h3 className="text-[64px] font-extrabold uppercase tracking-tighter text-dark">
          Has visto
        </h3>
        <div className="flex items-baseline gap-4 text-[64px] font-extrabold uppercase tracking-tighter">
          <span className="text-primary">{currentCount}</span>
          <span className="text-dark">de</span>
          <span className="text-primary">{totalCount}</span>
          <span className="text-dark ml-2">{normalizedResource}</span>
        </div>
      </div>
    </div>
  );
}
