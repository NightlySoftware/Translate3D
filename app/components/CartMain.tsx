import { useOptimisticCart, type OptimisticCartLine } from '@shopify/hydrogen';
import { Link } from 'react-router';
import type { CartApiQueryFragment } from 'storefrontapi.generated';
import { useAside } from '~/components/Aside';
import { CartLineItem, type CartLine } from '~/components/CartLineItem';
import { cn, focusStyle } from '~/lib/utils';
import { CartSummary } from './CartSummary';

export type CartLayout = 'page' | 'aside';

export type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: CartLayout;
};

export type LineItemChildrenMap = { [parentId: string]: CartLine[] };
/** Returns a map of all line items and their children. */
function getLineItemChildrenMap(lines: CartLine[]): LineItemChildrenMap {
  const children: LineItemChildrenMap = {};
  for (const line of lines) {
    if ('parentRelationship' in line && line.parentRelationship?.parent) {
      const parentId = line.parentRelationship.parent.id;
      if (!children[parentId]) children[parentId] = [];
      children[parentId].push(line);
    }
    if ('lineComponents' in line) {
      const children = getLineItemChildrenMap(line.lineComponents);
      for (const [parentId, childIds] of Object.entries(children)) {
        if (!children[parentId]) children[parentId] = [];
        children[parentId].push(...childIds);
      }
    }
  }
  return children;
}
/**
 * The main cart component that displays the cart items and summary.
 * It is used by both the /cart route and the cart aside dialog.
 */
export function CartMain({ layout, cart: originalCart }: CartMainProps) {
  // The useOptimisticCart hook applies pending actions to the cart
  // so the user immediately sees feedback when they modify the cart.
  const cart = useOptimisticCart(originalCart);

  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const cartHasItems = cart?.totalQuantity ? cart.totalQuantity > 0 : false;
  const childrenMap = getLineItemChildrenMap(cart?.lines?.nodes ?? []);

  return (
    <div className="flex flex-col gap-6">
      <CartEmpty hidden={linesCount} layout={layout} />
      {linesCount ? (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between pb-4 border-b border-dark/10">
            <h2 className="text-[40px] font-extrabold uppercase tracking-tighter leading-none">
              Carrito
            </h2>
          </div>

          <p id="cart-lines" className="sr-only">
            Art&iacute;culos del carrito
          </p>
          <div>
            <ul aria-labelledby="cart-lines" className="flex flex-col">
              {(cart?.lines?.nodes ?? []).map((line) => {
                // we do not render non-parent lines at the root of the cart
                if (
                  'parentRelationship' in line &&
                  line.parentRelationship?.parent
                ) {
                  return null;
                }
                return (
                  <CartLineItem
                    key={line.id}
                    line={line}
                    layout={layout}
                    childrenMap={childrenMap}
                  />
                );
              })}
            </ul>
          </div>
          {cartHasItems && <CartSummary cart={cart} layout={layout} />}
        </div>
      ) : null}
    </div>
  );
}

function CartEmpty({
  hidden = false,
}: {
  hidden: boolean;
  layout?: CartMainProps['layout'];
}) {
  const { close } = useAside();
  return (
    <div hidden={hidden}>
      <p className="text-base font-semibold text-dark">
        A&uacute;n no has agregado nada al carrito.
      </p>
      <p className="mt-2 text-sm font-normal normal-case text-dark/70">
        Explora la tienda y encuentra tu pr&oacute;ximo proyecto.
      </p>
      <div className="mt-6" />
      <Link to="/tienda" onClick={close} prefetch="viewport" className={cn("rounded", focusStyle({ theme: 'action' }))}>
        <span className="text-sm font-extrabold uppercase tracking-tight text-primary hover:text-dark transition-colors">
          Seguir comprando →
        </span>
      </Link>
    </div>
  );
}
