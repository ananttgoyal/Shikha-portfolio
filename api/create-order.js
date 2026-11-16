const {normalizePhone,parseBody} = require('../lib/lead-utils');
const {PLANS,POLICY_VERSION,originAllowed,keys,razorpay} = require('../lib/razorpay');

const clean = (x,n=120) => String(x == null ? '' : x).replace(/[\r\n\t]+/g,' ').trim().slice(0,n);
const emailOk = s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const gstinOk = s => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(s);

module.exports=async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false,error:'Method not allowed'});}
  if(!originAllowed(req.headers.origin))return res.status(403).json({ok:false,error:'Origin not allowed'});
  if(Number(req.headers['content-length']||0)>8000)return res.status(413).json({ok:false,error:'Request too large'});
  const creds=keys();
  if(!creds)return res.status(503).json({ok:false,error:'Online payment is temporarily unavailable.'});
  let body;
  try{body=parseBody(req);}catch{return res.status(400).json({ok:false,error:'Invalid request'});}
  if(!body||typeof body!=='object')return res.status(400).json({ok:false,error:'Invalid request'});
  const planId=clean(body.plan,40);
  const plan=PLANS[planId];
  if(!plan)return res.status(400).json({ok:false,error:'Unknown plan.'});
  if(!Number.isInteger(plan.amount)||plan.amount<100)return res.status(400).json({ok:false,error:'Amount must be at least ₹1 (100 paise).'});

  const name=clean(body.name,100);
  const email=clean(body.email,180).toLowerCase();
  const phone=normalizePhone(body.phone);
  const business=clean(body.business,150);
  const city=clean(body.city,80);
  const gstin=clean(body.gstin,15).toUpperCase();
  const agreed=body.agreeTerms===true||body.agreeTerms==='true';
  if(!name||!emailOk(email)||!phone||!business||!city)return res.status(400).json({ok:false,error:'Please enter your name, email, 10-digit mobile number, business name and city.'});
  if(gstin&&!gstinOk(gstin))return res.status(400).json({ok:false,error:'Please enter a valid 15-character GSTIN, or leave it blank.'});
  if(!agreed)return res.status(400).json({ok:false,error:'Please accept the Terms and the Refund & Cancellation Policy to continue.'});

  const receipt=('ss_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)).slice(0,40);
  // Razorpay keeps these notes with the order; verify-payment reads them back
  // from Razorpay (not from the browser) to send the receipt emails.
  const notes={plan:planId,product:plan.name,name,email,phone,business,city,gstin:gstin||'-',policy_version:POLICY_VERSION,agreed_at:new Date().toISOString()};
  let r;
  try{r=await razorpay(creds,'POST','/orders',{amount:plan.amount,currency:plan.currency,receipt,notes});}
  catch(e){console.error('Razorpay order request failed',e);return res.status(500).json({ok:false,error:'Could not start payment. Please try again.'});}
  if(r.status===401){console.error('Razorpay authentication failed — check RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET');return res.status(401).json({ok:false,error:'Payment gateway authentication failed.'});}
  if(!r.ok||!r.result.id){console.error('Razorpay order error',r.status,r.result&&r.result.error);return res.status(500).json({ok:false,error:'Could not start payment. Please try again.'});}
  // key_id is public by design (Checkout needs it); the secret stays on the server.
  return res.status(200).json({ok:true,order_id:r.result.id,amount:r.result.amount,currency:r.result.currency,key_id:creds.keyId,name:plan.name,prefill:{name,email,contact:'+91'+phone}});
};
