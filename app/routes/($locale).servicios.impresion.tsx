import {redirect} from 'react-router';
import type {Route} from './+types/($locale).servicios.impresion';

export async function loader({params}: Route.LoaderArgs) {
  const localePrefix = params.locale ? `/${params.locale}` : '';
  return redirect(`${localePrefix}/servicios?tab=impresion`);
}

export default function ServiciosImpresionRoute() {
  return null;
}
