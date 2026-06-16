export function appUrl(path: string): string {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function inviteEmailHtml(params: {
  companyName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
}) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #06080d; color: #eceef3; padding: 32px;">
  <div style="max-width: 520px; margin: 0 auto; background: #131926; border: 1px solid #232b3a; border-radius: 12px; padding: 32px;">
    <p style="color: #c9a962; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 8px;">Equitr</p>
    <h1 style="font-size: 22px; margin: 0 0 16px; color: #eceef3;">You're invited to ${params.companyName}</h1>
    <p style="color: #8b94a8; line-height: 1.6; margin: 0 0 24px;">
      ${params.inviterName} invited you to join <strong style="color: #eceef3;">${params.companyName}</strong> on Equitr as <strong style="color: #eceef3;">${params.role}</strong>.
    </p>
    <a href="${params.inviteUrl}" style="display: inline-block; background: #c9a962; color: #0a0c10; text-decoration: none; font-weight: 600; padding: 12px 24px; border-radius: 8px;">
      Accept Invitation
    </a>
    <p style="color: #5c6578; font-size: 12px; margin-top: 24px; line-height: 1.5;">
      This invite expires in 7 days. If you didn't expect this email, you can ignore it.
    </p>
  </div>
</body>
</html>`;
}

export function passwordResetEmailHtml(params: { name: string; resetUrl: string }) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #06080d; color: #eceef3; padding: 32px;">
  <div style="max-width: 520px; margin: 0 auto; background: #131926; border: 1px solid #232b3a; border-radius: 12px; padding: 32px;">
    <p style="color: #c9a962; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 8px;">Equitr</p>
    <h1 style="font-size: 22px; margin: 0 0 16px; color: #eceef3;">Reset your password</h1>
    <p style="color: #8b94a8; line-height: 1.6; margin: 0 0 24px;">
      Hi ${params.name},<br><br>
      We received a request to reset your Equitr password. Click below to choose a new one. This link expires in 1 hour.
    </p>
    <a href="${params.resetUrl}" style="display: inline-block; background: #c9a962; color: #0a0c10; text-decoration: none; font-weight: 600; padding: 12px 24px; border-radius: 8px;">
      Reset Password
    </a>
    <p style="color: #5c6578; font-size: 12px; margin-top: 24px; line-height: 1.5;">
      If you didn't request this, you can safely ignore this email.
    </p>
  </div>
</body>
</html>`;
}

export function documentSentEmailHtml(params: {
  companyName: string;
  documentName: string;
  recipientName: string;
}) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #06080d; color: #eceef3; padding: 32px;">
  <div style="max-width: 520px; margin: 0 auto; background: #131926; border: 1px solid #232b3a; border-radius: 12px; padding: 32px;">
    <p style="color: #c9a962; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 8px;">Equitr</p>
    <h1 style="font-size: 22px; margin: 0 0 16px;">Document ready for signature</h1>
    <p style="color: #8b94a8; line-height: 1.6;">
      Hi ${params.recipientName},<br><br>
      <strong style="color: #eceef3;">${params.documentName}</strong> from ${params.companyName} has been sent to you for review and signature.
    </p>
    <p style="color: #5c6578; font-size: 12px; margin-top: 24px;">
      Contact your company administrator if you have questions about this document.
    </p>
  </div>
</body>
</html>`;
}

export function documentSignedEmailHtml(params: {
  companyName: string;
  documentName: string;
  signedByName: string;
  stakeholderName?: string;
}) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #06080d; color: #eceef3; padding: 32px;">
  <div style="max-width: 520px; margin: 0 auto; background: #131926; border: 1px solid #232b3a; border-radius: 12px; padding: 32px;">
    <p style="color: #c9a962; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 8px;">Equitr</p>
    <h1 style="font-size: 22px; margin: 0 0 16px;">Document signed</h1>
    <p style="color: #8b94a8; line-height: 1.6;">
      <strong style="color: #eceef3;">${params.documentName}</strong>${params.stakeholderName ? ` for ${params.stakeholderName}` : ""} has been marked as signed by ${params.signedByName}.
    </p>
    <p style="color: #5c6578; font-size: 12px; margin-top: 24px;">
      View the full activity log in Equitr for ${params.companyName}.
    </p>
  </div>
</body>
</html>`;
}
