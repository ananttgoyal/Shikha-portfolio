// POST /api/razorpay-order
// Creates a Razorpay order for a known product. The amount always comes from
// lib/payment-products.js — never from the browser.
// Needs Vercel env vars: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET.
const { normalizePhone, parseBody } = require('../lib/lead-utils');
const { getProduct, listProducts } = require('../lib/payment-products');

const ORIGINS = new Set(['https://www.shikhasolutions.com', 'https://shikhasolutions.com']);
const clean = (x, n = 200) => String(x == null ? '' : x).replace(/[\r\n\t]+/g, ' ').trim().slice(0, n);
const emailOk = s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

function originAllowed(origin) {
  if (!origin) return true;
  if (ORIGINS.has(origin)) return true;
  // Allow this project's Vercel preview deployments so the flow can be tested before going live.
  return /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin) && process.env.VERCEL_ENV !== 'production';
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  // GET returns the current product list + prices so the page never shows a stale price.
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, products: listProducts(), keyConfigured: Boolean(process.env.RAZORPAY_KEY_ID) });
  }
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ ok: false, error: 'Method not allowed' }); }
  if (!originAllowed(req.headers.origin)) return res.status(403).json({ ok: false, error: 'Origin not allowed' });
  if (Number(req.headers['content-length'] || 0) > 8000) return res.status(413).json({ ok: false, error: 'Request too large' });

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return res.status(503).json({ ok: false, error: 'Online payments are being set up. Please WhatsApp +91 77588 59995 to pay.' });

  let body;
  try { body = parseBody(req); } catch { return res.status(400).json({ ok: false, error: 'Invalid request' }); }
  if (!body || typeof body !== 'object') return res.status(400).json({ ok: false, error: 'Invalid request' });
  if (clean(body.website)) return res.status(400).json({ ok: false, error: 'Invalid request' }); // honeypot

  const product = getProduct(clean(body.product, 40));
  const name = clean(body.name, 100);
  const email = clean(body.email, 180).toLowerCase();
  const phone = normalizePhone(body.phone);
  const business = clean(body.business, 150);
  const agreed = body.agree === true || body.agree === 'true';

  if (!product) return res.status(400).json({ ok: false, error: 'Please choose what you are paying for.' });
  if (!name || !emailOk(email) || !phone || !business) return res.status(400).json({ ok: false, error: 'Please fill your name, email, 10-digit mobile number and business name.' });
  if (!agreed) return res.status(400).json({ ok: false, error: 'Please accept the Terms and Refund Policy to continue.' });

  const receipt = ('ss_' + product.id + '_' + Date.now().toString(36)).slice(0, 40);
  try {
    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(keyId + ':' + keySecret).toString('base64'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: product.amount,
        currency: 'INR',
        receipt,
        notes: { product: product.id, product_name: product.name.slice(0, 250), customer_name: name, business, email, phone }
      })
    });
    const order = await r.json().catch(() => ({}));
    if (!r.ok || !order.id) {
      console.error('Razorpay order failed', r.status, order && order.error);
      return res.status(502).json({ ok: false, error: 'Could not start the payment. Please try again in a minute.' });
    }
    return res.status(200).json({
      ok: true,
      keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      product: { id: product.id, name: product.name, description: product.description },
      prefill: { name, email, contact: '+91' + phone }
    });
  } catch (e) {
    console.error('Razorpay order error', e);
    return res.status(502).json({ ok: false, error: 'Could not reach the payment gateway. Please try again.' });
  }
};
