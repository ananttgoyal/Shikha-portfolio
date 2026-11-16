// Shared Razorpay helpers. Keys come only from environment variables;
// RAZORPAY_KEY_SECRET must never be sent to the browser.
const PROD_ORIGINS = ['https://www.shikhasolutions.com','https://shikhasolutions.com'];
const DEV_ORIGINS = ['http://localhost:3000','http://127.0.0.1:3000'];

// Prices are fixed on the server so a visitor cannot change what they pay.
// Amounts are in paise (₹1 = 100 paise).
const PLANS = {
  'sprint-remote': {amount:500000,currency:'INR',name:'Remote 7-Day Growth Sprint'},
  'sprint-onsite': {amount:1000000,currency:'INR',name:'On-Site 7-Day Growth Sprint (Jaipur)'}
};

function originAllowed(origin){
  if(!origin) return true;
  if(PROD_ORIGINS.includes(origin)) return true;
  return process.env.VERCEL_ENV !== 'production' && DEV_ORIGINS.includes(origin);
}
function keys(){
  const keyId=process.env.RAZORPAY_KEY_ID, keySecret=process.env.RAZORPAY_KEY_SECRET;
  return keyId && keySecret ? {keyId,keySecret} : null;
}
module.exports={PLANS,originAllowed,keys};
