import {ArrowRight} from 'lucide-react';
import {Link} from 'react-router';
import {Button} from '~/components/ui/button';

export function CallToAction() {
  return (
    <section className="flex w-full flex-col items-center justify-between gap-12 bg-light px-5 py-20 text-dark">
      <p className="w-full text-[clamp(2rem,4vw,2.5rem)] font-extrabold leading-[0.95] tracking-tight">
        Juntos haremos
        <br />
        el modelo perfecto
        <br />
        para ti
      </p>

      <div className="flex w-full flex-col items-stretch justify-center gap-10 border-b border-dark pb-10 lg:flex-row lg:items-end">
        <div className="flex w-full gap-4">
          <p className="max-w-[520px] text-base font-normal normal-case leading-[1.2] text-dark/80">
            En Translate3D nos apasiona la tecnolog&iacute;a y la impresi&oacute;n
            3D. Sabemos perfectamente lo importante que es contar con el equipo
            y material indicado para poder llevar tus ideas y proyectos a la
            realidad.
          </p>
        </div>

        <Link
          to="/cotizacion"
          prefetch="intent"
          className="group/cta flex w-full items-start gap-4 border-dark lg:border-l lg:pl-4"
        >
          <img
            src="/team.webp"
            alt="Translate3D"
            className="w-[320px] shrink-0 rounded-lg object-cover lg:w-[450px]"
            loading="lazy"
          />
          <div className="flex flex-col justify-between gap-4">
            <p className="text-lg font-extrabold leading-[1.05] tracking-tight">
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

