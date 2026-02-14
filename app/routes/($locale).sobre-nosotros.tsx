import type { Route } from './+types/($locale).sobre-nosotros';

export const meta: Route.MetaFunction = () => {
  return [
    { title: 'Translate3D | Sobre Nosotros' },
    { name: 'description', content: 'Conoce a Translate3D: nuestro equipo, misión y pasión por la impresión 3D en México. Transformamos ideas en objetos reales con tecnología de vanguardia.' },
  ];
};

export default function SobreNosotrosRoute() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-16">
      <h1 className="text-[clamp(2.25rem,5vw,4rem)] font-extrabold uppercase leading-[0.95] tracking-tight">
        Sobre nosotros
      </h1>
      <p className="mt-6 max-w-2xl text-base font-normal normal-case leading-[1.2] text-dark/80">
        Placeholder. Aqu&iacute; contaremos nuestra historia, equipo y compromiso con la impresi&oacute;n 3D.
      </p>
    </div>
  );
}

