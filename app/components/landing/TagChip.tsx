import { cn } from '~/lib/utils';



export function TagChip({ label, inventory }: { label: string; inventory?: number }) {
  const rawLabel = label.trim();
  const lowerLabel = rawLabel.toLowerCase();

  // Stock-related keywords to catch variations
  const isStock = lowerLabel.includes('stock') || lowerLabel.includes('inventario');
  const isOut = lowerLabel.includes('sin') || lowerLabel.includes('out');
  const isLow = lowerLabel.includes('poca') || lowerLabel.includes('low');

  let finalLabel = rawLabel.toUpperCase();
  let dotColor = '';

  if (isStock) {
    if (isOut) {
      finalLabel = 'SIN STOCK';
      dotColor = 'bg-red-500';
    } else if (isLow) {
      finalLabel = 'Poca disponibilidad';
      dotColor = 'bg-yellow-500';
    } else {
      finalLabel = 'STOCK';
      dotColor = 'bg-green-500';
    }
  }

  // Override with dynamic inventory if available
  if (typeof inventory === 'number' && isStock) {
    if (inventory === 0) {
      finalLabel = 'SIN STOCK';
      dotColor = 'bg-red-500';
    } else if (inventory < 10) {
      finalLabel = 'Poca disponibilidad';
      dotColor = 'bg-yellow-500';
    } else {
      finalLabel = 'STOCK';
      dotColor = 'bg-green-500';
    }
  }

  const finalCfg = { dot: dotColor, label: finalLabel };

  return (
    <div className="flex uppercase items-center gap-2 rounded-md border border-gray-400 bg-light px-3 py-0.5 text-sm font-extrabold text-dark">
      {finalCfg.dot && <span className={cn('h-1.5 w-1.5 rounded-full', finalCfg.dot)} />}
      {finalCfg.label}
    </div>
  );
}
