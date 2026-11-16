const {parseBody} = require('../lib/lead-utils');
const {PLANS,originAllowed,keys} = require('../lib/razorpay');

module.exports=async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false,error:'Method not allowed'});}
  if(!originAllowed(req.headers.origin))return res.status(403).json({ok:false,error:'Origin not allowed'});
  const creds=keys();
  if(!creds)return res.status(503).json({ok:false,error:'Online payment is temporarily unavailable.'});
  let body;
  try{body=parseBody(req);}catch{return res.status(400).json({ok:false,error:'Invalid request'});}
  const plan=PLANS[String((body&&body.plan)||'')];
  if(!plan)return res.status(400).json({ok:false,error:'Unknown plan.'});
  if(!Number.isInteger(plan.amount)||plan.amount<100)return res.status(400).json({ok:false,error:'Amount must be at least ₹1 (100 paise).'});
  const receipt=('ss_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)).slice(0,40);
  let response,result;
  try{
    response=await fetch('https://api.razorpay.com/v1/orders',{
      method:'POST',
      headers:{Authorization:'Basic '+Buffer.from(creds.keyId+':'+creds.keySecret).toString('base64'),'Content-Type':'application/json'},
      body:JSON.stringify({amount:plan.amount,currency:plan.currency,receipt,notes:{plan:String(body.plan),product:plan.name}})
    });
    result=await response.json().catch(()=>({}));
  }catch(e){console.error('Razorpay order request failed',e);return res.status(500).json({ok:false,error:'Could not start payment. Please try again.'});}
  if(response.status===401){console.error('Razorpay authentication failed — check RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET');return res.status(401).json({ok:false,error:'Payment gateway authentication failed.'});}
  if(!response.ok||!result.id){console.error('Razorpay order error',response.status,result&&result.error);return res.status(500).json({ok:false,error:'Could not start payment. Please try again.'});}
  // key_id is public by design (Checkout needs it); the secret stays on the server.
  return res.status(200).json({ok:true,order_id:result.id,amount:result.amount,currency:result.currency,key_id:creds.keyId,name:plan.name});
};
