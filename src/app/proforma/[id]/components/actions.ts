'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer';
import ProformaPDF from '@/lib/pdf/ProformaPDF';
import MaterialsPDF from '@/lib/pdf/MaterialsPDF';
import InvoicePDF from '@/lib/pdf/InvoicePDF';
import PaymentPDF from '@/lib/pdf/PaymentPDF';
import { sendEmail } from '@/lib/mail';
import React from 'react';

async function logStatusChange(proformaId: string, newStatus: string, oldStatus?: string, userId?: string) {
  const supabase = await createClient(); // This is fine for internal server-side calls if authenticated
  // Or use admin client if we want to ensure it works even for complex flows
  
  await supabase
    .from('proforma_status_history')
    .insert({
      proforma_id: proformaId,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: userId
    });
}

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
    .select('*,users(display_name,terms_conditions), clients(*), applied_taxes:users (taxes (*))')
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
      }) as React.ReactElement<DocumentProps>
    );

    // 3. Send via SMTP
    const { success } = await sendEmail({
      displayName: proforma.users?.display_name,
      to: [to],
      subject: subject,
      text: message,
      html: buildEmailHtml(message, proformaId),
      attachments: [
        {
          filename: `cotizacion_${String(proforma.number || proforma.id.split('-')[0]).toUpperCase()}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (!success) {
      return { error: 'Ocurrió un error al intentar enviar el correo vía SMTP.' };
    }

    // Actualizar el estado de la proforma a 'sent' si actualmente es 'draft'
    if (proforma.status === 'draft') {
      await supabase
        .from('proformas')
        .update({ status: 'sent' })
        .eq('id', proformaId);
      
      await logStatusChange(proformaId, 'sent', 'draft', user.id);
    }

    revalidatePath(`/proforma/${proformaId}`);
    revalidatePath('/page');

    return { success: true };

  } catch (err: any) {
    console.error('PDF Generation or SMTP Email Error:', err);
    return { error: `Error al enviar el correo: ${err.message}` };
  }
}

// Helper removed as we now handle it inline or could use a better one if needed elsewhere.
// But for now, inline is fine to avoid confusion with types.

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

  const updatePayload: any = { status: newStatus };
  if (newStatus === 'approved') {
    updatePayload.approved_at = new Date().toISOString();
  }

  const { data: proforma } = await supabase
    .from('proformas')
    .select('status')
    .eq('id', proformaId)
    .single();

  const { error } = await supabase
    .from('proformas')
    .update(updatePayload)
    .eq('id', proformaId);

  if (error) {
    console.error('Error updating status:', error);
    return { error: 'Error al actualizar el estado.' };
  }

  await logStatusChange(proformaId, newStatus, proforma?.status, user.id);

  revalidatePath(`/proforma/${proformaId}`);
  revalidatePath('/page');
  return { success: true };
}

export async function getProformaStatusHistory(proformaId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('proforma_status_history')
    .select(`
      *,
      changed_by_user:users!proforma_status_history_changed_by_fkey (display_name)
    `)
    .eq('proforma_id', proformaId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }
  return data;
}

export async function scheduleJob(proformaId: string, startAt: string, endAt: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado' };
  }

  const { data: proforma } = await supabase
    .from('proformas')
    .select('status')
    .eq('id', proformaId)
    .single();

  const { error } = await supabase
    .from('proformas')
    .update({
      status: 'job',
      job_start_at: startAt,
      job_end_at: endAt,
      job_converted_at: new Date().toISOString()
    })
    .eq('id', proformaId);

  if (error) {
    console.error('Error scheduling job:', error);
    return { error: 'Error al programar el job.' };
  }

  await logStatusChange(proformaId, 'job', proforma?.status, user.id);

  revalidatePath(`/proforma/${proformaId}`);
  revalidatePath('/page');
  revalidatePath('/calendar');
  return { success: true };
}

export async function toggleItemOptional(itemId: string, proformaId: string, isExcluded: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado' };
  }

  // 1. Fetch proforma and items to check status and calculate new totals
  const { data: proforma } = await supabase
    .from('proformas')
    .select('*, applied_taxes:users (taxes (*))')
    .eq('id', proformaId)
    .single();

  if (proforma?.status === 'approved' || proforma?.status === 'job') {
    return { error: 'No se puede editar una proforma aprobada o en proceso.' };
  }

  // 2. Update the specific item (using is_excluded for calculation state)
  const { error: itemUpdateError } = await supabase
    .from('proforma_items')
    .update({ is_excluded: isExcluded })
    .eq('id', itemId);

  if (itemUpdateError) {
    console.error('Error toggling excluded status:', itemUpdateError);
    return { error: 'Error al actualizar el estado de cálculo.' };
  }

  // 3. Recalculate totals
  return await recalculateProformaTotals(proformaId);
}

export async function updateItemsOrder(proformaId: string, items: { id: string, sort_order: number }[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'No autorizado' };

  // Update each item's sort_order
  const promises = items.map(item =>
    supabase
      .from('proforma_items')
      .update({ sort_order: item.sort_order })
      .eq('id', item.id)
  );

  await Promise.all(promises);

  revalidatePath(`/proforma/${proformaId}`);
  revalidatePath(`/p/${proformaId}`);
  return { success: true };
}

export async function updateProformaItem(itemId: string, proformaId: string, data: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'No autorizado' };

  // Calculate total_price for the item
  const total_price = (data.quantity || 0) * (data.unit_price || 0);

  const { error } = await supabase
    .from('proforma_items')
    .update({
      description: data.description,
      details: data.details,
      quantity: data.quantity,
      unit_price: data.unit_price,
      total_price: total_price,
      is_optional: data.is_optional,
      is_excluded: data.is_excluded ?? data.is_optional,
      photo_url: data.photo_url
    })
    .eq('id', itemId);

  if (error) {
    console.error('Error updating item:', error);
    return { error: 'Error al actualizar el ítem.' };
  }

  // Recalculate proforma totals
  return await recalculateProformaTotals(proformaId);
}

async function recalculateProformaTotals(proformaId: string) {
  const supabase = await createClient();

  // 1. Fetch proforma and items
  const { data: proforma } = await supabase
    .from('proformas')
    .select('*, applied_taxes:users (taxes (*))')
    .eq('id', proformaId)
    .single();

  const { data: items } = await supabase
    .from('proforma_items')
    .select('*')
    .eq('proforma_id', proformaId);

  if (!proforma || !items) return { error: 'Error al obtener datos para el recálculo.' };

  // 2. Calculate new Subtotal
  const newSubtotal = items.reduce((acc, item) => {
    if (item.is_excluded) return acc;
    return acc + (item.quantity * item.unit_price);
  }, 0);

  // 3. Calculate Taxes and Discounts from dynamic adjustments
  let newTotalTax = 0;
  let newTotalDiscount = 0;
  const adjustments = (proforma.adjustments || []) as any[];

  if (adjustments.length > 0) {
    adjustments.forEach(adj => {
      const amount = adj.valueType === 'percentage'
        ? (newSubtotal * adj.value) / 100
        : adj.value;

      if (adj.type === 'tax') {
        newTotalTax += amount;
      } else if (adj.type === 'discount') {
        newTotalDiscount += amount;
      }
    });
  } else {
    // Fallback to default user taxes if no dynamic adjustments are defined
    if (Array.isArray(proforma.applied_taxes.taxes)) {
      proforma.applied_taxes.taxes.forEach((tax: any) => {
        const amount = (newSubtotal * tax.percentage) / 100;
        newTotalTax += amount;
      });
    } else {
      const taxRate = proforma.tax_rate || 16;
      newTotalTax = (newSubtotal * taxRate) / 100;
    }
  }

  const newTotal = newSubtotal + newTotalTax - newTotalDiscount;

  // 4. Update the Proforma
  const { error: proformaUpdateError } = await supabase
    .from('proformas')
    .update({
      subtotal: newSubtotal,
      tax: newTotalTax,
      total: newTotal
    })
    .eq('id', proformaId);

  if (proformaUpdateError) {
    console.error('Error updating proforma totals:', proformaUpdateError);
    return { error: 'Error al actualizar los totales de la proforma.' };
  }

  revalidatePath(`/proforma/${proformaId}`);
  revalidatePath(`/p/${proformaId}`);
  return { success: true };
}

export async function sendMaterialsEmail(proformaId: string, formData: FormData) {
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

  // Fetch proforma and materials data
  const { data: proforma, error: pError } = await supabase
    .from('proformas')
    .select('*, clients(*)')
    .eq('id', proformaId)
    .single();

  if (pError || !proforma) {
    return { error: 'No se pudo cargar la información del trabajo.' };
  }

  const { data: materials } = await supabase
    .from('job_materials')
    .select('*')
    .eq('proforma_id', proformaId);

  try {
    const pdfBuffer = await renderToBuffer(
      React.createElement(MaterialsPDF, {
        proforma,
        materials: materials || [],
        client: proforma.clients
      }) as React.ReactElement<DocumentProps>
    );

    const { success } = await sendEmail({
      displayName: proforma.users?.display_name,
      to: [to],
      subject: subject,
      text: message,
      html: buildEmailHtml(message, proformaId),
      attachments: [
        {
          filename: `materiales_${String(proforma.number || proforma.id.split('-')[0]).toUpperCase()}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (!success) {
      return { error: 'Ocurrió un error al intentar enviar el correo vía SMTP.' };
    }

    return { success: true };

  } catch (err: any) {
    console.error('Materials PDF Generation or SMTP Email Error:', err);
    return { error: `Error al enviar el correo: ${err.message}` };
  }
}

export async function getNextInvoiceNumber() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching next invoice number:', error);
    return 'INV-001';
  }

  if (data && data.length > 0) {
    const lastNumber = data[0].invoice_number;
    const match = lastNumber.match(/(\d+)$/);
    if (match) {
      const nextNum = parseInt(match[1]) + 1;
      return lastNumber.replace(/\d+$/, nextNum.toString().padStart(match[1].length, '0'));
    }
  }

  return 'INV-001';
}

