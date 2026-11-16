const { PLANS, client, validSignature, allowedOrigin } = require('../lib/sprint-payments');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!allowedOrigin(req)) return res.status(403).json({ error: 'Origin not allowed' });
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); }
  catch { return res.status(400).json({ error: 'Invalid request.' }); }
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = body;
  if (![orderId, paymentId, signature].every(x => typeof x === 'string' && x.length)) return res.status(400).json({ error: 'Missing payment details.' });
  const razorpay = client();
  if (!razorpay) return res.status(503).json({ error: 'Payment setup is incomplete.' });
  if (!validSignature(orderId, paymentId, signature, process.env.RAZORPAY_KEY_SECRET)) return res.status(400).json({ error: 'Payment signature does not match.' });
  try {
    const [order, payment] = await Promise.all([razorpay.orders.fetch(orderId), razorpay.payments.fetch(paymentId)]);
    const key = Object.keys(PLANS).find(k => order.receipt?.startsWith(`sprint_${k}_`) && order.amount === PLANS[k].amount && order.currency === PLANS[k].currency);
    if (!key || payment.order_id !== orderId || payment.amount !== order.amount || payment.currency !== order.currency) {
      return res.status(400).json({ error: 'Payment does not match this Sprint order.' });
    }
    return res.status(200).json({ verified: true, paid: payment.status === 'captured', status: payment.status, plan: key, order_id: orderId });
  } catch (error) {
    console.error('Razorpay payment lookup failed', { status: error.statusCode || error.status });
    return res.status(500).json({ error: 'Could not confirm payment status. Please contact us with your payment ID.' });
  }
};
