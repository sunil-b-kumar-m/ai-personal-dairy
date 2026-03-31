function layout(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 32px 32px 0; text-align: center;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #111827;">AI Personal Diary</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px 32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">This email was sent by AI Personal Diary. If you didn't request this, you can safely ignore it.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function button(text: string, url: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
    <tr>
      <td align="center">
        <a href="${url}" style="display: inline-block; padding: 12px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">${text}</a>
      </td>
    </tr>
  </table>`;
}

export function welcomeEmailHtml(name: string): string {
  return layout(`
    <h2 style="margin: 0 0 16px; font-size: 18px; color: #111827;">Welcome, ${name}!</h2>
    <p style="margin: 0 0 8px; font-size: 14px; color: #4b5563; line-height: 1.5;">Your account has been created successfully. You can start writing diary entries right away.</p>
    <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.5;">Please verify your email address to get the most out of your account.</p>
  `);
}

export function verificationEmailHtml(name: string, verifyUrl: string): string {
  return layout(`
    <h2 style="margin: 0 0 16px; font-size: 18px; color: #111827;">Verify your email</h2>
    <p style="margin: 0 0 8px; font-size: 14px; color: #4b5563; line-height: 1.5;">Hi ${name}, please click the button below to verify your email address.</p>
    ${button("Verify Email", verifyUrl)}
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
  `);
}

export function inviteEmailHtml(inviterName: string, inviteUrl: string, roleName?: string): string {
  const roleText = roleName ? ` as a <strong>${roleName}</strong>` : "";
  return layout(`
    <h2 style="margin: 0 0 16px; font-size: 18px; color: #111827;">You're invited!</h2>
    <p style="margin: 0 0 8px; font-size: 14px; color: #4b5563; line-height: 1.5;">${inviterName} has invited you to join AI Personal Diary${roleText}.</p>
    ${button("Accept Invite", inviteUrl)}
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">This invite expires in 7 days.</p>
  `);
}
