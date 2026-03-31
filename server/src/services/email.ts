import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { welcomeEmailHtml, verificationEmailHtml, inviteEmailHtml } from "../templates/email.js";

function createTransport() {
  if (!env.SMTP_HOST) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

const transport = createTransport();

async function sendMail(to: string, subject: string, html: string): Promise<void> {
  if (!transport) {
    console.log(`[Email] (no SMTP configured) To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    await transport.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error(`[Email] Failed to send to ${to}:`, error);
  }
}

export async function sendWelcomeEmail(user: { name: string; email: string }): Promise<void> {
  await sendMail(user.email, "Welcome to AI Personal Diary", welcomeEmailHtml(user.name));
}

export async function sendVerificationEmail(
  user: { name: string; email: string },
  token: string,
): Promise<void> {
  const verifyUrl = `${env.CLIENT_URL}/auth/verify-email?token=${token}`;
  await sendMail(user.email, "Verify your email — AI Personal Diary", verificationEmailHtml(user.name, verifyUrl));
}

export async function sendInviteEmail(
  inviterName: string,
  email: string,
  token: string,
  roleName?: string,
): Promise<void> {
  const inviteUrl = `${env.CLIENT_URL}/auth/invite?token=${token}`;
  await sendMail(email, `${inviterName} invited you to AI Personal Diary`, inviteEmailHtml(inviterName, inviteUrl, roleName));
}
