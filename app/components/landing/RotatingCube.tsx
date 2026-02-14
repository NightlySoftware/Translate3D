import { lazy, Suspense, Component } from 'react';
import type { ReactNode } from 'react';
import { ClientOnly } from '~/components/ClientOnly';

const RotatingCubeClient = lazy(() => import('./RotatingCube.client'));

class CubeErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export function RotatingCube() {
  return (
    <section className="cross-dot-pattern relative flex w-full flex-col items-center justify-center bg-light py-20 text-dark">
      <div className="relative h-[80vh] w-full px-5">
        {/* 3D canvas — hidden if it fails to load */}
        <ClientOnly fallback={null}>
          {() => (
            <CubeErrorBoundary>
              <Suspense fallback={null}>
                <RotatingCubeClient />
              </Suspense>
            </CubeErrorBoundary>
          )}
        </ClientOnly>

        {/* Text — always visible regardless of 3D state */}
        <p className="pointer-events-none uppercase absolute left-5 lg:left-10 top-10 lg:top-20 text-[56px] lg:text-[96px] font-extrabold leading-[0.95] tracking-tight drop-shadow-[0_0_2px_#fff] drop-shadow-[0_0_8px_#fff] lg:drop-shadow-none">
          Tus
          <br />
          <span className="pl-5 lg:pl-10">ideas</span>
          <img
            src="/red_dash.png"
            alt=""
            className="pointer-events-none absolute -bottom-6 right-0 w-32 lg:w-64 select-none"
            style={{ mixBlendMode: 'multiply' }}
            loading="lazy"
          />
        </p>

        <p className="pointer-events-none uppercase absolute bottom-10 lg:bottom-20 right-5 lg:right-10 text-[56px] lg:text-[96px] font-extrabold leading-[0.95] tracking-tight drop-shadow-[0_0_2px_#fff] drop-shadow-[0_0_8px_#fff] lg:drop-shadow-none">
          en tus
          <br />
          manos
        </p>
      </div>
    </section>
  );
}
