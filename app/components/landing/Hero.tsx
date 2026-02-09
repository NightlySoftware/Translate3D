import {ArrowDown} from 'lucide-react';
import {Button} from '~/components/ui/button';

export function Hero() {
  return (
    <section className="-mt-20 relative flex min-h-[100svh] w-full flex-col items-center justify-between text-light">
      <div />

      <h1 className="w-full px-5 text-[clamp(3rem,7vw,6rem)] font-extrabold leading-[0.95] tracking-tight">
        Tu visi&oacute;n,
        <br />
        nuestra impresi&oacute;n
      </h1>

      <div className="w-full px-5 pb-10">
        {/* Order tracker (dummy for now) */}
        <div className="flex flex-col gap-8 rounded-2xl bg-dark/35 p-5 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-8">
            <p className="text-[10px] font-normal leading-[1.05] tracking-wide">
              <span className="mr-10 inline-block">RASTREADOR</span>
              <span className="mr-10 inline-block">
                &iquest;YA
                <br /> HAS COMPRADO
                <br /> CON NOSOTROS?
              </span>
              <span className="inline-block">
                BUSCA
                <br /> R&Aacute;PIDAMENTE EL
                <br /> ESTATUS DE TU PEDIDO
              </span>
              <span className="ml-4 inline-block rounded-full bg-light/15 px-2 py-1 text-[10px] font-extrabold uppercase">
                Pr&oacute;ximamente
              </span>
            </p>
            <ArrowDown className="h-4 w-4" />
          </div>

          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              // TODO: wire to real tracking provider/service.
            }}
          >
            <div className="flex w-full items-end justify-between gap-4">
              <input
                disabled
                type="text"
                placeholder="N&uacute;mero de pedido"
                className="w-full bg-transparent text-[clamp(1.75rem,5vw,4rem)] uppercase tracking-tight text-light placeholder:text-light/60 focus:outline-none disabled:opacity-60"
              />
              <Button
                disabled
                type="submit"
                variant="secondary"
                className="h-auto bg-light/10 px-6 py-4 text-[clamp(1.25rem,3vw,2.25rem)] text-light hover:bg-light/15 hover:text-light"
              >
                Buscar
              </Button>
            </div>
            <div className="h-3 w-full rounded bg-light" />
          </form>
        </div>
      </div>

      <img
        src="/hero.webp"
        alt="Translate3D"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full select-none object-cover [transform:scaleX(-1)]"
        loading="eager"
      />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-black/25" />
    </section>
  );
}
