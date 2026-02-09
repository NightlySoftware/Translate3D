import type {Route} from './+types/($locale).soporte';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Translate3D | Soporte'}];
};

export default function SoporteRoute() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-16">
      <h1 className="text-[clamp(2.25rem,5vw,4rem)] font-extrabold uppercase leading-[0.95] tracking-tight">
        Soporte
      </h1>
      <p className="mt-6 max-w-2xl text-base font-normal normal-case leading-[1.2] text-dark/80">
        Placeholder. Aqu&iacute; pondremos FAQs, contacto, env&iacute;os y devoluciones.
      </p>
    </div>
  );
}

