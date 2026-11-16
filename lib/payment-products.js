// Single source of truth for everything the website can charge for.
// Prices live ONLY on the server, in paise (₹1 = 100 paise). The browser
// sends a product id; it can never set its own amount.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function surSamvadPrice(now = new Date()) {
  // ₹1,299 for selected founders paying by 22 Nov 2026 (end of day IST), ₹1,499 after.
  const earlyBirdEnds = Date.UTC(2026, 10, 22, 23, 59, 59) - IST_OFFSET_MS;
  return now.getTime() <= earlyBirdEnds
    ? { amount: 129900, label: 'Early-bird seat (pay by 22 Nov)' }
    : { amount: 149900, label: 'Regular seat' };
}

const PRODUCTS = {
  'sprint-remote': {
    name: 'Remote 7-Day Growth Sprint',
    description: 'Fixed 7-day engagement · calls + WhatsApp support',
    price: () => ({ amount: 500000, label: 'Fixed fee' })
  },
  'sprint-onsite': {
    name: 'On-Site 7-Day Growth Sprint (Jaipur)',
    description: 'Fixed 7-day engagement · includes one on-site visit in Jaipur',
    price: () => ({ amount: 1000000, label: 'Fixed fee' })
  },
  'sur-samvad': {
    name: 'Sur & Samvad — Founders’ Private Table (29 Nov 2026)',
    description: 'One seat · brunch included · for invited founders only',
    price: surSamvadPrice
  }
};

function getProduct(id, now) {
  const p = PRODUCTS[id];
  if (!p) return null;
  const { amount, label } = p.price(now);
  return { id, name: p.name, description: p.description, amount, priceLabel: label };
}

function listProducts(now) {
  return Object.keys(PRODUCTS).map(id => getProduct(id, now));
}

module.exports = { getProduct, listProducts };