export async function upsertInvoice(data: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'No autorizado' };

  if (data.id) {
    const { error } = await supabase
      .from('invoices')
      .update({
        invoice_number: data.invoice_number,
        issue_date: data.issue_date,
        due_date: data.due_date,
        total_amount: data.total_amount,
        status: data.status,
        notes: data.notes
      })
      .eq('id', data.id);
    
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from('invoices')
      .insert({
        proforma_id: data.proforma_id,
        client_id: data.client_id,
        invoice_number: data.invoice_number,
        issue_date: data.issue_date,
        due_date: data.due_date,
        total_amount: data.total_amount,
        status: data.status,
        notes: data.notes
      });
    
    if (error) return { error: error.message };
  }

  revalidatePath(`/proforma/${data.proforma_id}`);
  return { success: true };
}

export async function deleteInvoice(invoiceId: string, proformaId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId);

  if (error) return { error: error.message };

  revalidatePath(`/proforma/${proformaId}`);
  return { success: true };
}

export async function sendInvoiceEmail(invoiceId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const to = formData.get('to') as string;
  const subject = formData.get('subject') as string;
  const message = formData.get('message') as string;

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, proformas(*, users(*)), clients(*)')
    .eq('id', invoiceId)
    .single();

  if (!invoice) return { error: 'Factura no encontrada' };

  try {
    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoicePDF, {
        invoice,
        proforma: invoice.proformas,
        client: invoice.clients,
        user: invoice.proformas.users
      }) as React.ReactElement<DocumentProps>
    );

    await sendEmail({
      displayName: invoice.proformas.users.display_name,
      to: [to],
      subject,
      text: message,
      html: buildEmailHtml(message, invoice.proforma_id),
      attachments: [{
        filename: `factura_${invoice.invoice_number}.pdf`,
        content: pdfBuffer
      }]
    });

    if (invoice.status === 'draft') {
      await supabase.from('invoices').update({ status: 'sent' }).eq('id', invoiceId);
    }

    revalidatePath(`/proforma/${invoice.proforma_id}`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function sendPaymentEmail(paymentId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const to = formData.get('to') as string;
  const subject = formData.get('subject') as string;
  const message = formData.get('message') as string;

  const { data: payment } = await supabase
    .from('payments')
    .select('*, proformas(*, users(*)), clients(*)')
    .eq('id', paymentId)
    .single();

  if (!payment) return { error: 'Pago no encontrado' };

  try {
    const pdfBuffer = await renderToBuffer(
      React.createElement(PaymentPDF, {
        payment,
        proforma: payment.proformas,
        client: payment.clients,
        user: payment.proformas.users
      }) as React.ReactElement<DocumentProps>
    );

    await sendEmail({
      displayName: payment.proformas.users.display_name,
      to: [to],
      subject,
      text: message,
      html: buildEmailHtml(message, payment.proforma_id),
      attachments: [{
        filename: `recibo_${payment.id.split('-')[0].toUpperCase()}.pdf`,
        content: pdfBuffer
      }]
    });

    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
