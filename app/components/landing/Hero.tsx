import { ArrowDown } from 'lucide-react';
import { cn, focusStyle } from '~/lib/utils';

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-between font-extrabold text-light">
      <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-between">
        {/* Spacer keeps content pushed down */}
        <div />

        {/* Main heading — matches old 96px / leading-[100%] */}
        <h1 className="w-full px-5 text-[40px] md:text-[64px] lg:text-[96px] leading-[100%] tracking-tight font-extrabold uppercase mt-10 md:mt-20 lg:mt-0">
          Tu visión,
          <br />
          nuestra impresión
        </h1>

        {/* Order tracker section */}
        <div className="flex w-full flex-col gap-10 md:gap-20 px-5 pb-10">
          {/* Tracker labels */}
          <div className="flex justify-between">
            <p className="flex flex-wrap justify-between gap-4 md:gap-20 text-[10px] font-normal leading-[100%]">
              <span className="w-full md:w-auto">RASTREADOR</span>
              <span>
                ¿YA
                <br /> HAS COMPRADO
                <br /> CON NOSOTROS?
              </span>
              <span>
                BUSCA
                <br /> RÁPIDAMENTE EL
                <br /> ESTATUS DE TU PEDIDO
              </span>
            </p>
            <ArrowDown className="h-4 w-4 text-white" />
          </div>

          {/* Input + button */}
          <div className="flex flex-col">
            <div className="flex w-full items-end justify-between gap-4">
              <input
                type="text"
                placeholder="Numero de pedido"
                className={cn(
                  "flex-1 min-w-0 bg-transparent text-[24px] md:text-[52px] lg:text-[64px] uppercase tracking-tight placeholder:text-white/60 placeholder:focus:text-white/40 rounded",
                  focusStyle({ theme: 'action' })
                )}
              />
              <button className={cn(
                "whitespace-nowrap text-center text-[24px] md:text-[52px] lg:text-[64px] uppercase tracking-tight text-white rounded",
                focusStyle({ theme: 'action' })
              )}>
                Buscar
              </button>
            </div>
            <div className="-mt-1 md:-mt-2 h-2 md:h-4 w-full rounded bg-white" />
          </div>
        </div>
      </div>

      {/* Background image (flipped horizontally like old code) */}
      <img
        src="/hero.webp"
        alt="Translate3D"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full select-none object-cover scale-x-[-1]"
        loading="eager"
      />
    </section>
  );
}
