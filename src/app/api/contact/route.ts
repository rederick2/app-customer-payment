import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email and message are required.' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: parseInt(process.env.SMTP_PORT || '465', 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"${name}" <${process.env.SMTP_USER}>`,
      to: 'rederick2@gmail.com',
      cc: 'alexander_sz@hotmail.com',
      replyTo: email,
      subject: `New contact from ${name} - Quickqi Landing`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #7e3af2;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Name</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Email</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            ${phone ? `<tr>
              <td style="padding: 8px 12px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Phone</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${phone}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Message</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; white-space: pre-wrap;">${message}</td>
            </tr>
          </table>
          <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">Sent from the Quickqi landing page contact form.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send message.' }, { status: 500 });
  }
}
