'use server';

import { createClient } from '@/lib/supabase/server';
import { QuickBooksClient } from '@/lib/quickbooks/client';
import { revalidatePath } from 'next/cache';

export async function syncInvoiceToQuickBooks(invoiceId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // 1. Fetch invoice details
    const { data: invoice, error: iError } = await supabase
      .from('invoices')
      .select('*, proformas(*), clients(*)')
      .eq('id', invoiceId)
      .single();

    if (iError || !invoice) return { error: 'Invoice not found' };

    // 2. Initialize QBO Client
    let qbo;
    try {
      qbo = await QuickBooksClient.fromUserId(user.id);
    } catch (e) {
      return { error: 'QuickBooks not connected. Please go to Settings > Integrations.' };
    }

    // 3. Create or find customer in QBO
    const client = invoice.clients as any;
    let qboCustomerId = client.qbo_customer_id;

    if (!qboCustomerId) {
      const qboCustomer = await qbo.createCustomer({
        name: client.name || client.company_name,
        email: client.email,
        phone: client.phone,
      });
      qboCustomerId = qboCustomer.Customer.Id;
      
      // Update local client with QBO Customer ID
      await supabase
        .from('clients')
        .update({ qbo_customer_id: qboCustomerId })
        .eq('id', client.id);
    }

    // 4. Fetch proforma items for the invoice
    // Note: Actually, we should probably record what's in the invoice, but if it doesn't have its own items,
    // we use the proforma items as a reference for the QBO line items.
    const { data: proformaItems } = await supabase
      .from('proforma_items')
      .select('*')
      .eq('proforma_id', invoice.proforma_id)
      .eq('is_excluded', false);

    // 5. Create Invoice in QBO
    // We'll create a single line item for the invoice total if items aren't mapped 1:1 to partial invoices.
    // Or just use the proforma items if it's a full invoice.
    const items = (proformaItems && proformaItems.length > 0) 
      ? proformaItems.map(item => ({
          description: item.description,
          amount: item.total_price || (item.quantity * item.unit_price),
          quantity: item.quantity || 1,
          unitPrice: item.unit_price,
        }))
      : [{
          description: `Servicios por Factura ${invoice.invoice_number}`,
          amount: invoice.total_amount,
          quantity: 1,
          unitPrice: invoice.total_amount
        }];

    const qboInvoice = await qbo.createInvoice({
      customerRef: qboCustomerId,
      number: invoice.invoice_number,
      total: invoice.total_amount,
      items: items,
    });

    // 6. Update local invoice with QBO Invoice ID
    await supabase
      .from('invoices')
      .update({ 
        qbo_invoice_id: qboInvoice.Invoice.Id,
        last_qbo_sync_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    revalidatePath('/invoices');
    return { success: true, qboInvoiceId: qboInvoice.Invoice.Id };
  } catch (e: any) {
    console.error('Sync Error:', e);
    return { error: e.message || 'Failed to sync with QuickBooks' };
  }
}

export async function syncPaymentToQuickBooks(paymentId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // 1. Fetch payment details
    const { data: payment, error: pError } = await supabase
      .from('payments')
      .select('*, invoices(*, clients(*))')
      .eq('id', paymentId)
      .single();

    if (pError || !payment) return { error: 'Payment not found' };
    
    // Safety check: Needs an invoice
    if (!payment.invoices || !payment.invoices.qbo_invoice_id) {
      return { error: 'Related invoice must be synced to QuickBooks first.' };
    }

    // 2. Initialize QBO Client
    let qbo;
    try {
      qbo = await QuickBooksClient.fromUserId(user.id);
    } catch (e) {
      return { error: 'QuickBooks not connected.' };
    }

    // 3. Create Payment in QBO
    const qboCustomerId = payment.invoices.clients.qbo_customer_id;
    const qboPayment = await qbo.createPayment({
      customerRef: qboCustomerId,
      invoiceRef: payment.invoices.qbo_invoice_id,
      amount: payment.amount,
      date: payment.payment_date || new Date().toISOString().split('T')[0],
    });

    // 4. Update local payment with QBO Payment ID
    await supabase
      .from('payments')
      .update({ 
        qbo_payment_id: qboPayment.Payment.Id,
        last_qbo_sync_at: new Date().toISOString()
      })
      .eq('id', paymentId);

    revalidatePath('/invoices');
    return { success: true, qboPaymentId: qboPayment.Payment.Id };
  } catch (e: any) {
    console.error('Payment Sync Error:', e);
    return { error: e.message || 'Failed to sync payment' };
  }
}

export async function syncInvoiceStatusFromQuickBooks(invoiceId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // 1. Fetch local invoice
    const { data: invoice, error: iError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (iError || !invoice || !invoice.qbo_invoice_id) {
      return { error: 'Invoice not found or not synced to QuickBooks' };
    }

    // 2. Initialize QBO Client
    let qbo;
    try {
      qbo = await QuickBooksClient.fromUserId(user.id);
    } catch (e) {
      return { error: 'QuickBooks not connected.' };
    }

    // 3. Fetch from QBO
    const qboInvoiceData = await qbo.getInvoice(invoice.qbo_invoice_id);
    const qboInvoice = qboInvoiceData.Invoice;

    // 4. Update status if balance is 0
    const balance = qboInvoice.Balance;
    let newStatus = invoice.status;

    if (balance <= 0) {
      newStatus = 'paid';
    }

    // 5. Update local DB
    await supabase
      .from('invoices')
      .update({ 
        status: newStatus,
        last_qbo_sync_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    revalidatePath('/invoices');
    return { success: true, status: newStatus, balance };
  } catch (e: any) {
    console.error('Status Sync Error:', e);
    return { error: e.message || 'Failed to sync status' };
  }
}
