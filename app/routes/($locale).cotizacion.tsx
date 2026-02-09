import type {Route} from './+types/($locale).cotizacion';
import {Button} from '~/components/ui/button';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Translate3D | Cotizaci\u00f3n'}];
};

export default function CotizacionRoute() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-16">
      <h1 className="text-[clamp(2.25rem,5vw,4rem)] font-extrabold uppercase leading-[0.95] tracking-tight">
        Cotizaci&oacute;n
      </h1>
      <p className="mt-6 max-w-2xl text-base font-normal normal-case leading-[1.2] text-dark/80">
        Placeholder. Aqu&iacute; conectaremos un flujo real para cotizar impresiones 3D (archivo STL/OBJ, material,
        color, resoluci&oacute;n, etc.).
      </p>

      <div className="mt-10 rounded-2xl border border-dark/10 bg-light p-6">
        <p className="text-sm font-extrabold uppercase tracking-tight text-tgray">
          Pr&oacute;ximamente
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            disabled
            placeholder="Sube tu archivo / describe tu proyecto"
            className="w-full rounded-lg border border-dark/15 bg-light px-4 py-3 text-sm font-semibold text-dark placeholder:text-tgray focus:outline-none disabled:opacity-60"
          />
          <Button disabled variant="action">
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}

