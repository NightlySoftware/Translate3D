import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { cn, focusStyle } from '~/lib/utils';

type AsideType = 'search' | 'cart' | 'mobile' | 'closed';
type AsideContextValue = {
  type: AsideType;
  open: (mode: AsideType) => void;
  close: () => void;
};

/**
 * A side bar component with Overlay
 * @example
 * ```jsx
 * <Aside type="search" heading="SEARCH">
 *  <input type="search" />
 *  ...
 * </Aside>
 * ```
 */
export function Aside({
  children,
  heading,
  type,
}: {
  children?: React.ReactNode;
  type: AsideType;
  heading: React.ReactNode;
}) {
  const { type: activeType, close } = useAside();
  const expanded = type === activeType;

  useEffect(() => {
    const abortController = new AbortController();

    if (expanded) {
      // Lock scrolling while an aside is open.
      const prev = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';

      document.addEventListener(
        'keydown',
        function handler(event: KeyboardEvent) {
          if (event.key === 'Escape') {
            close();
          }
        },
        { signal: abortController.signal },
      );

      return () => {
        document.documentElement.style.overflow = prev;
        abortController.abort();
      };
    }

    return () => abortController.abort();
  }, [close, expanded]);

  return (
    <div
      aria-modal
      role="dialog"
      className={cn(
        'fixed inset-0 z-50 transition-opacity duration-200',
        expanded ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <button
        className="absolute inset-0 cursor-default bg-black/25"
        onClick={close}
        aria-label="Cerrar"
      />
      <aside
        className={cn(
          'absolute right-0 top-0 h-full w-[min(420px,100vw)] border-l border-dark/10 bg-light text-dark shadow-2xl transition-transform duration-200',
          expanded ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {type !== 'cart' && (
          <header className="flex h-16 items-center justify-between border-b border-dark/10 px-5">
            <h3 className="text-sm font-extrabold uppercase tracking-tight">
              {heading}
            </h3>
            <button
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-lg border border-dark/10 bg-light text-xl font-bold hover:bg-dark hover:text-light transition-colors",
                focusStyle({ theme: 'action' })
              )}
              onClick={close}
              aria-label="Cerrar"
            >
              &times;
            </button>
          </header>
        )}
        <main className={cn("overflow-auto", type === 'cart' ? "h-full p-8" : "h-[calc(100%-4rem)] p-5")}>
          {children}
        </main>
      </aside>
    </div>
  );
}

const AsideContext = createContext<AsideContextValue | null>(null);

Aside.Provider = function AsideProvider({ children }: { children: ReactNode }) {
  const [type, setType] = useState<AsideType>('closed');

  return (
    <AsideContext.Provider
      value={{
        type,
        open: setType,
        close: () => setType('closed'),
      }}
    >
      {children}
    </AsideContext.Provider>
  );
};

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) {
    throw new Error('useAside must be used within an AsideProvider');
  }
  return aside;
}
