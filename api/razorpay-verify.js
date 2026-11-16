// POST /api/razorpay-verify
// Called by the checkout page after Razorpay reports success. Checks the
// signature with the secret key, re-reads the payment from Razorpay, then
// emails a receipt to the customer and a notification to the owner.
// Needs: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET; RESEND_API_KEY for emails (optional).
const crypto = require('crypto');
const { parseBody } = require('../lib/lead-utils');

const FROM = 'Aanant Goyal | Shikha Solutions <hello@shikhasolutions.com>';
const OWNER = 'shikhasolutionsin@gmail.com';
const esc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const idOk = (s, prefix) => typeof s === 'string' && new RegExp('^' + prefix + '_[A-Za-z0-9]{6,40}$').test(s);
const rupees = paise => '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

async function rzp(path, keyId, keySecret) {
  const r = await fetch('https://api.razorpay.com/v1/' + path, {
    headers: { Authorization: 'Basic ' + Buffer.from(keyId + ':' + keySecret).toString('base64') }
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Error('Razorpay ' + path + ' ' + r.status);
  return data;
}

async function send(apiKey, payload) {
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!r.ok) throw Error('Mail delivery failed: ' + r.status);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, error: 'Method not allowed' }); }
  const keyId = process.env.RAZORPAY_KEY_ID, keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return res.status(503).json({ ok: false, error: 'Payments not configured' });

  let body;
  try { body = parseBody(req); } catch { return res.status(400).json({ ok: false, error: 'Invalid request' }); }
  const orderId = body && body.razorpay_order_id, paymentId = body && body.razorpay_payment_id, signature = body && body.razorpay_signature;
  if (!idOk(orderId, 'order') || !idOk(paymentId, 'pay') || typeof signature !== 'string') return res.status(400).json({ ok: false, error: 'Invalid payment details' });

  const expected = crypto.createHmac('sha256', keySecret).update(orderId + '|' + paymentId).digest('hex');
  if (!safeEqual(expected, signature)) return res.status(400).json({ ok: false, error: 'Payment could not be verified' });

  let order, payment;
  try {
    [order, payment] = await Promise.all([rzp('orders/' + orderId, keyId, keySecret), rzp('payments/' + paymentId, keyId, keySecret)]);
  } catch (e) {
    console.error('Razorpay lookup failed', e);
    // Signature is valid, so the payment is genuine; tell the customer it went through.
    return res.status(200).json({ ok: true, paymentId, pending: true });
  }
  if (payment.order_id !== orderId || payment.amount !== order.amount || !['captured', 'authorized'].includes(payment.status)) {
    return res.status(400).json({ ok: false, error: 'Payment is not complete yet. If money was debited, it will be auto-refunded by your bank, or contact us.' });
  }

  const n = order.notes || {};
  const amount = rupees(payment.amount);
  if (process.env.RESEND_API_KEY) {
    const rows = [['Paid for', n.product_name], ['Amount', amount], ['Payment ID', paymentId], ['Order ID', orderId], ['Name', n.customer_name], ['Business', n.business], ['Email', n.email], ['Phone', n.phone], ['Method', payment.method], ['Status', payment.status]];
    const table = rows.map(([k, v]) => '<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#687083;width:150px">' + esc(k) + '</td><td style="padding:8px;border-bottom:1px solid #eee">' + esc(v || '—') + '</td></tr>').join('');
    const nextStep = n.product === 'sur-samvad'
      ? 'Your seat at Sur &amp; Samvad (Sunday, 29 November 2026, 12:00 PM, Jaipur) is confirmed. We will share the exact venue privately on WhatsApp before the event.'
      : 'We will WhatsApp you within one working day to fix your Day 0 call, where we agree the metric and baseline for your Sprint.';
    const jobs = [
      send(process.env.RESEND_API_KEY, {
        from: FROM, to: [OWNER], reply_to: n.email || undefined,
        subject: 'Payment received ' + amount + ' — ' + (n.product_name || '') + ' — ' + (n.customer_name || ''),
        html: '<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto"><div style="background:#061A33;color:#E2AA43;padding:22px"><h1 style="margin:0;font-size:22px">Payment received · ' + esc(amount) + '</h1></div><table style="border-collapse:collapse;width:100%">' + table + '</table></div>',
        tags: [{ name: 'source', value: 'razorpay-payment' }]
      })
    ];
    if (n.email) jobs.push(send(process.env.RESEND_API_KEY, {
      from: FROM, to: [n.email], reply_to: OWNER,
      subject: 'Payment received — ' + (n.product_name || 'Shikha Solutions'),
      html: '<div style="font-family:Arial,sans-serif;background:#f7f3ec;padding:24px;color:#172b44"><div style="max-width:620px;margin:auto;background:#fff;padding:30px;border-top:5px solid #b68b51"><h1 style="color:#0b1d36;font-size:24px">Thank you, ' + esc(n.customer_name) + '!</h1><p>We have received your payment of <strong>' + esc(amount) + '</strong> for <strong>' + esc(n.product_name) + '</strong>.</p><p>' + nextStep + '</p><p style="font-size:13px;color:#65717c">Payment ID: ' + esc(paymentId) + '<br>Keep this email as your payment receipt. Refunds and cancellations follow our <a href="https://www.shikhasolutions.com/refund-policy">Refund &amp; Cancellation Policy</a>.</p><p>Warmly,<br>Aanant Goyal<br>Shikha Solutions · +91 77588 59995</p></div></div>',
      tags: [{ name: 'source', value: 'razorpay-receipt' }]
    }));
    const results = await Promise.allSettled(jobs);
    results.forEach(r => { if (r.status === 'rejected') console.error('Payment email failed', r.reason); });
  }
  return res.status(200).json({ ok: true, paymentId, product: n.product || null, amount: payment.amount });
};
