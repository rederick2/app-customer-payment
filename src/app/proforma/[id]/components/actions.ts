'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { renderToBuffer } from '@react-pdf/renderer';
import ProformaPDF from '@/lib/pdf/ProformaPDF';
import React from 'react';

// Initialize resend only if the API key exists
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendProformaEmail(proformaId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado' };
  }

  const to = formData.get('to') as string;
  const subject = formData.get('subject') as string;
  const message = formData.get('message') as string;

  if (!to || !subject || !message) {
    return { error: 'Por favor completa todos los campos requeridos.' };
  }

  // 1. Fetch full proforma data for the PDF
  const { data: proforma, error: pError } = await supabase
    .from('proformas')
    .select('*, clients(*)')
    .eq('id', proformaId)
    .single();

  if (pError || !proforma) {
    return { error: 'No se pudo cargar la información de la proforma.' };
  }

  const { data: items } = await supabase
    .from('proforma_items')
    .select('*')
    .eq('proforma_id', proformaId);

  try {
    // 2. Generate PDF Buffer
    const pdfBuffer = await renderToBuffer(
      React.createElement(ProformaPDF, { 
        proforma, 
        items: items || [], 
        client: proforma.clients 
      })
    );

    // 3. Send via Resend (or mock if no key is provided yet)
    if (resend) {
      const { error: emailError } = await resend.emails.send({
        // For testing free Resend accounts, you must send FROM a verified domain 
        // or onboarding@resend.dev, and TO a verified email
        from: 'EstudioPro <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        text: message,
        html: buildEmailHtml(message, proformaId),
        attachments: [
          {
            filename: `cotizacion_${proformaNumber(proformaId)}.pdf`,
            content: pdfBuffer,
          },
        ],
      });

      if (emailError) {
         console.error('Error sending email:', emailError);
         return { error: 'Ocurrió un error al intentar enviar el correo. Verifica tu cuota o dominio en Resend.' };
      }
    } else {
      console.warn("No RESEND_API_KEY found. Simulating email send and PDF generation.");
      // Simulated delay just for demo purposes if no key
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Actualizar el estado de la proforma a 'sent' si actualmente es 'draft'
    if (proforma.status === 'draft') {
      await supabase
        .from('proformas')
        .update({ status: 'sent' })
        .eq('id', proformaId);
    }

    revalidatePath(`/proforma/${proformaId}`);
    revalidatePath('/page'); 

    return { success: true };

  } catch (err) {
    console.error('PDF Generation or Email Error:', err);
    return { error: 'Error al generar el PDF o enviar el correo.' };
  }
}

function proformaNumber(id: string) {
  return id.split('-')[0].toUpperCase();
}

function buildEmailHtml(message: string, proformaId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const portalUrl = `${baseUrl}/p/${proformaId}`;
  const bodyText = message.replace(/\n/g, '<br/>');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f2ec;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ec;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background:#0d3b47;padding:28px 40px;">
            <p style="margin:0;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:1px;">EstudioPro</p>
            <p style="margin:4px 0 0;font-size:12px;color:#ffffff99;font-family:Arial,sans-serif;">Interior Design &amp; Remodeling</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#333333;font-family:Arial,sans-serif;">${bodyText}</p>

            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" style="margin:32px 0;">
              <tr>
                <td align="center" style="border-radius:6px;background:#306c3e;">
                  <a href="${portalUrl}" target="_blank"
                     style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;letter-spacing:0.5px;border-radius:6px;">
                    View Quote →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:12px;color:#888888;font-family:Arial,sans-serif;">
              Or copy this link into your browser:<br/>
              <a href="${portalUrl}" style="color:#306c3e;word-break:break-all;">${portalUrl}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f4f2ec;padding:20px 40px;border-top:1px solid #e2e0d8;">
            <p style="margin:0;font-size:11px;color:#999999;font-family:Arial,sans-serif;text-align:center;">
              EstudioPro · This email contains a quote prepared exclusively for you.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function updateProformaStatus(proformaId: string, newStatus: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado' };
  }

  const { error } = await supabase
    .from('proformas')
    .update({ status: newStatus })
    .eq('id', proformaId);

  if (error) {
    console.error('Error updating status:', error);
    return { error: 'Error al actualizar el estado.' };
  }

  revalidatePath(`/proforma/${proformaId}`);
  revalidatePath('/page'); 
  return { success: true };
}
