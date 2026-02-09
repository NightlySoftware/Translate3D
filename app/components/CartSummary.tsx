import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {CartForm, Money, type OptimisticCart} from '@shopify/hydrogen';
import {useEffect, useRef} from 'react';
import {useFetcher} from 'react-router';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartSummary({cart, layout}: CartSummaryProps) {
  const className = layout === 'page' ? 'mt-10' : 'mt-6';

  return (
    <div aria-labelledby="cart-summary" className={className}>
      <h4 className="text-base font-extrabold uppercase tracking-tight">
        Totales
      </h4>
      <dl className="mt-3 flex items-center justify-between rounded-lg border border-dark/10 bg-light p-4">
        <dt className="text-sm font-semibold text-dark">Subtotal</dt>
        <dd className="text-sm font-extrabold text-dark">
          {cart?.cost?.subtotalAmount?.amount ? (
            <Money data={cart?.cost?.subtotalAmount} />
          ) : (
            '-'
          )}
        </dd>
      </dl>
      <CartDiscounts discountCodes={cart?.discountCodes} />
      <CartGiftCard giftCardCodes={cart?.appliedGiftCards} />
      <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} />
    </div>
  );
}

function CartCheckoutActions({checkoutUrl}: {checkoutUrl?: string}) {
  if (!checkoutUrl) return null;

  return (
    <div className="mt-6">
      <a href={checkoutUrl} target="_self">
        <p className="rounded-lg border border-primary bg-primary px-4 py-3 text-center text-sm font-extrabold uppercase tracking-tight text-light hover:border-dark hover:bg-dark">
          Continuar al checkout &rarr;
        </p>
      </a>
    </div>
  );
}

function CartDiscounts({
  discountCodes,
}: {
  discountCodes?: CartApiQueryFragment['discountCodes'];
}) {
  const codes: string[] =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({code}) => code) || [];

  return (
    <div className="mt-6">
      {/* Have existing discount, display it with a remove option */}
      <dl hidden={!codes.length}>
        <div className="flex flex-col gap-2">
          <dt className="text-xs font-extrabold uppercase tracking-tight text-tgray">
            Descuento(s)
          </dt>
          <UpdateDiscountForm>
            <div className="flex items-center justify-between rounded-lg border border-dark/10 bg-light p-4">
              <code className="text-xs font-extrabold uppercase tracking-tight text-dark">
                {codes?.join(', ')}
              </code>
              <button
                type="submit"
                aria-label="Quitar descuento"
                className="text-xs font-extrabold uppercase tracking-tight text-primary hover:text-dark"
              >
                Quitar
              </button>
            </div>
          </UpdateDiscountForm>
        </div>
      </dl>

      {/* Show an input to apply a discount */}
      <UpdateDiscountForm discountCodes={codes}>
        <div className="flex items-center gap-2">
          <label htmlFor="discount-code-input" className="sr-only">
            C\u00f3digo de descuento
          </label>
          <input
            id="discount-code-input"
            type="text"
            name="discountCode"
            placeholder="C\u00f3digo de descuento"
            className="w-full rounded-lg border border-dark/15 bg-light px-4 py-3 text-sm font-semibold text-dark placeholder:text-tgray focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="submit"
            aria-label="Aplicar descuento"
            className="rounded-lg border border-dark bg-dark px-4 py-3 text-xs font-extrabold uppercase tracking-tight text-light hover:border-primary hover:bg-primary"
          >
            Aplicar
          </button>
        </div>
      </UpdateDiscountForm>
    </div>
  );
}

function UpdateDiscountForm({
  discountCodes,
  children,
}: {
  discountCodes?: string[];
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
}

function CartGiftCard({
  giftCardCodes,
}: {
  giftCardCodes: CartApiQueryFragment['appliedGiftCards'] | undefined;
}) {
  const giftCardCodeInput = useRef<HTMLInputElement>(null);
  const giftCardAddFetcher = useFetcher({key: 'gift-card-add'});

  useEffect(() => {
    if (giftCardAddFetcher.data) {
      giftCardCodeInput.current!.value = '';
    }
  }, [giftCardAddFetcher.data]);

  return (
    <div className="mt-6">
      {giftCardCodes && giftCardCodes.length > 0 && (
        <dl>
          <dt className="text-xs font-extrabold uppercase tracking-tight text-tgray">
            Gift cards aplicadas
          </dt>
          {giftCardCodes.map((giftCard) => (
            <RemoveGiftCardForm key={giftCard.id} giftCardId={giftCard.id}>
              <div className="mt-2 flex items-center justify-between rounded-lg border border-dark/10 bg-light p-4">
                <code className="text-xs font-extrabold uppercase tracking-tight text-dark">
                  ***{giftCard.lastCharacters}
                </code>
                <div className="text-sm font-extrabold text-dark">
                  <Money data={giftCard.amountUsed} />
                </div>
                <button
                  type="submit"
                  className="text-xs font-extrabold uppercase tracking-tight text-primary hover:text-dark"
                >
                  Quitar
                </button>
              </div>
            </RemoveGiftCardForm>
          ))}
        </dl>
      )}

      <AddGiftCardForm fetcherKey="gift-card-add">
        <div className="flex items-center gap-2">
          <input
            type="text"
            name="giftCardCode"
            placeholder="C\u00f3digo de gift card"
            ref={giftCardCodeInput}
            className="w-full rounded-lg border border-dark/15 bg-light px-4 py-3 text-sm font-semibold text-dark placeholder:text-tgray focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="submit"
            disabled={giftCardAddFetcher.state !== 'idle'}
            className="rounded-lg border border-dark bg-dark px-4 py-3 text-xs font-extrabold uppercase tracking-tight text-light hover:border-primary hover:bg-primary disabled:opacity-50"
          >
            Aplicar
          </button>
        </div>
      </AddGiftCardForm>
    </div>
  );
}

function AddGiftCardForm({
  fetcherKey,
  children,
}: {
  fetcherKey?: string;
  children: React.ReactNode;
}) {
  return (
    <CartForm
      fetcherKey={fetcherKey}
      route="/cart"
      action={CartForm.ACTIONS.GiftCardCodesAdd}
    >
      {children}
    </CartForm>
  );
}

function RemoveGiftCardForm({
  giftCardId,
  children,
}: {
  giftCardId: string;
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.GiftCardCodesRemove}
      inputs={{
        giftCardCodes: [giftCardId],
      }}
    >
      {children}
    </CartForm>
  );
}
