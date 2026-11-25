const {normalizePhone,parseBody} = require('../lib/lead-utils');
const ORIGINS = new Set(['https://www.shikhasolutions.com','https://shikhasolutions.com']);
const FROM = 'Sur & Samvad | Shikha Solutions <hello@shikhasolutions.com>';
const OWNER = 'shikhasolutionsin@gmail.com';
const clean = (x,n=250) => String(x == null ? '' : x).replace(/[\r\n\t]+/g,' ').trim().slice(0,n);
const esc = x => String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const emailOk = s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const safe = x => esc(clean(x,2000));
async function send(apiKey, payload) {
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const result=await response.json().catch(()=>({}));
  if(!response.ok) throw Error('Mail delivery failed: '+response.status+' '+String(result.message||''));
}
module.exports=async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false,error:'Method not allowed'});}
  if(req.headers.origin && !ORIGINS.has(req.headers.origin))return res.status(403).json({ok:false,error:'Origin not allowed'});
  if(Number(req.headers['content-length']||0)>16000)return res.status(413).json({ok:false,error:'Request too large'});
  if(!process.env.RESEND_API_KEY)return res.status(503).json({ok:false,error:'Event application email service is temporarily unavailable.'});
  let body;
  try{body=parseBody(req);}catch{return res.status(400).json({ok:false,error:'Invalid request'});}
  if(!body||typeof body!=='object')return res.status(400).json({ok:false,error:'Invalid request'});
  if(clean(body.website))return res.status(200).json({ok:true});
  const name=clean(body.name,100);
  const email=clean(body.email,180).toLowerCase();
  const phone=normalizePhone(body.phone);
  const business=clean(body.business,150);
  const industry=clean(body.industry,90);
  const operating=clean(body.operating,60);
  const team=clean(body.team,50);
  const challenge=clean(body.challenge,1200);
  const contribution=clean(body.contribution,950);
  const source=clean(body.source,80);
  const score=clean(body.growthScore,3);
  const consent=body.consent===true||body.consent==='true';
  const noPitch=body.noPitch===true||body.noPitch==='true';
  if(!name||!emailOk(email)||!phone||!business||!industry||!operating||!team||challenge.length<15||contribution.length<15||!consent||!noPitch) {
    return res.status(400).json({ok:false,error:'Please complete the required fields and agreements.'});
  }
  if(score && (!/^\d{1,3}$/.test(score)||Number(score)>100))return res.status(400).json({ok:false,error:'Growth Score must be between 0 and 100.'});
  const fields=[
    ['Founder',name],['Email',email],['Phone / WhatsApp',phone],['Business',business],
    ['Industry',industry],['Business operating for',operating],['Team size',team],
    ['One real challenge',challenge],['Experience they can share',contribution],
    ['Growth Score (optional, self-reported)',score||'Not supplied'],
    ['How they heard',source||'Not supplied'],['No-pitch commitment','Yes'],
    ['Consent','Event-specific contact consent only']
  ];
  const plain=fields.map(([k,v])=>k+': '+v).join('\n\n');
  const rows=fields.map(([k,v])=>'<tr><td style="padding:10px;border-bottom:1px solid #eee;color:#687083;vertical-align:top;width:190px">'+safe(k)+'</td><td style="padding:10px;border-bottom:1px solid #eee;white-space:pre-wrap">'+safe(v)+'</td></tr>').join('');
  try{
    await send(process.env.RESEND_API_KEY,{
      from:FROM,to:[OWNER],reply_to:email,
      subject:'Sur & Samvad application — '+business+' — '+name,
      html:'<div style="font-family:Arial,sans-serif;max-width:700px;margin:auto"><div style="background:#0b1d36;color:#e6b75c;padding:24px"><h1 style="margin:0">New founder application</h1><p>Sur & Samvad · Sunday 6 December 2026</p></div><table style="border-collapse:collapse;width:100%">'+rows+'</table><p style="font-size:12px;color:#687083">This is an application, not a confirmed seat. Review personally before sending a payment invitation.</p></div>',
      text:plain,tags:[{name:'source',value:'sur-samvad-2026'}]
    });
  }catch(e){console.error('Sur & Samvad owner notification failed',e);return res.status(502).json({ok:false,error:'Could not submit your application. Please retry or contact Shikha Solutions.'});}
  let confirmationSent=true;
  try{
    await send(process.env.RESEND_API_KEY,{
      from:FROM,to:[email],reply_to:OWNER,
      subject:'We received your Sur & Samvad application',
      html:'<div style="font-family:Arial,sans-serif;background:#f7f3ec;padding:24px;color:#172b44"><div style="max-width:620px;margin:auto;background:#fff;padding:30px;border-top:5px solid #b68b51"><h1 style="color:#0b1d36">Thank you, '+safe(name)+'!</h1><p>We have received your application for <strong>Sur & Samvad — The Founders’ Private Table</strong>.</p><p><strong>Sunday, 6 December 2026 · 5:00–8:00 PM · Jaipur.</strong></p><p>We are reviewing applications for 15 curated founder seats. The fixed event price is ₹1,499 per founder. Applying does not confirm a seat or require payment. If selected, we will contact you with the next steps and payment details. The exact venue will be shared privately with selected founders; you may ask about the area before paying.</p><p>While you wait, think about one business challenge you would like practical input on. You may also take the <a href="https://www.shikhasolutions.com/business-health.html">free Business Growth Score</a>, if you wish. It is optional and does not determine eligibility.</p><p><strong>No pitches. No selling. Just meaningful founder conversations.</strong></p><p>Warmly,<br>Aanant Goyal<br>Shikha Solutions</p></div></div>',
      text:'Hi '+name+',\n\nWe received your application for Sur & Samvad on Sunday, 6 December, 5:00–8:00 PM, Jaipur.\n\nThe event price is ₹1,499 per founder. Applying does not confirm a seat or require payment. We review every application and will reach out if selected. Exact venue details are shared privately with selected founders, and you may ask about the location area before payment.\n\nFree Business Growth Score (optional, not an eligibility requirement): https://www.shikhasolutions.com/business-health.html\n\nNo pitches. No selling.\n\nAanant Goyal | Shikha Solutions',
      tags:[{name:'source',value:'sur-samvad-ack'}]
    });
  }catch(e){console.error('Sur & Samvad applicant receipt failed',e);confirmationSent=false;}
  return res.status(200).json({ok:true,confirmationSent});
};
