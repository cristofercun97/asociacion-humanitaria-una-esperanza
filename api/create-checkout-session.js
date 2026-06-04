/* ==========================================================================
   Vercel Serverless Function — /api/create-checkout-session
   Creates a Stripe Checkout Session in embedded (ui_mode: 'embedded') mode.

   Env vars required (set in Vercel dashboard):
     STRIPE_SECRET_KEY  — sk_live_... or sk_test_...
     SITE_URL           — https://tudominio.com  (opcional, fallback a host header)
   ========================================================================== */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  /* ── CORS headers ─────────────────────────────────────────────────────── */
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  /* ── Validate input ───────────────────────────────────────────────────── */
  const raw = req.body && req.body.amount;
  const euros = parseFloat(raw);

  if (!raw || isNaN(euros) || euros < 1 || euros > 10000) {
    return res.status(400).json({
      error: 'El importe debe ser un número entre 1 € y 10 000 €.',
    });
  }

  // Convert to cents — Stripe uses the smallest currency unit
  const amountCents = Math.round(euros * 100);

  /* ── Build return URL ─────────────────────────────────────────────────── */
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const origin =
    process.env.SITE_URL ||
    (host ? `${protocol}://${host}` : 'https://localhost:3000');

  const returnUrl = `${origin}/gracias.html?session_id={CHECKOUT_SESSION_ID}`;

  /* ── Create Checkout Session ──────────────────────────────────────────── */
  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Donación — Asociación Humanitaria Una Esperanza',
              description:
                'Tu aportación ayuda a personas y familias en situación de vulnerabilidad.',
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      return_url: returnUrl,
      // Metadata for record-keeping (not shown to donor)
      metadata: {
        source: 'landing-embedded-checkout',
      },
    });

    return res.status(200).json({ clientSecret: session.client_secret });
  } catch (err) {
    console.error('[Stripe] create-checkout-session error:', err.message);
    return res.status(500).json({ error: 'Error al crear la sesión de pago.' });
  }
};
