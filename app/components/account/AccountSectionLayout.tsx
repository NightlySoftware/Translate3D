import {cn} from '~/lib/utils';
import type {ReactNode} from 'react';

export function AccountSectionLayout({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-2xl border border-dark/10 bg-white p-4 md:p-6', className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-dark/10 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-dark">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-dark/70">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </header>
      <div className="pt-4">{children}</div>
    </section>
  );
}
