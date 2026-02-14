import {OrderTracker} from '~/components/OrderTracker';

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
          <OrderTracker variant="hero" />
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
