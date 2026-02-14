import {redirect} from 'react-router';
import type {Route} from './+types/($locale).account_.login';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Iniciar sesion'}];
};

export async function loader({request, context, params}: Route.LoaderArgs) {
  const isLoggedIn = await context.customerAccount.isLoggedIn();
  const localePrefix = params.locale ? `/${params.locale}` : '';

  if (isLoggedIn) {
    return redirect(`${localePrefix}/account`);
  }

  const url = new URL(request.url);
  const loginHint = url.searchParams.get('login_hint') || undefined;
  const locale = url.searchParams.get('locale') || 'es';

  return context.customerAccount.login({
    countryCode: context.storefront.i18n.country,
    loginHint,
    locale,
  });
}

export default function AccountLoginRoute() {
  return null;
}
