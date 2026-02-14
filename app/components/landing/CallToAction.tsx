import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '~/components/ui/button';
import { cn, focusStyle } from '~/lib/utils';

export function CallToAction() {
  return (
    <section className="flex flex-col min-h-fit w-full bg-light text-dark items-center justify-between gap-20 py-20 px-5">
      <p className="w-full text-[40px] font-extrabold leading-[100%] tracking-tight uppercase">
        Juntos haremos
        <br />
        el modelo perfecto
        <br />
        para ti
      </p>

      <div className="flex flex-col w-full gap-10 border-b border-dark lg:flex-row items-stretch lg:items-end">
        <div className="flex w-full gap-4 pb-4">
          <p className="min-w-full lg:min-w-[500px] lg:w-1/2 text-[16px] font-normal normal-case leading-[120%]">
            En Translate3D nos apasiona la tecnolog&iacute;a y la impresi&oacute;n
            3D. Sabemos perfectamente lo importante que es contar con el equipo
            y material indicado para poder llevar tus ideas y proyectos a la
            realidad.
          </p>
        </div>

        <Link
          to="/servicios"
          prefetch="intent"
          className={cn(
            "group/cta flex w-full flex-col gap-4 pb-4 border-dark lg:border-l lg:pl-4 lg:flex-row px-2 md:px-0",
            focusStyle({ theme: 'action', focusType: 'inner' })
          )}
        >
          <img
            src="/team.webp"
            alt="Translate3D"
            className="w-full lg:w-[450px] aspect-[2/1] object-cover shrink-0"
            loading="lazy"
          />
          <div className="flex flex-col justify-between gap-2.5">
            <p className="text-lg font-extrabold leading-[100%] tracking-tight uppercase">
              Cu&eacute;ntanos tus ideas y nosotros te ayudaremos a materializarlas.
            </p>
            <Button variant="action" className="w-fit">
              Cotizaci&oacute;n <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Link>
      </div>
    </section>
  );
}
