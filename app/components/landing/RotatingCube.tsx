import {lazy, Suspense} from 'react';
import {ClientOnly} from '~/components/ClientOnly';

const RotatingCubeClient = lazy(() => import('./RotatingCube.client'));

export function RotatingCube() {
  return (
    <section className="cross-dot-pattern relative flex w-full flex-col items-center justify-center bg-light py-20 text-dark">
      <div className="relative h-[80vh] w-full px-5">
        <ClientOnly
          fallback={
            <div className="flex h-full w-full items-center justify-center rounded-lg border border-dark/10 bg-lightgray">
              <p className="text-sm font-semibold uppercase text-tgray">
                Cargando 3D…
              </p>
            </div>
          }
        >
          {() => (
            <Suspense
              fallback={
                <div className="flex h-full w-full items-center justify-center rounded-lg border border-dark/10 bg-lightgray">
                  <p className="text-sm font-semibold uppercase text-tgray">
                    Cargando 3D…
                  </p>
                </div>
              }
            >
              <RotatingCubeClient />
            </Suspense>
          )}
        </ClientOnly>
      </div>
    </section>
  );
}

