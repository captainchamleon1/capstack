import {
  appUrl,
  documentSentEmailHtml,
  documentSignedEmailHtml,
  inviteEmailHtml,
  passwordResetEmailHtml,
} from "./templates";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  ok: boolean;
  provider: string;
  messageId?: string;
  error?: string;
}

export class EmailNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailNotConfiguredError";
  }
}

export function getEmailProvider() {
  return process.env.EMAIL_PROVIDER ?? "console";
}

export function isProductionEmailConfigured(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return getEmailProvider() === "resend" && Boolean(process.env.RESEND_API_KEY?.trim());
}

export function getProductionEmailConfigError(): string | null {
  if (process.env.NODE_ENV !== "production") return null;
  if (getEmailProvider() !== "resend") {
    return "EMAIL_PROVIDER must be set to \"resend\" in production.";
  }
  if (!process.env.RESEND_API_KEY?.trim()) {
    return "RESEND_API_KEY is required in production.";
  }
  return null;
}

function assertProductionEmailReady() {
  const configError = getProductionEmailConfigError();
  if (configError) {
    throw new EmailNotConfiguredError(configError);
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function sendViaResend(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Equitr <onboarding@resend.dev>";

  if (!apiKey) {
    return sendViaConsole(input);
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text ?? stripHtml(input.html),
      }),
    });

    const data = (await res.json()) as { id?: string; message?: string };
    if (!res.ok) {
      console.error("[email] Resend error:", data);
      return { ok: false, provider: "resend", error: data.message ?? "Send failed" };
    }

    return { ok: true, provider: "resend", messageId: data.id };
  } catch (error) {
    console.error("[email] Resend request failed:", error);
    return { ok: false, provider: "resend", error: "Network error" };
  }
}

async function sendViaConsole(input: SendEmailInput): Promise<SendEmailResult> {
  console.log("\n--- Equitr Email (console) ---");
  console.log("To:", input.to);
  console.log("Subject:", input.subject);
  console.log("Text:", input.text ?? stripHtml(input.html));
  console.log("--------------------------------\n");
  return { ok: true, provider: "console", messageId: `console-${Date.now()}` };
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  assertProductionEmailReady();

  const provider = getEmailProvider();

  if (provider === "resend") {
    return sendViaResend(input);
  }

  return sendViaConsole(input);
}

export async function sendInviteEmail(params: {
  to: string;
  companyName: string;
  inviterName: string;
  role: string;
  token: string;
}) {
  const inviteUrl = appUrl(`/invite/${params.token}`);
  return sendEmail({
    to: params.to,
    subject: `You're invited to ${params.companyName} on Equitr`,
    html: inviteEmailHtml({
      companyName: params.companyName,
      inviterName: params.inviterName,
      role: params.role,
      inviteUrl,
    }),
    text: `${params.inviterName} invited you to join ${params.companyName} on Equitr as ${params.role}. Accept: ${inviteUrl}`,
  });
}

export async function sendDocumentSentEmail(params: {
  to: string;
  companyName: string;
  documentName: string;
  recipientName: string;
}) {
  return sendEmail({
    to: params.to,
    subject: `Document ready for signature — ${params.documentName}`,
    html: documentSentEmailHtml(params),
    text: `${params.documentName} from ${params.companyName} has been sent to ${params.recipientName} for signature.`,
  });
}

export async function sendDocumentSignedEmail(params: {
  to: string;
  companyName: string;
  documentName: string;
  signedByName: string;
  stakeholderName?: string;
}) {
  return sendEmail({
    to: params.to,
    subject: `Document signed — ${params.documentName}`,
    html: documentSignedEmailHtml(params),
    text: `${params.documentName} was marked signed by ${params.signedByName}.`,
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  token: string;
}) {
  const resetUrl = appUrl(`/reset-password?token=${encodeURIComponent(params.token)}`);
  return sendEmail({
    to: params.to,
    subject: "Reset your Equitr password",
    html: passwordResetEmailHtml({ name: params.name, resetUrl }),
    text: `Reset your Equitr password: ${resetUrl}`,
  });
}

export async function notifyCompanyAdminsDocumentSigned(params: {
  companyId: string;
  companyName: string;
  documentName: string;
  signedByName: string;
  stakeholderName?: string;
  excludeUserId?: string;
}) {
  const { prisma } = await import("@/lib/prisma");
  const admins = await prisma.membership.findMany({
    where: {
      companyId: params.companyId,
      role: { in: ["owner", "admin"] },
      userId: params.excludeUserId ? { not: params.excludeUserId } : undefined,
    },
    include: { user: { select: { email: true } } },
  });

  const results = await Promise.all(
    admins.map((m) =>
      sendDocumentSignedEmail({
        to: m.user.email,
        companyName: params.companyName,
        documentName: params.documentName,
        signedByName: params.signedByName,
        stakeholderName: params.stakeholderName,
      })
    )
  );

  return results;
}
