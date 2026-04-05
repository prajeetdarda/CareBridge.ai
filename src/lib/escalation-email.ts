import nodemailer from "nodemailer";
import type { BackupContact, UrgencyLevel } from "./types";

type EscalationRecipient = {
  name?: string;
  email: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

function dedupeRecipients(recipients: EscalationRecipient[]): EscalationRecipient[] {
  const seen = new Set<string>();
  const output: EscalationRecipient[] = [];
  for (const recipient of recipients) {
    const key = recipient.email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(recipient);
  }
  return output;
}

export function extractEscalationRecipients(
  contacts: BackupContact[]
): EscalationRecipient[] {
  const recipients: EscalationRecipient[] = [];

  for (const contact of contacts) {
    const explicitEmail = contact.email?.trim();
    if (explicitEmail && isValidEmail(explicitEmail)) {
      recipients.push({
        name: contact.name?.trim() || undefined,
        email: explicitEmail,
      });
      continue;
    }

    const fallbackEmail = contact.contactInfo?.trim();
    if (fallbackEmail && isValidEmail(fallbackEmail)) {
      recipients.push({
        name: contact.name?.trim() || undefined,
        email: fallbackEmail,
      });
    }
  }

  return dedupeRecipients(recipients);
}

export async function sendUrgentEscalationEmails(args: {
  recipients: EscalationRecipient[];
  lovedOneName: string;
  familyMemberName: string;
  reason: string;
  urgencyLevel: UrgencyLevel;
  timestampIso: string;
  sessionId: string;
}): Promise<{ sentCount: number; provider: "gmail" | "none" }> {
  if (args.recipients.length === 0) {
    return { sentCount: 0, provider: "none" };
  }

  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim();
  if (!gmailUser || !gmailPass) {
    console.warn("[escalation-email] Missing GMAIL_USER or GMAIL_APP_PASSWORD.");
    return { sentCount: 0, provider: "none" };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  const subject = `Urgent Care Alert: ${args.lovedOneName}`;
  const localTime = new Date(args.timestampIso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 520px;">
      <h2 style="color: #e11d48; margin: 0 0 16px;">Urgent Care Escalation</h2>
      <p style="margin: 0 0 8px;">
        CareBridge AI flagged an <strong style="color: #e11d48;">${args.urgencyLevel.replace("_", " ")}</strong> concern for
        <strong>${args.lovedOneName}</strong>.
      </p>
      <table style="border-collapse: collapse; margin: 12px 0;">
        <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Reason</td><td style="padding: 4px 0;">${args.reason}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Family member</td><td style="padding: 4px 0;">${args.familyMemberName}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Time</td><td style="padding: 4px 0;">${localTime}</td></tr>
      </table>
      <p style="margin: 16px 0 0; font-size: 12px; color: #6b7280;">
        This is an automated alert from CareBridge AI (Session: ${args.sessionId.slice(0, 8)}…)
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"CareBridge Alerts" <${gmailUser}>`,
    to: args.recipients.map((r) => r.email).join(", "),
    subject,
    html,
  });

  return { sentCount: args.recipients.length, provider: "gmail" };
}
