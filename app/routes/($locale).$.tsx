import type {Route} from './+types/($locale).$';

export async function loader({request}: Route.LoaderArgs) {
  throw new Response(`${new URL(request.url).pathname} no encontrado`, {
    status: 404,
  });
}

export default function CatchAllPage() {
  return null;
}
