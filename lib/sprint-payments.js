const crypto = require('node:crypto');

const PLANS = Object.freeze({
  remote: { amount: 500000, currency: 'INR', label: 'Remote 7-Day Growth Sprint' },
  onsite: { amount: 1000000, currency: 'INR', label: 'On-Site 7-Day Growth Sprint · Jaipur' }
});

function client() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  const Razorpay = require('razorpay');
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
}

function validSignature(orderId, paymentId, signature, secret) {
  if (![orderId, paymentId, signature, secret].every(x => typeof x === 'string' && x.length)) return false;
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}

function allowedOrigin(req) {
  const origin = req.headers.origin;
  return !origin || origin === 'https://www.shikhasolutions.com' ||
    (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(origin));
}

module.exports = { PLANS, client, validSignature, allowedOrigin };
