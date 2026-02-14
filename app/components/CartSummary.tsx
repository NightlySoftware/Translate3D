import type { CartApiQueryFragment } from 'storefrontapi.generated';
import type { CartLayout } from '~/components/CartMain';
import { CartForm, Money, type OptimisticCart } from '@shopify/hydrogen';
import { useEffect, useRef, useState } from 'react';
import { cn, focusStyle } from '~/lib/utils';
import { useFetcher } from 'react-router';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartSummary({ cart, layout }: CartSummaryProps) {
  const className = layout === 'page' ? 'mt-10' : 'mt-8 border-t border-dark pt-8';
  const totalQuantity = cart?.totalQuantity || 0;

  return (
    <div aria-labelledby="cart-summary" className={className}>
      <h4 className="text-[32px] font-extrabold uppercase tracking-tighter leading-none mb-6">
        Resumen de compra
      </h4>

      <div className="flex flex-col gap-4">
        <dl className="flex items-center justify-between">
          <dt className="text-xs font-extrabold uppercase tracking-tight text-dark">
            Subtotal ({totalQuantity} art&iacute;culos)
          </dt>
          <dd className="text-base font-extrabold text-dark tracking-tight">
            {cart?.cost?.subtotalAmount?.amount ? (
              <Money data={cart?.cost?.subtotalAmount} />
            ) : (
              '-'
            )}
          </dd>
        </dl>

        <CartDiscounts discountCodes={cart?.discountCodes} />
        <CartGiftCard giftCardCodes={cart?.appliedGiftCards} />

        <p className="mt-2 text-[11px] text-tgray text-center font-semibold leading-tight px-4 uppercase tracking-tight">
          IVA, env&iacute;o y otros cargos se calculan al final
        </p>

        <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} />

        <p className="mt-4 text-[10px] text-tgray text-center font-medium leading-tight px-4">
          El costo del env&iacute;o y tu m&eacute;todo de pago se procesan al continuar
        </p>
      </div>
    </div>
  );
}

function CartCheckoutActions({ checkoutUrl }: { checkoutUrl?: string }) {
  if (!checkoutUrl) return null;

  return (
    <div className="mt-2">
      <a href={checkoutUrl} target="_self" className={cn("block rounded", focusStyle({ theme: 'action' }))}>
        <p className="rounded-none bg-primary px-4 py-4 text-center text-[15px] font-extrabold uppercase tracking-tight text-light hover:bg-dark transition-colors">
          Continuar compra
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
      ?.map(({ code }) => code) || [];

  const fetcher = useFetcher({ key: 'discount-code-update' });
  const inputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // We use a ref to track the last code submitted
  const lastSubmittedCode = useRef<string | null>(null);

  useEffect(() => {
    if (fetcher.state === 'submitting') {
      const formData = fetcher.formData;
      const code = formData?.get('discountCode');
      if (typeof code === 'string' && code.trim()) {
        lastSubmittedCode.current = code;
        setFeedback(null); // Clear previous feedback while loading
      }
    }

    if (fetcher.state === 'idle' && fetcher.data) {
      if (lastSubmittedCode.current) {
        const appliedCode = discountCodes?.find(
          (d) => d.code.toUpperCase() === lastSubmittedCode.current?.toUpperCase()
        );

        if (appliedCode) {
          if (appliedCode.applicable) {
            setFeedback({ type: 'success', message: '¡Cupón aplicado!' });
            if (inputRef.current) inputRef.current.value = '';
          } else {
            setFeedback({ type: 'error', message: 'Código inválido o no aplicable' });
          }
        } else {
          // If the code isn't in the list at all, it might have been rejected entirely
          setFeedback({ type: 'error', message: 'Código inválido o no aplicable' });
        }
        lastSubmittedCode.current = null;
      }
    }
  }, [fetcher.state, fetcher.data, discountCodes]);

  const isSubmitting = fetcher.state === 'submitting';

  return (
    <div className="mt-2 text-left">
      {/* Have existing discount, display it with a remove option */}
      <dl aria-hidden={codes.length === 0} className={cn("mb-4", codes.length === 0 && "hidden")}>
        <div className="flex flex-col gap-2">
          <dt className="text-[10px] font-extrabold uppercase tracking-tight text-tgray">
            Cup&oacute;n aplicado:
          </dt>
          <UpdateDiscountForm fetcherKey="discount-code-update">
            <div className="flex items-center justify-between py-1">
              <code className="text-[13px] font-extrabold uppercase tracking-tight text-primary">
                {codes?.join(', ')}
              </code>
              <button
                type="submit"
                aria-label="Quitar descuento"
                className="text-[10px] font-extrabold uppercase tracking-tight text-primary hover:text-dark transition-colors"
              >
                Eliminar
              </button>
            </div>
          </UpdateDiscountForm>
        </div>
      </dl>

      {/* Show an input to apply a discount */}
      <UpdateDiscountForm discountCodes={codes} fetcherKey="discount-code-update">
        <div className="flex flex-col gap-2">
          <label htmlFor="discount-code-input" className="text-[10px] font-extrabold uppercase tracking-tight text-dark">
            C&oacute;digo de cup&oacute;n:
          </label>
          <div className="flex items-center gap-2">
            <input
              id="discount-code-input"
              type="text"
              name="discountCode"
              ref={inputRef}
              disabled={isSubmitting}
              className={cn(
                "w-full bg-white border rounded px-4 py-2 text-sm font-bold text-dark placeholder:text-dark/20 focus:border-dark outline-none transition-all h-10",
                feedback?.type === 'error' ? "border-red-500" : "border-dark/20",
                focusStyle({ theme: 'action' })
              )}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              aria-label="Aplicar descuento"
              className="bg-primary px-6 py-2 h-10 text-[11px] font-extrabold uppercase tracking-tight text-light hover:bg-dark transition-all shrink-0 rounded disabled:opacity-50"
            >
              {isSubmitting ? '...' : 'Aplicar'}
            </button>
          </div>

          <div className="min-h-[15px] mt-1 relative">
            {isSubmitting && (
              <p className="text-[10px] font-bold uppercase text-tgray animate-pulse">
                Aplicando cup&oacute;n...
              </p>
            )}

            {!isSubmitting && feedback && (
              <p className={cn(
                "text-[10px] font-bold uppercase",
                feedback.type === 'success' ? "text-green-600" : "text-red-500"
              )}>
                {feedback.message}
              </p>
            )}
          </div>
        </div>
      </UpdateDiscountForm>
    </div>
  );
}

function UpdateDiscountForm({
  discountCodes,
  fetcherKey,
  children,
}: {
  discountCodes?: string[];
  fetcherKey?: string;
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      fetcherKey={fetcherKey}
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
  const giftCardAddFetcher = useFetcher({ key: 'gift-card-add' });

  useEffect(() => {
    if (giftCardAddFetcher.data) {
      if (giftCardCodeInput.current) giftCardCodeInput.current.value = '';
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
                  className={cn(
                    "text-xs font-extrabold uppercase tracking-tight text-primary hover:text-dark transition-colors rounded",
                    focusStyle({ theme: 'action' })
                  )}
                >
                  Quitar
                </button>
              </div>
            </RemoveGiftCardForm>
          ))}
        </dl>
      )}

      {/* Remove gift card input to avoid duplication with coupon, 
          as Shopify gift cards and coupons are often handled similarly by users 
          in this context, and user explicitly requested to remove '2 coupon items' */}
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
