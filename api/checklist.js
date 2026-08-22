const TEMPLATE_ID = 'e72758b5-0a62-4572-af24-ccfd79b75e13';
const FROM = 'Aanant Goyal | Shikha Solutions <hello@shikhasolutions.com>';
const OWNER = 'shikhasolutionsin@gmail.com';
const ALLOWED_ORIGIN = 'https://www.shikhasolutions.com';

function clean(value, max = 200) {
  return String(value || '').trim().slice(0, max);
}

function escapeHtml(value) {
  return clean(value, 1000)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const origin = req.headers.origin;
  if (origin && origin !== ALLOWED_ORIGIN) {
    return res.status(403).json({ ok: false, error: 'Origin not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ ok: false, code: 'setup_incomplete' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  if (clean(body.website)) {
    return res.status(200).json({ ok: true });
  }

  const name = clean(body.name, 100);
  const email = clean(body.email, 180).toLowerCase();
  const phone = clean(body.phone, 40);
  const stage = clean(body.stage, 120);
  const challenge = clean(body.challenge, 160);
  const consent = body.consent === true || body.consent === 'true';

  if (!name || !validEmail(email) || !stage || !challenge || !consent) {
    return res.status(400).json({ ok: false, error: 'Please complete all required fields.' });
  }

  const safe = {
    name: escapeHtml(name),
    email: escapeHtml(email),
    phone: escapeHtml(phone || 'Not provided'),
    stage: escapeHtml(stage),
    challenge: escapeHtml(challenge)
  };

  try {
    await sendWithResend(apiKey, {
      from: FROM,
      to: [email],
      reply_to: OWNER,
      subject: 'Your Shikha Solutions Business Health Checklist',
      template: {
        id: TEMPLATE_ID,
        variables: { LEAD_NAME: name }
      },
      tags: [{ name: 'source', value: 'website-checklist' }]
    });

    await sendWithResend(apiKey, {
      from: FROM,
      to: [OWNER],
      reply_to: email,
      subject: `New checklist lead: ${name}`,
      html: `<!DOCTYPE html><html><body style="margin:0;background:#F7F3EC;font-family:Arial,Helvetica,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F7F3EC"><tr><td align="center" style="padding:24px;"><table width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="width:100%;max-width:600px;border-top:5px solid #C98A16;"><tr><td bgcolor="#061A33" style="padding:26px 30px;background:#061A33;"><p style="margin:0 0 6px;color:#E2AA43;font-size:12px;font-weight:bold;">NEW WEBSITE LEAD</p><h1 style="margin:0;color:#FFFFFF;font-family:Georgia,serif;font-size:26px;">Business Health Checklist request</h1></td></tr><tr><td style="padding:28px 30px;color:#20252C;font-size:14px;line-height:1.6;"><p><strong>Name:</strong> ${safe.name}</p><p><strong>Email:</strong> <a href="mailto:${safe.email}">${safe.email}</a></p><p><strong>WhatsApp:</strong> ${safe.phone}</p><p><strong>Business stage:</strong> ${safe.stage}</p><p><strong>Biggest growth challenge:</strong> ${safe.challenge}</p><p style="margin-top:24px;"><a href="mailto:${safe.email}" style="display:inline-block;background:#061A33;color:#FFFFFF;text-decoration:none;font-weight:bold;padding:12px 18px;border-radius:5px;">Reply to this lead →</a></p></td></tr></table></td></tr></table></body></html>`,
      text: `New Business Health Checklist request\n\nName: ${name}\nEmail: ${email}\nWhatsApp: ${phone || 'Not provided'}\nBusiness stage: ${stage}\nBiggest growth challenge: ${challenge}`,
      tags: [{ name: 'source', value: 'website-checklist-owner' }]
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Checklist email error', error);
    return res.status(502).json({ ok: false, error: 'Unable to send email right now.' });
  }
};