import {redirect} from 'react-router';
import type {Route} from './+types/($locale).servicios.modelado';

export async function loader({params}: Route.LoaderArgs) {
  const localePrefix = params.locale ? `/${params.locale}` : '';
  return redirect(`${localePrefix}/servicios?tab=modelado`);
}

export default function ServiciosModeladoRoute() {
  return null;
}
