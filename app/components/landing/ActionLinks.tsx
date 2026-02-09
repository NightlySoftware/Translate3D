import {ArrowRight} from 'lucide-react';
import {Link} from 'react-router';
import {Button} from '~/components/ui/button';
import {cn} from '~/lib/utils';

const links = [
  {to: '/servicios', label: 'Servicios'},
  {to: '/blogs/blog', label: 'Blog'},
  {to: '/collections/impresiones', label: 'Nuestras impresiones'},
  {to: '/collections/refacciones', label: 'Refacciones'},
  {to: '/collections/resinas', label: 'Resinas'},
  {to: '/collections/filamentos', label: 'Filamentos'},
];

export function ActionLinks() {
  return (
    <section className="flex w-full flex-col items-center justify-between gap-20 bg-light py-20 text-dark">
      <div className="flex w-full flex-col gap-20 px-5">
        <p className="text-center text-[clamp(3rem,7vw,6rem)] font-extrabold leading-[0.95] tracking-tight">
          Dise&ntilde;ando el futuro,
          <br />
          una impresi&oacute;n a la vez
        </p>

        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-center">
          <div className="flex flex-col justify-between gap-4">
            <p className="max-w-[520px] text-base font-normal normal-case leading-[1.2] text-dark/80">
              En Translate3D, la calidad es nuestra m&aacute;xima prioridad. Nos
              esforzamos por garantizar que cada producto y servicio cumpla con
              los m&aacute;s altos est&aacute;ndares.
            </p>
            <Button asChild variant="action" className="w-fit">
              <Link to="/cotizacion" prefetch="intent">
                Cotiza tus ideas <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="flex w-full max-w-[720px] flex-col font-extrabold">
            {links.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                prefetch="intent"
                className={cn(
                  'group/link relative flex w-full items-center gap-6 border-t border-dark px-5 py-3 text-dark transition-colors duration-300 hover:text-light',
                )}
              >
                <span className="relative z-[1] flex items-center gap-6">
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                  <span className="text-base font-normal normal-case leading-[1.2]">
                    {l.label}
                  </span>
                </span>
                <span className="absolute inset-0 z-0 origin-bottom scale-y-0 bg-dark transition-transform duration-300 ease-out group-hover/link:scale-y-100" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
