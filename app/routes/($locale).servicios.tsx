import type {Route} from './+types/($locale).servicios';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Translate3D | Servicios'}];
};

export default function ServiciosRoute() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-16">
      <h1 className="text-[clamp(2.25rem,5vw,4rem)] font-extrabold uppercase leading-[0.95] tracking-tight">
        Servicios
      </h1>
      <p className="mt-6 max-w-2xl text-base font-normal normal-case leading-[1.2] text-dark/80">
        Esta p&aacute;gina es un placeholder mientras definimos el cat&aacute;logo de servicios en Shopify (o en un CMS).
      </p>
    </div>
  );
}

