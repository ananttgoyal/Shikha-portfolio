const FROM = 'Aanant Goyal | Shikha Solutions <hello@shikhasolutions.com>';
const OWNER = 'shikhasolutionsin@gmail.com';
const ALLOWED_ORIGINS = new Set(['https://www.shikhasolutions.com', 'https://shikhasolutions.com']);

function clean(value, max = 200) {
  return String(value || '').trim().slice(0, max);
}

function escapeHtml(value, max = 1000) {
  return clean(value, max)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validScore(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 100;
}

async function sendWithResend(apiKey, payload) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.message || 'Email delivery failed');
    error.status = response.status;
    throw error;
  }
  return result;
}

function reportEmail({ name, overall, title, overallText, categories, alerts, businessName, industry }) {
  const rows = categories.map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #E4D9C9;color:#20252C;"><strong>${escapeHtml(item.cat)}</strong></td>
      <td align="right" style="padding:12px 0;border-bottom:1px solid #E4D9C9;color:#061A33;font-weight:bold;">${Number(item.score)}/100</td>
    </tr>`).join('');
  const alertBlock = alerts.length ? `
    <tr><td style="padding-top:24px;"><h2 style="margin:0 0 10px;color:#061A33;font-family:Georgia,serif;font-size:20px;">Important alerts</h2>${alerts.map(a => `<div style="margin:8px 0;padding:12px 14px;background:#FFF7F5;border-left:4px solid #9B4B3F;color:#5A3230;"><strong>${escapeHtml(a)}</strong></div>`).join('')}</td></tr>` : '';
  return `<!doctype html><html><body style="margin:0;background:#F7F3EC;font-family:Arial,Helvetica,sans-serif;color:#20252C;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F7F3EC"><tr><td align="center" style="padding:24px;">
  <table width="640" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="width:100%;max-width:640px;border-top:5px solid #C98A16;">
    <tr><td bgcolor="#061A33" style="padding:28px 30px;background:#061A33;">
      <p style="margin:0 0 7px;color:#E2AA43;font-size:12px;font-weight:bold;letter-spacing:.08em;">SHIKHA SOLUTIONS BUSINESS HEALTH REPORT</p>
      <h1 style="margin:0;color:#FFFFFF;font-family:Georgia,serif;font-size:28px;">Your score: ${Number(overall)}/100</h1>
    </td></tr>
    <tr><td style="padding:28px 30px;">
      <p style="margin-top:0;">Hi ${escapeHtml(name)},</p>
      <p>Thank you for completing the Shikha Solutions Business Health Assessment for <strong>${escapeHtml(businessName)}</strong>${industry ? ` in <strong>${escapeHtml(industry)}</strong>` : ''}.</p>
      <div style="padding:18px;background:#FBF5E8;border-left:5px solid #C98A16;margin:22px 0;">
        <div style="color:#A96F0B;font-size:12px;font-weight:bold;letter-spacing:.08em;">YOUR BUSINESS HEALTH</div>
        <h2 style="margin:6px 0;color:#061A33;font-family:Georgia,serif;">${escapeHtml(title)}</h2>
        <p style="margin:0;color:#5A5A5A;line-height:1.6;">${escapeHtml(overallText, 1500)}</p>
      </div>
      <h2 style="margin:26px 0 6px;color:#061A33;font-family:Georgia,serif;font-size:20px;">Your three section scores</h2>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
      <div style="margin-top:24px;padding:18px;background:#F7F3EC;border-radius:6px;">
        <div style="color:#A96F0B;font-size:12px;font-weight:bold;letter-spacing:.08em;">FIRST PRIORITY</div>
        <h2 style="margin:6px 0;color:#061A33;font-family:Georgia,serif;">${escapeHtml(categories[0]?.cat || '')}</h2>
        <p style="margin:0;color:#5A5A5A;">Score: ${Number(categories[0]?.score || 0)}/100. Start here before adding more tools, people or complexity.</p>
      </div>
      ${alertBlock}
      <div style="margin-top:28px;padding:22px;background:#061A33;color:#FFFFFF;border-radius:6px;">
        <h2 style="margin:0 0 8px;font-family:Georgia,serif;color:#FFFFFF;">Want to understand what is causing the gap?</h2>
        <p style="margin:0 0 16px;color:#D7DDE4;line-height:1.6;">Bring this report to a Business Health Call and we can discuss what to fix first.</p>
        <a href="https://calendar.app.google/due6sDbM5aywr4Uu8" style="display:inline-block;background:#C98A16;color:#061A33;text-decoration:none;font-weight:bold;padding:12px 18px;border-radius:5px;">Book a Business Health Call →</a>
      </div>
      <p style="margin:24px 0 0;color:#6D7680;font-size:12px;line-height:1.5;">This assessment is a directional diagnostic and not a financial, legal or professional audit. Keep this email for future reference.</p>
    </td></tr>
  </table></td></tr></table></body></html>`;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return res.status(403).json({ ok: false, error: 'Origin not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ ok: false, code: 'setup_incomplete', error: 'Email service is not configured.' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid request.' });
  }

  if (clean(body.website)) return res.status(200).json({ ok: true });

  const name = clean(body.name, 100);
  const email = clean(body.email, 180).toLowerCase();
  const phone = clean(body.phone, 40);
  const businessName = clean(body.businessName, 160);
  const industry = clean(body.industry, 160);
  const consent = body.consent === true || body.consent === 'true';
  const overall = Number(body.overall);
  const title = clean(body.title, 120);
  const overallText = clean(body.overallText, 1500);
  const categories = Array.isArray(body.categories) ? body.categories.slice(0, 3).map(item => ({ cat: clean(item.cat, 100), score: Number(item.score) })) : [];
  const alerts = Array.isArray(body.alerts) ? body.alerts.slice(0, 6).map(a => clean(a, 120)).filter(Boolean) : [];

  if (!name || !validEmail(email) || !phone || !businessName || !industry || !consent || !validScore(overall) || categories.length !== 3 || categories.some(c => !c.cat || !validScore(c.score))) {
    return res.status(400).json({ ok: false, error: 'Please complete all required fields.' });
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone);
  const safeBusiness = escapeHtml(businessName);
  const safeIndustry = escapeHtml(industry);
  const safeTitle = escapeHtml(title);
  const categoryText = categories.map(c => `${c.cat}: ${c.score}/100`).join('\n');
  const alertText = alerts.length ? alerts.join(', ') : 'None';

  try {
    await sendWithResend(apiKey, {
      from: FROM,
      to: [email],
      reply_to: OWNER,
      subject: `Your Shikha Solutions Business Health Report — ${overall}/100`,
      html: reportEmail({ name, overall, title, overallText, categories, alerts, businessName, industry }),
      text: `Hi ${name},\n\nYour Shikha Solutions Business Health Score is ${overall}/100 — ${title}.\n\nBusiness: ${businessName}\nIndustry: ${industry}\n\n${categoryText}\n\nFirst priority: ${categories[0].cat} (${categories[0].score}/100)\nAlerts: ${alertText}\n\nBook a Business Health Call: https://calendar.app.google/due6sDbM5aywr4Uu8\n\nKeep this email for future reference.`,
      tags: [{ name: 'source', value: 'business-health-report' }]
    });

    await sendWithResend(apiKey, {
      from: FROM,
      to: [OWNER],
      reply_to: email,
      subject: `New Business Health Lead — ${businessName} — ${overall}/100`,
      html: `<!doctype html><html><body style="margin:0;background:#F7F3EC;font-family:Arial,Helvetica,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:24px;"><table width="640" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="width:100%;max-width:640px;border-top:5px solid #C98A16;"><tr><td bgcolor="#061A33" style="padding:26px 30px;"><p style="margin:0 0 6px;color:#E2AA43;font-size:12px;font-weight:bold;">NEW BUSINESS HEALTH LEAD</p><h1 style="margin:0;color:#FFFFFF;font-family:Georgia,serif;font-size:25px;">${safeBusiness} — ${overall}/100</h1></td></tr><tr><td style="padding:28px 30px;color:#20252C;font-size:14px;line-height:1.6;"><p><strong>Name:</strong> ${safeName}</p><p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p><p><strong>Phone / WhatsApp:</strong> ${safePhone}</p><p><strong>Business:</strong> ${safeBusiness}</p><p><strong>Industry:</strong> ${safeIndustry}</p><p><strong>Overall score:</strong> ${overall}/100 — ${safeTitle}</p><h2 style="color:#061A33;font-family:Georgia,serif;font-size:19px;margin-top:24px;">Section scores</h2>${categories.map(c => `<p><strong>${escapeHtml(c.cat)}:</strong> ${c.score}/100</p>`).join('')}<p><strong>First priority:</strong> ${escapeHtml(categories[0].cat)} (${categories[0].score}/100)</p><p><strong>Alerts:</strong> ${escapeHtml(alertText, 700)}</p><p style="margin-top:24px;"><a href="mailto:${safeEmail}" style="display:inline-block;background:#061A33;color:#FFFFFF;text-decoration:none;font-weight:bold;padding:12px 18px;border-radius:5px;">Reply to this lead →</a></p></td></tr></table></td></tr></table></body></html>`,
      text: `New Business Health Lead\n\nName: ${name}\nEmail: ${email}\nPhone / WhatsApp: ${phone}\nBusiness: ${businessName}\nIndustry: ${industry}\nOverall score: ${overall}/100 — ${title}\n\n${categoryText}\n\nFirst priority: ${categories[0].cat} (${categories[0].score}/100)\nAlerts: ${alertText}`,
      tags: [{ name: 'source', value: 'business-health-owner' }]
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Business health email error', error);
    return res.status(502).json({ ok: false, error: 'Unable to email your report right now. Please try again.' });
  }
};