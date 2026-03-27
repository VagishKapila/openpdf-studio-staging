import { Resend } from 'resend';
import { env } from '../../config/env';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

if (resend) {
  console.log(`📧 Email service: configured (API key set, from: ${env.EMAIL_FROM})`);
} else {
  console.warn(`⚠️  Email service: NOT configured (RESEND_API_KEY missing)`);
}

function getEmailClient(): Resend {
  if (!resend) {
    throw new Error('Email service not configured. Set RESEND_API_KEY environment variable.');
  }
  return resend;
}

// ===== EMAIL VERIFICATION =====
export async function sendVerificationEmail(to: string, name: string, token: string) {
  const verifyUrl = `${env.FRONTEND_URL}?verify=${token}`;
  const client = getEmailClient();

  await client.emails.send({
    from: `DocPix Studio <${env.EMAIL_FROM}>`,
    to,
    subject: 'Verify your email — DocPix Studio',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:8px;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="3" fill="white" fill-opacity="0.2"/>
          <path d="M7 8h10M7 12h7M7 16h4" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="17" cy="15" r="3" fill="white" fill-opacity="0.3" stroke="white" stroke-width="1.5"/>
        </svg>
        <span style="color:white;font-size:20px;font-weight:700;letter-spacing:-0.5px;">DocPix Studio</span>
      </div>
    </div>
    <div style="padding:32px 24px;">
      <h1 style="margin:0 0 8px;font-size:22px;color:#18181b;">Verify your email</h1>
      <p style="margin:0 0 24px;color:#71717a;font-size:15px;line-height:1.5;">
        Hi ${name || 'there'}, thanks for signing up! Click the button below to verify your email address and activate your account.
      </p>
      <a href="${verifyUrl}" style="display:inline-block;background:#6366f1;color:white;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:15px;">
        Verify Email Address
      </a>
      <p style="margin:24px 0 0;color:#a1a1aa;font-size:13px;line-height:1.5;">
        This link expires in 24 hours. If you didn't create a DocPix Studio account, you can safely ignore this email.
      </p>
      <hr style="margin:24px 0;border:none;border-top:1px solid #e4e4e7;">
      <p style="margin:0;color:#d4d4d8;font-size:12px;">
        Can't click the button? Copy this link:<br>
        <a href="${verifyUrl}" style="color:#a1a1aa;word-break:break-all;">${verifyUrl}</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  });
}

// ===== PASSWORD RESET =====
export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const resetUrl = `${env.FRONTEND_URL}?reset=${token}`;
  const client = getEmailClient();

  await client.emails.send({
    from: `DocPix Studio <${env.EMAIL_FROM}>`,
    to,
    subject: 'Reset your password — DocPix Studio',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:8px;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="3" fill="white" fill-opacity="0.2"/>
          <path d="M7 8h10M7 12h7M7 16h4" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="17" cy="15" r="3" fill="white" fill-opacity="0.3" stroke="white" stroke-width="1.5"/>
        </svg>
        <span style="color:white;font-size:20px;font-weight:700;letter-spacing:-0.5px;">DocPix Studio</span>
      </div>
    </div>
    <div style="padding:32px 24px;">
      <h1 style="margin:0 0 8px;font-size:22px;color:#18181b;">Reset your password</h1>
      <p style="margin:0 0 24px;color:#71717a;font-size:15px;line-height:1.5;">
        Hi ${name || 'there'}, we received a request to reset your password. Click the button below to choose a new one.
      </p>
      <a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:white;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:15px;">
        Reset Password
      </a>
      <p style="margin:24px 0 0;color:#a1a1aa;font-size:13px;line-height:1.5;">
        This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.
      </p>
      <hr style="margin:24px 0;border:none;border-top:1px solid #e4e4e7;">
      <p style="margin:0;color:#d4d4d8;font-size:12px;">
        Can't click the button? Copy this link:<br>
        <a href="${resetUrl}" style="color:#a1a1aa;word-break:break-all;">${resetUrl}</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  });
}

// ===== GENERIC NOTIFICATION EMAIL =====
export async function sendNotificationEmail(to: string, subject: string, heading: string, bodyText: string, ctaText?: string, ctaUrl?: string) {
  const client = getEmailClient();

  const ctaButton = ctaText && ctaUrl ? `
    <a href="${ctaUrl}" style="display:inline-block;background:#6366f1;color:white;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:15px;">
      ${ctaText}
    </a>` : '';

  await client.emails.send({
    from: `DocPix Studio <${env.EMAIL_FROM}>`,
    to,
    subject,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:8px;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="3" fill="white" fill-opacity="0.2"/>
          <path d="M7 8h10M7 12h7M7 16h4" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="17" cy="15" r="3" fill="white" fill-opacity="0.3" stroke="white" stroke-width="1.5"/>
        </svg>
        <span style="color:white;font-size:20px;font-weight:700;letter-spacing:-0.5px;">DocPix Studio</span>
      </div>
    </div>
    <div style="padding:32px 24px;">
      <h1 style="margin:0 0 8px;font-size:22px;color:#18181b;">${heading}</h1>
      <p style="margin:0 0 24px;color:#71717a;font-size:15px;line-height:1.5;">${bodyText}</p>
      ${ctaButton}
    </div>
  </div>
</body>
</html>`,
  });
}
