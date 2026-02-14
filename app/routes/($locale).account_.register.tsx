import {redirect} from 'react-router';
import type {Route} from './+types/($locale).account_.register';

export async function loader({request, params}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const localePrefix = params.locale ? `/${params.locale}` : '';
  const next = new URL(`${localePrefix}/account/login`, url.origin);

  const returnTo = url.searchParams.get('return_to');
  const loginHint = url.searchParams.get('login_hint');

  if (returnTo) next.searchParams.set('return_to', returnTo);
  if (loginHint) next.searchParams.set('login_hint', loginHint);

  return redirect(`${next.pathname}${next.search}`);
}

export async function action({request, params}: Route.ActionArgs) {
  const url = new URL(request.url);
  const localePrefix = params.locale ? `/${params.locale}` : '';
  const next = new URL(`${localePrefix}/account/login`, url.origin);

  return redirect(`${next.pathname}${next.search}`);
}
