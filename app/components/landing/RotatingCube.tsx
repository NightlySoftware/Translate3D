import { lazy, Suspense, Component } from 'react';
import type { ReactNode } from 'react';
import { ClientOnly } from '~/components/ClientOnly';

const RotatingCubeClient = lazy(() => import('./RotatingCube.client'));

class CubeErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export function RotatingCube() {
  const fallback = (
    <div className="flex h-full w-full items-center justify-center rounded-lg border border-dark/10 bg-lightgray">
      <p className="text-sm font-semibold uppercase text-tgray">
        Cargando 3D…
      </p>
    </div>
  );

  return (
    <section className="cross-dot-pattern relative flex w-full flex-col items-center justify-center bg-light py-20 text-dark">
      <div className="relative h-[80vh] w-full px-5">
        <ClientOnly fallback={fallback}>
          {() => (
            <CubeErrorBoundary fallback={fallback}>
              <Suspense fallback={fallback}>
                <RotatingCubeClient />
              </Suspense>
            </CubeErrorBoundary>
          )}
        </ClientOnly>
      </div>
    </section>
  );
}
