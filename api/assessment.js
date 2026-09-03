const FROM = 'Aanant Goyal | Shikha Solutions <hello@shikhasolutions.com>';
const OWNER = 'shikhasolutionsin@gmail.com';
const ALLOWED_ORIGIN = 'https://www.shikhasolutions.com';
const ALLOWED_CATEGORIES = new Set(['Founder Dependency','People & Accountability','Process & Operations','Sales & Customer Growth','Numbers & Business Visibility','Execution & Improvement']);

function clean(value, max = 200) { return String(value || '').trim().slice(0, max); }
function escapeHtml(value) { return clean(value, 1000).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function validScore(value) { const n=Number(value); return Number.isFinite(n)&&n>=0&&n<=100?Math.round(n):null; }
function scoreStatus(score) { if(score>=80)return 'Strong'; if(score>=60)return 'Needs Optimization'; if(score>=40)return 'Growth Constraint'; return 'Priority Risk'; }
function descriptor(score) { if(score>=80)return 'Strong Business Foundation'; if(score>=60)return 'Growth Friction'; if(score>=40)return 'Founder-Dependent Business'; return 'Business Foundation Needs Attention'; }

async function send(apiKey,payload){
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(result.message||'Email delivery failed');
  return result;
}

module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false,error:'Method not allowed'});}
  const origin=req.headers.origin;if(origin&&origin!==ALLOWED_ORIGIN)return res.status(403).json({ok:false,error:'Origin not allowed'});
  const apiKey=process.env.RESEND_API_KEY;if(!apiKey)return res.status(503).json({ok:false,error:'Email service is not configured.'});
  let body;try{body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});}catch{return res.status(400).json({ok:false,error:'Invalid request.'});}
  if(clean(body.website))return res.status(200).json({ok:true});
  const name=clean(body.name,100),email=clean(body.email,180).toLowerCase(),phone=clean(body.phone,40),company=clean(body.company,140),stage=clean(body.stage,120),consent=body.consent===true||body.consent==='true',overall=validScore(body.overall);
  const categories=Array.isArray(body.categories)?body.categories.map(x=>({cat:clean(x&&x.cat,80),score:validScore(x&&x.score)})).filter(x=>ALLOWED_CATEGORIES.has(x.cat)&&x.score!==null).slice(0,6):[];
  const topGaps=Array.isArray(body.topGaps)?body.topGaps.map(x=>({cat:clean(x&&x.cat,80),score:validScore(x&&x.score)})).filter(x=>ALLOWED_CATEGORIES.has(x.cat)&&x.score!==null).slice(0,3):[];
  const alerts=Array.isArray(body.alerts)?body.alerts.map(x=>clean(x,100)).filter(Boolean).slice(0,4):[];
  if(!name||!validEmail(email)||!phone||!company||!stage||!consent||overall===null||categories.length!==6||topGaps.length<1)return res.status(400).json({ok:false,error:'Please complete all required fields.'});
  const safe={name:escapeHtml(name),email:escapeHtml(email),phone:escapeHtml(phone),company:escapeHtml(company),stage:escapeHtml(stage)};
  const categoryRows=categories.map(x=>`<tr><td style="padding:9px 10px;border-bottom:1px solid #e4d9c9;">${escapeHtml(x.cat)}</td><td style="padding:9px 10px;border-bottom:1px solid #e4d9c9;text-align:right;font-weight:bold;">${x.score}/100 · ${scoreStatus(x.score)}</td></tr>`).join('');
  const gapRows=topGaps.map((x,i)=>`<li style="margin:8px 0;"><strong>#${i+1} ${escapeHtml(x.cat)}</strong> — ${x.score}/100</li>`).join('');
  const alertRows=alerts.length?`<h2 style="color:#061A33;font-family:Georgia,serif;font-size:20px;">Important alerts</h2><ul>${alerts.map(x=>`<li style="margin:8px 0;">${escapeHtml(x)}</li>`).join('')}</ul>`:'';
  const report=`<!DOCTYPE html><html><body style="margin:0;background:#F7F3EC;font-family:Arial,Helvetica,sans-serif;color:#20252C;"><table width="100%" cellpadding="0" cellspacing="0" bgcolor="#F7F3EC"><tr><td align="center" style="padding:24px;"><table width="620" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="width:100%;max-width:620px;border-top:6px solid #C98A16;"><tr><td bgcolor="#061A33" style="padding:28px 30px;"><p style="margin:0 0 7px;color:#E2AA43;font-size:12px;font-weight:bold;letter-spacing:1px;">SHIKHA SOLUTIONS</p><h1 style="margin:0;color:#FFFFFF;font-family:Georgia,serif;font-size:28px;">Your Business Health Result</h1></td></tr><tr><td style="padding:28px 30px;font-size:14px;line-height:1.65;"><p>Hello ${safe.name},</p><p>Your overall Business Health Score is:</p><p style="font-size:34px;color:#C98A16;font-weight:bold;margin:8px 0;">${overall}/100</p><h2 style="color:#061A33;font-family:Georgia,serif;">${descriptor(overall)}</h2><h2 style="color:#061A33;font-family:Georgia,serif;font-size:20px;">Six category scores</h2><table width="100%" cellpadding="0" cellspacing="0">${categoryRows}</table><h2 style="color:#061A33;font-family:Georgia,serif;font-size:20px;">Your top three gaps</h2><ol style="padding-left:20px;">${gapRows}</ol>${alertRows}<p style="margin-top:26px;"><a href="https://calendar.app.google/due6sDbM5aywr4Uu8" style="display:inline-block;background:#061A33;color:#FFFFFF;text-decoration:none;font-weight:bold;padding:12px 18px;border-radius:5px;">Book a Business Health Call →</a></p><p style="font-size:12px;color:#65707b;margin-top:24px;">This is a research-informed business diagnostic, not an audit or certification.</p></td></tr></table></td></tr></table></body></html>`;
  try{
    await send(apiKey,{from:FROM,to:[email],reply_to:OWNER,subject:`Your Shikha Solutions Business Health Result: ${overall}/100`,html:report,tags:[{name:'source',value:'business-health-assessment'}]});
    await send(apiKey,{from:FROM,to:[OWNER],reply_to:email,subject:`New assessment lead: ${name} · ${company} · ${overall}/100`,html:`<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#20252C;"><h1>New Business Health Assessment lead</h1><p><strong>Name:</strong> ${safe.name}</p><p><strong>Email:</strong> ${safe.email}</p><p><strong>Phone:</strong> ${safe.phone}</p><p><strong>Company:</strong> ${safe.company}</p><p><strong>Business stage:</strong> ${safe.stage}</p><p><strong>Overall score:</strong> ${overall}/100 · ${descriptor(overall)}</p><h2>Top gaps</h2><ol>${gapRows}</ol>${alertRows}</body></html>`,text:`New Business Health Assessment lead\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nCompany: ${company}\nBusiness stage: ${stage}\nOverall score: ${overall}/100\nTop gaps: ${topGaps.map(x=>`${x.cat} ${x.score}/100`).join(', ')}\nAlerts: ${alerts.join(', ')||'None'}`,tags:[{name:'source',value:'business-health-assessment-owner'}]});
    return res.status(200).json({ok:true});
  }catch(error){console.error('Assessment email error',error);return res.status(502).json({ok:false,error:'Unable to email your result right now. Please try again.'});}
};
