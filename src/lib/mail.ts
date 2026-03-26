import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;

/**
 * Sends an email using SMTP.
 */
export async function sendEmail({
  displayName,
  to,
  subject,
  text,
  html,
  attachments,
}: {
  displayName: string;
  to: string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
  }>;
}) {
  if (!smtpHost || !smtpUser || !smtpPassword) {
    throw new Error('[SMTP] Missing configuration: SMTP_HOST, SMTP_USER, SMTP_PASSWORD are required.');
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });

  const mailOptions = {
    from: `"${displayName}" <${smtpUser}>`,
    to: to.join(', '),
    subject,
    text,
    html,
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[SMTP] Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[SMTP] ERROR:', error.message);
    throw error;
  }
}
