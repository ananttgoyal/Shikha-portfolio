const crypto = require('crypto');
const {parseBody} = require('../lib/lead-utils');
const {originAllowed,keys,razorpay,rupees} = require('../lib/razorpay');

const FROM = 'Aanant Goyal | Shikha Solutions <hello@shikhasolutions.com>';
const OWNER = 'shikhasolutionsin@gmail.com';
const REPLY_TO = 'anant@shikhasolutions.com';
const field = (b,k) => String((b&&b[k])||'').trim().slice(0,200);
const esc = x => String(x == null ? '' : x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const istTime = unix => new Date(unix*1000).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'})+' IST';

async function send(apiKey,payload){
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json','Idempotency-Key':payload.idempotencyKey},body:JSON.stringify({...payload,idempotencyKey:undefined})});
  const result=await response.json().catch(()=>({}));
  if(!response.ok) throw Error('Mail delivery failed: '+response.status+' '+String(result.message||''));
}
const table = rows => '<table style="border-collapse:collapse;width:100%">'+rows.map(([k,v])=>'<tr><td style="padding:9px 10px;border-bottom:1px solid #eee;color:#687083;vertical-align:top;width:180px">'+esc(k)+'</td><td style="padding:9px 10px;border-bottom:1px solid #eee">'+esc(v)+'</td></tr>').join('')+'</table>';

async function sendEmails(apiKey,{order,payment}){
  const n=order.notes||{};
  const amount=rupees(payment.amount);
  const paidAt=istTime(payment.created_at||Math.floor(Date.now()/1000));
  const method=[payment.method,payment.vpa||payment.bank||payment.wallet||(payment.card&&payment.card.network)].filter(Boolean).join(' · ');
  const receiptRows=[['Service',n.product],['Amount paid',amount+' '+payment.currency],['Payment ID',payment.id],['Order ID',order.id],['Paid on',paidAt],['Payment method',method||'—'],['Billed to',n.name+' · '+n.business+', '+n.city],['GSTIN',n.gstin&&n.gstin!=='-'?n.gstin:'Not provided']];
  const results={owner:false,customer:false};

  try{
    await send(apiKey,{
      idempotencyKey:'owner-'+payment.id,
      from:FROM,to:[OWNER],reply_to:n.email||undefined,
      subject:'💰 Paid: '+n.product+' — '+amount+' — '+(n.business||n.name),
      html:'<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto"><div style="background:#061A33;color:#e6b75c;padding:22px"><h1 style="margin:0;font-size:22px">New online payment received</h1><p style="margin:6px 0 0;color:#fff">'+esc(n.product)+' · '+esc(amount)+'</p></div>'+table([...receiptRows,['Customer',n.name],['Email',n.email],['Phone / WhatsApp','+91 '+n.phone],['Payment status',payment.status],['Terms accepted','Yes — policy version '+(n.policy_version||'?')+' at '+(n.agreed_at||'?')]])+'<p style="font-size:13px;color:#687083">Next: contact the client within 1 working day to schedule Day 0, and issue the invoice. '+(payment.status==='authorized'?'<strong>This payment is only AUTHORIZED — capture it in the Razorpay dashboard or it will be auto-refunded.</strong>':'')+'</p></div>',
      text:'New online payment\n\n'+receiptRows.map(([k,v])=>k+': '+v).join('\n')+'\nCustomer: '+n.name+'\nEmail: '+n.email+'\nPhone: +91 '+n.phone+'\nStatus: '+payment.status,
      tags:[{name:'source',value:'razorpay-payment'}]
    });
    results.owner=true;
  }catch(e){console.error('Payment owner notification failed',e);}

  if(n.email){
    try{
      await send(apiKey,{
        idempotencyKey:'customer-'+payment.id,
        from:FROM,to:[n.email],reply_to:REPLY_TO,
        subject:'Payment received — '+n.product+' ('+amount+')',
        html:'<div style="font-family:Arial,sans-serif;background:#f7f3ec;padding:24px;color:#172b44"><div style="max-width:620px;margin:auto;background:#fff;padding:30px;border-top:5px solid #C98A16"><h1 style="color:#061A33;font-size:24px;margin-top:0">Thank you, '+esc(n.name)+'!</h1><p>We have received your payment for the <strong>'+esc(n.product)+'</strong>. This email is your payment receipt; a tax invoice, where applicable, will follow separately.</p>'+table(receiptRows)+'<h2 style="color:#061A33;font-size:18px;margin-top:26px">What happens next</h2><ol style="padding-left:20px;line-height:1.6"><li>Within <strong>1 working day</strong>, Aanant will call or WhatsApp you on +91 '+esc(n.phone)+' to schedule your Day 0 session.</li><li><strong>Day 0:</strong> we agree the one metric, its baseline and the one lever we will work on.</li><li><strong>Days 1–6:</strong> focused execution support'+(n.plan==='sprint-onsite'?', including one on-site visit in Jaipur':' by call and WhatsApp')+'.</li><li><strong>Day 7:</strong> we measure the result and recommend the next step.</li></ol><p>Need to reschedule or cancel? You can — please read our <a href="https://www.shikhasolutions.com/refund-policy">Refund &amp; Cancellation Policy</a>. Before Day 0 you can cancel for a full refund.</p><p>Questions? Reply to this email or WhatsApp <a href="https://wa.me/917758859995">+91 77588 59995</a>. Please quote your Payment ID.</p><p>Warmly,<br>Aanant Goyal<br>Shikha Solutions<br><span style="color:#687083;font-size:13px">Commercial Space, E Block, Ashadeep Green Avenue, Jagatpura, Jaipur 302017</span></p></div></div>',
        text:'Hi '+n.name+',\n\nWe have received your payment for the '+n.product+'. This is your payment receipt; a tax invoice, where applicable, will follow separately.\n\n'+receiptRows.map(([k,v])=>k+': '+v).join('\n')+'\n\nWhat happens next\n1. Within 1 working day Aanant will call or WhatsApp you to schedule Day 0.\n2. Day 0: agree one metric, its baseline and one lever.\n3. Days 1-6: focused execution support.\n4. Day 7: measure the result and decide the next step.\n\nRefund & Cancellation Policy: https://www.shikhasolutions.com/refund-policy\nQuestions: reply to this email or WhatsApp +91 77588 59995 (quote your Payment ID).\n\nAanant Goyal\nShikha Solutions, Jagatpura, Jaipur 302017',
        tags:[{name:'source',value:'razorpay-receipt'}]
      });
      results.customer=true;
    }catch(e){console.error('Payment receipt email failed',e);}
  }
  return results;
}

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

  // Signature is valid. Read the order and payment from Razorpay itself so the
  // emails use trusted data (customer details, amount, status).
  let emails={owner:false,customer:false};
  try{
    const [o,p]=await Promise.all([razorpay(creds,'GET','/orders/'+encodeURIComponent(orderId)),razorpay(creds,'GET','/payments/'+encodeURIComponent(paymentId))]);
    const order=o.result, payment=p.result;
    if(!o.ok||!p.ok)throw Error('Razorpay lookup failed '+o.status+'/'+p.status);
    if(payment.order_id!==order.id||payment.amount!==order.amount||!['captured','authorized'].includes(payment.status)){
      console.error('Razorpay payment does not match order',{orderId,paymentId,status:payment.status});
      return res.status(400).json({ok:false,error:'Payment could not be verified.'});
    }
    if(process.env.RESEND_API_KEY)emails=await sendEmails(process.env.RESEND_API_KEY,{order,payment});
    else console.error('RESEND_API_KEY missing — payment emails not sent for',paymentId);
  }catch(e){
    // The signature already proves the payment; don't tell the customer it failed.
    console.error('Post-payment lookup/email failed for',paymentId,e);
  }
  return res.status(200).json({ok:true,verified:true,order_id:orderId,payment_id:paymentId,receiptEmailed:emails.customer});
};
