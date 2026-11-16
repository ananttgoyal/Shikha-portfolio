const crypto = require('node:crypto');
const { PLANS, client, allowedOrigin } = require('../lib/sprint-payments');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!allowedOrigin(req)) return res.status(403).json({ error: 'Origin not allowed' });
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); }
  catch { return res.status(400).json({ error: 'Invalid request.' }); }
  const plan = PLANS[body.plan];
  if (!plan || !Number.isSafeInteger(body.amount) || body.amount < 100 || body.amount !== plan.amount || (body.currency && body.currency !== plan.currency)) {
    return res.status(400).json({ error: 'Choose a valid Sprint price.' });
  }
  const razorpay = client();
  if (!razorpay) return res.status(503).json({ error: 'Payment setup is incomplete.' });
  try {
    const receipt = `sprint_${body.plan}_${crypto.randomBytes(8).toString('hex')}`;
    const order = await razorpay.orders.create({ amount: plan.amount, currency: plan.currency, receipt });
    return res.status(200).json({ order_id: order.id, amount: order.amount, currency: order.currency, key_id: process.env.RAZORPAY_KEY_ID, plan: body.plan, label: plan.label });
  } catch (error) {
    const status = error.statusCode || error.status;
    console.error('Razorpay order creation failed', { status });
    return res.status(status === 401 ? 401 : 500).json({ error: status === 401 ? 'Payment authentication failed.' : 'Could not start payment. Please try again.' });
  }
};
