(function () {
  const buttons = document.querySelectorAll('[data-sprint-plan]');
  if (!buttons.length) return;
  const status = document.getElementById('sprint-payment-status');
  const price = { remote: 500000, onsite: 1000000 };
  let busy = false;
  function message(text, error) { status.textContent = text; status.setAttribute('role', error ? 'alert' : 'status'); }
  async function json(response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Payment service is unavailable.');
    return data;
  }
  buttons.forEach(button => button.addEventListener('click', async () => {
    if (busy) return;
    const plan = button.dataset.sprintPlan;
    if (!price[plan]) return;
    busy = true; buttons.forEach(b => b.disabled = true);
    message('Opening secure test checkout…');
    try {
      if (typeof Razorpay !== 'function') throw new Error('Checkout could not load. Please refresh and try again.');
      const order = await json(await fetch('/api/create-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan, amount: price[plan], currency: 'INR' }) }));
      if (!order.order_id || order.amount !== price[plan] || !order.key_id) throw new Error('Payment order is incomplete.');
      let paymentStarted = false;
      const checkout = new Razorpay({
        key: order.key_id, amount: order.amount, currency: order.currency, name: 'Shikha Solutions', description: order.label,
        order_id: order.order_id, theme: { color: '#091b33' },
        handler: async function (payment) {
          paymentStarted = true;
          message('Verifying your payment…');
          try {
            const result = await json(await fetch('/api/verify-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payment) }));
            message(result.paid ? 'Test payment confirmed. Please contact us to agree your Sprint start date.' : 'Payment signature verified. Capture is pending; please contact us with your payment ID.');
          } catch (error) { message(error.message + ' Please contact us with your payment ID.', true); }
          finally { busy = false; buttons.forEach(b => b.disabled = false); }
        },
        modal: { ondismiss: function () { if (!paymentStarted) { message('Checkout closed. No payment was confirmed.'); busy = false; buttons.forEach(b => b.disabled = false); } } }
      });
      checkout.on('payment.failed', function (event) { message(event.error?.description || 'Payment failed. Please try again.', true); busy = false; buttons.forEach(b => b.disabled = false); });
      checkout.open();
    } catch (error) { message(error.message, true); busy = false; buttons.forEach(b => b.disabled = false); }
  }));
})();
