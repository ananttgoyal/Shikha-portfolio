const crypto = require('crypto');
const {parseBody} = require('../lib/lead-utils');
const {originAllowed,keys} = require('../lib/razorpay');

const field = (b,k) => String((b&&b[k])||'').trim().slice(0,200);

module.exports=async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false,error:'Method not allowed'});}
  if(!originAllowed(req.headers.origin))return res.status(403).json({ok:false,error:'Origin not allowed'});
  const creds=keys();
  if(!creds)return res.status(503).json({ok:false,error:'Payment verification is temporarily unavailable.'});
  let body;
  try{body=parseBody(req);}catch{return res.status(400).json({ok:false,error:'Invalid request'});}
  const orderId=field(body,'razorpay_order_id');
  const paymentId=field(body,'razorpay_payment_id');
  const signature=field(body,'razorpay_signature');
  if(!orderId||!paymentId||!signature)return res.status(400).json({ok:false,error:'Missing payment details.'});
  const expected=crypto.createHmac('sha256',creds.keySecret).update(orderId+'|'+paymentId).digest('hex');
  const a=Buffer.from(expected,'utf8'), b=Buffer.from(signature,'utf8');
  if(a.length!==b.length||!crypto.timingSafeEqual(a,b)){
    console.warn('Razorpay signature mismatch',orderId,paymentId);
    return res.status(400).json({ok:false,error:'Payment could not be verified.'});
  }
  return res.status(200).json({ok:true,verified:true,order_id:orderId,payment_id:paymentId});
};
