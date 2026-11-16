const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { validSignature, PLANS } = require('../lib/sprint-payments');
const createOrder = require('../api/create-order');
const verifyPayment = require('../api/verify-payment');

function response() {
  return { statusCode: 200, headers: {}, setHeader(k,v) {this.headers[k]=v;}, status(n) {this.statusCode=n;return this;}, json(data) {this.body=data;return this;} };
}

test('configured Sprint amounts are paise and are never supplied by caller', () => {
  assert.equal(PLANS.remote.amount, 500000);
  assert.equal(PLANS.onsite.amount, 1000000);
});

test('rejects invalid amount, plan and malformed JSON before contacting Razorpay', async () => {
  for (const body of [{ plan:'remote',amount:100 },{ plan:'unknown',amount:500000 },'{bad']) {
    const res=response(); await createOrder({method:'POST',headers:{},body},res);
    assert.equal(res.statusCode,400);
  }
});

test('HMAC is based on order ID and payment ID and rejects tampering', () => {
  const secret='only-for-test';
  const signature=crypto.createHmac('sha256',secret).update('order_123|pay_456').digest('hex');
  assert.equal(validSignature('order_123','pay_456',signature,secret),true);
  assert.equal(validSignature('order_999','pay_456',signature,secret),false);
  assert.equal(validSignature('order_123','pay_456','bad',secret),false);
});

test('verification rejects missing fields without marking payment paid', async () => {
  const res=response();await verifyPayment({method:'POST',headers:{},body:{razorpay_order_id:'order_123'}},res);
  assert.equal(res.statusCode,400);
  assert.notEqual(res.body.paid,true);
});
