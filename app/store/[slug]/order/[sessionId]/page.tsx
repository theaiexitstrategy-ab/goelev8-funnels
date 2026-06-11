// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Order confirmation page reached after a successful merch checkout. The
// success_url Stripe redirects to includes {CHECKOUT_SESSION_ID}, which we
// receive here as the dynamic [sessionId] segment.
//
// The webhook records the order asynchronously. This page may render before
// the webhook has fired, so we look up the order by stripe_payment_id and
// show a "still processing" state when no row exists yet. The user can
// refresh — the order will materialize within a few seconds.

import { createServiceClient } from '@/lib/db/supabase-service';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic'; // never cache — order arrives async

type Props = { params: Promise<{ slug: string; sessionId: string }> };

function dollars(cents: number | null | undefined): string {
  if (cents == null) return '—';
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function OrderConfirmationPage({ params }: Props) {
  const { slug, sessionId } = await params;
  const supabase = createServiceClient();

  const { data: client } = await supabase
    .from('clients')
    .select('id, slug, name, business_name, brand_color, logo_url')
    .eq('slug', slug)
    .single();
  if (!client) notFound();

  const { data: order } = await supabase
    .from('merch_orders')
    .select('id, customer_name, customer_email, customer_phone, shipping_address1, shipping_address2, shipping_city, shipping_state, shipping_zip, shipping_country, subtotal_cents, shipping_cents, discount_cents, total_cents, status, created_at')
    .eq('client_id', client.id)
    .eq('stripe_payment_id', sessionId)
    .maybeSingle();

  const { data: items } = order
    ? await supabase
        .from('merch_order_items')
        .select('id, product_key, name, quantity, price_cents, size, color')
        .eq('order_id', order.id)
        .order('id', { ascending: true })
    : { data: null };

  const accent = client.brand_color || '#00CFFF';
  const businessName = client.business_name || client.name || client.slug;
  const isPending = !order;

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <header style={{ background: accent, color: '#fff', padding: '32px 16px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>
          {isPending ? 'Almost there…' : 'Thanks for your order!'}
        </h1>
        <p style={{ fontSize: 14, opacity: 0.9, marginTop: 6 }}>
          {isPending
            ? "We're still finalizing your purchase — this page will catch up in a few seconds."
            : `Your order with ${businessName} is confirmed.`}
        </p>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px 60px' }}>
        {isPending ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E5E7EB', textAlign: 'center' }}>
            <p style={{ marginTop: 0, color: '#4B5563', lineHeight: 1.6 }}>
              Your payment has been accepted by Stripe. We're recording your order in the background.
              Refresh this page in a few seconds, or check your email — you'll get a receipt from Stripe shortly.
            </p>
            <p style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 0 }}>
              Order reference: <code style={{ background: '#F3F4F6', padding: '2px 6px', borderRadius: 4 }}>{sessionId.slice(0, 24)}…</code>
            </p>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20, borderBottom: '1px solid #F3F4F6', paddingBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>Order</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{(order.id as string).slice(0, 8).toUpperCase()}</div>
              </div>
              <div style={{ background: accent, color: '#fff', borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
                {order.status}
              </div>
            </div>

            {(items?.length ?? 0) > 0 ? (
              <div style={{ marginBottom: 20 }}>
                {(items ?? []).map((it) => (
                  <div key={it.id as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed #F3F4F6' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{it.name}</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>
                        Qty {it.quantity}
                        {it.size ? ` · ${it.size}` : ''}
                        {it.color ? ` · ${it.color}` : ''}
                      </div>
                    </div>
                    <div style={{ fontWeight: 600 }}>{dollars((it.price_cents as number) * (it.quantity as number))}</div>
                  </div>
                ))}
              </div>
            ) : null}

            <Row label="Subtotal" value={dollars(order.subtotal_cents as number)} />
            {(order.shipping_cents as number) > 0 ? <Row label="Shipping" value={dollars(order.shipping_cents as number)} /> : null}
            {(order.discount_cents as number) > 0 ? <Row label="Discount" value={`− ${dollars(order.discount_cents as number)}`} /> : null}
            <Row label="Total" value={dollars(order.total_cents as number)} bold accent={accent} />

            {(order.shipping_address1 || order.shipping_city) ? (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #F3F4F6', fontSize: 13, color: '#4B5563', lineHeight: 1.6 }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Shipping to</div>
                {order.customer_name ? <div>{order.customer_name}</div> : null}
                {order.shipping_address1 ? <div>{order.shipping_address1}</div> : null}
                {order.shipping_address2 ? <div>{order.shipping_address2}</div> : null}
                <div>
                  {[order.shipping_city, order.shipping_state, order.shipping_zip].filter(Boolean).join(', ')}
                </div>
                {order.shipping_country ? <div>{order.shipping_country}</div> : null}
              </div>
            ) : null}

            {order.customer_email ? (
              <div style={{ marginTop: 12, fontSize: 12, color: '#6B7280' }}>
                Receipt sent to <strong>{order.customer_email}</strong>
              </div>
            ) : null}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <a
            href={`/store/${client.slug}`}
            style={{ color: accent, fontWeight: 600, textDecoration: 'none', fontSize: 14 }}
          >
            ← Continue shopping
          </a>
        </div>
      </main>

      <footer style={{ textAlign: 'center', padding: '20px 16px 32px', color: '#9CA3AF', fontSize: 12 }}>
        <a href="https://goelev8.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#9CA3AF', textDecoration: 'none' }}>
          Powered by GoElev8.ai
        </a>
        <div style={{ marginTop: 6 }}>&copy; 2026 GoElev8.ai</div>
      </footer>
    </div>
  );
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: bold ? '#111' : '#4B5563' }}>
      <span>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 500, color: bold ? accent ?? '#111' : '#4B5563' }}>{value}</span>
    </div>
  );
}
