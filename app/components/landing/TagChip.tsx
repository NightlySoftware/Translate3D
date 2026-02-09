import {cn} from '~/lib/utils';

const TAG_CONFIG: Record<string, {dot: string}> = {
  'Con inventario': {dot: 'bg-green-500'},
  'Poca disponibilidad': {dot: 'bg-yellow-500'},
  'Sin inventario': {dot: 'bg-red-500'},
};

export function TagChip({label}: {label: string}) {
  const cfg = TAG_CONFIG[label];

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-dark/20 bg-light px-3 py-1 text-xs font-extrabold uppercase tracking-tight text-dark">
      {cfg ? (
        <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      ) : null}
      {label}
    </span>
  );
}

