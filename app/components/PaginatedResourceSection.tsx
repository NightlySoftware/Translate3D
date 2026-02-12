import * as React from 'react';
import { Pagination } from '@shopify/hydrogen';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router';
import { PaginationProgress } from './PaginationProgress';

/**
 * <PaginatedResourceSection > is a component that encapsulate how the previous and next behaviors throughout your application.
 */
export function PaginatedResourceSection<NodesType>({
  connection,
  children,
  resourcesClassName,
  resourceName,
  total,
}: {
  connection: React.ComponentProps<typeof Pagination<NodesType>>['connection'];
  children: React.FunctionComponent<{ node: NodesType; index: number }>;
  resourcesClassName?: string;
  resourceName?: string;
  total?: number;
}) {
  const { ref, inView } = useInView();
  const navigate = useNavigate();

  return (
    <Pagination connection={connection}>
      {({ nodes, isLoading, PreviousLink, NextLink, hasNextPage, nextPageUrl, state }) => {
        const resourcesMarkup = nodes.map((node, index) =>
          children({ node, index }),
        );

        // Auto-load logic
        // eslint-disable-next-line react-hooks/rules-of-hooks
        React.useEffect(() => {
          if (inView && hasNextPage && !isLoading) {
            void navigate(nextPageUrl, {
              replace: true,
              preventScrollReset: true,
              state,
            });
          }
        }, [inView, hasNextPage, isLoading, nextPageUrl, state, navigate]);

        return (
          <div>
            <PreviousLink className="flex justify-center py-8">
              {isLoading ? (
                <span className="text-sm font-extrabold uppercase tracking-tight text-dark/30 animate-pulse">Cargando...</span>
              ) : (
                <span className="text-sm font-extrabold uppercase tracking-tight text-primary hover:text-dark transition-colors">
                  ↑ Cargar anteriores
                </span>
              )}
            </PreviousLink>

            {resourcesClassName ? (
              <div className={resourcesClassName}>{resourcesMarkup}</div>
            ) : (
              resourcesMarkup
            )}

            <PaginationProgress
              totalCount={total || 0}
              currentCount={nodes.length}
              resourceName={resourceName}
              pageBy={12}
              isLoading={isLoading}
            />

            <NextLink ref={ref} className="flex justify-center py-12">
              {isLoading ? (
                <span className="text-sm font-extrabold uppercase tracking-tight text-dark/30 animate-pulse">Cargando m&aacute;s...</span>
              ) : (
                <span className="text-sm font-extrabold uppercase tracking-tight text-primary hover:text-dark transition-colors">
                  {hasNextPage ? 'Cargar m\u00e1s ↓' : 'Fin del cat\u00e1logo'}
                </span>
              )}
            </NextLink>
          </div>
        );
      }}
    </Pagination>
  );
}
