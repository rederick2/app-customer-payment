'use server';

import { createClient } from '@/lib/supabase/server';
import { QuickBooksClient } from '@/lib/quickbooks/client';
import { revalidatePath } from 'next/cache';

export async function syncInvoiceToQuickBooks(invoiceId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false as const, error: 'Not authenticated' };

    // 1. Fetch invoice details
    const { data: invoice, error: iError } = await supabase
      .from('invoices')
      .select('*, proformas(*), clients(*)')
      .eq('id', invoiceId)
      .single();

    if (iError || !invoice) return { success: false as const, error: 'Invoice not found' };

    // 2. Initialize QBO Client
    let qbo;
    try {
      qbo = await QuickBooksClient.fromUserId(user.id);
    } catch (e) {
      return { success: false as const, error: 'QuickBooks not connected. Please go to Settings > Integrations.' };
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
    return { success: true as const, qboInvoiceId: qboInvoice.Invoice.Id };
  } catch (e: any) {
    console.error('Sync Error:', e);
    return { success: false as const, error: e.message || 'Failed to sync with QuickBooks' };
  }
}

export async function syncPaymentToQuickBooks(paymentId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false as const, error: 'Not authenticated' };

    // 1. Fetch payment details
    const { data: payment, error: pError } = await supabase
      .from('payments')
      .select('*, invoices(*, clients(*))')
      .eq('id', paymentId)
      .single();

    if (pError || !payment) return { success: false as const, error: 'Payment not found' };
    
    // Safety check: Needs an invoice
    if (!payment.invoices || !payment.invoices.qbo_invoice_id) {
      return { success: false as const, error: 'Related invoice must be synced to QuickBooks first.' };
    }

    // 2. Initialize QBO Client
    let qbo;
    try {
      qbo = await QuickBooksClient.fromUserId(user.id);
    } catch (e) {
      return { success: false as const, error: 'QuickBooks not connected.' };
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
    return { success: true as const, qboPaymentId: qboPayment.Payment.Id };
  } catch (e: any) {
    console.error('Payment Sync Error:', e);
    return { success: false as const, error: e.message || 'Failed to sync payment' };
  }
}

export async function syncInvoiceByQboId(qboInvoiceId: string, qboClient: QuickBooksClient, supabaseClient?: any) {
  const supabase = supabaseClient || await createClient();
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('qbo_invoice_id', qboInvoiceId)
    .single();

  if (!invoice) {
    console.log(`Invoice not found for QBO ID ${qboInvoiceId}`);
    return null;
  }

  const qboInvoiceData = await qboClient.getInvoice(qboInvoiceId);
  const qboInvoice = qboInvoiceData.Invoice;
  const balance = qboInvoice.Balance;
  
  // Extract Taxes
  const totalTax = qboInvoice.TxnTaxDetail?.TotalTax || 0;
  
  // Extract Discounts (can be a line item or a total amount depending on configuration)
  let totalDiscount = 0;
  if (Array.isArray(qboInvoice.Line)) {
    qboInvoice.Line.forEach((line: any) => {
      if (line.DetailType === 'DiscountLineDetail') {
        totalDiscount += (line.Amount || 0);
      }
    });
  }

  let newStatus = invoice.status;
  if (balance <= 0) {
    newStatus = 'paid';
  } else if (balance < qboInvoice.TotalAmt) {
    newStatus = 'partially_paid';
  }

  const { error: updateError } = await supabase
    .from('invoices')
    .update({ 
      invoice_number: qboInvoice.DocNumber || invoice.invoice_number,
      total_amount: qboInvoice.TotalAmt || invoice.total_amount,
      tax_amount: totalTax,
      discount_amount: totalDiscount,
      issue_date: qboInvoice.TxnDate || invoice.issue_date,
      due_date: qboInvoice.DueDate || invoice.due_date,
      notes: qboInvoice.PrivateNote || invoice.notes,
      status: newStatus,
      last_qbo_sync_at: new Date().toISOString()
    })
    .eq('id', invoice.id);

  if (updateError) {
    console.error(`Error updating invoice ${invoice.id}:`, updateError);
  }

  return { status: newStatus, balance };
}

export async function syncPaymentByQboId(qboPaymentId: string, qboClient: QuickBooksClient, supabaseClient?: any) {
  const supabase = supabaseClient || await createClient();
  
  let qboPaymentData;
  try {
    qboPaymentData = await qboClient.getPayment(qboPaymentId);
  } catch (e) {
    console.error(`Error fetching payment ${qboPaymentId} from QBO:`, e);
    return null;
  }

  const qboPayment = qboPaymentData.Payment;
  if (!qboPayment) return null;

  // Find the linked invoice if any to get client/proforma context
  const qboInvoiceId = qboPayment.Line?.[0]?.LinkedTxn?.find((txn: any) => txn.TxnType === 'Invoice')?.TxnId;

  if (qboInvoiceId) {
    const { data: invoice } = await supabase
      .from('invoices')
      .select('id, client_id, proforma_id')
      .eq('qbo_invoice_id', qboInvoiceId)
      .single();

    if (invoice) {
      // Record payment locally (linked to client and proforma, NOT invoice_id)
      const paymentData = {
        client_id: invoice.client_id,
        proforma_id: invoice.proforma_id,
        amount: qboPayment.TotalAmt,
        payment_date: qboPayment.TxnDate,
        payment_method: qboPayment.PaymentMethodRef?.name || 'QuickBooks',
        reference_number: qboPayment.PaymentRefNum, // Transaction Number
        bank_name: qboPayment.DepositToAccountRef?.name, // Bank Name
        notes: qboPayment.PrivateNote,
        type: 'payment',
        status: 'completed',
        qbo_payment_id: qboPaymentId,
        last_qbo_sync_at: new Date().toISOString()
      };

      // Check if payment already exists
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('qbo_payment_id', qboPaymentId)
        .maybeSingle();

      let upsertError;
      if (existingPayment) {
        const { error } = await supabase
          .from('payments')
          .update(paymentData)
          .eq('id', existingPayment.id);
        upsertError = error;
      } else {
        const { error } = await supabase
          .from('payments')
          .insert(paymentData);
        upsertError = error;
      }

      if (upsertError) {
        console.error(`Error syncing payment for QBO ID ${qboPaymentId}:`, upsertError);
      }

      // Update invoice status based on balance
      await syncInvoiceByQboId(qboInvoiceId, qboClient, supabase);
    }
  }

  return qboPayment;
}

export async function syncInvoiceStatusFromQuickBooks(invoiceId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false as const, error: 'Not authenticated' };

    // 1. Fetch local invoice
    const { data: invoice, error: iError } = await supabase
      .from('invoices')
      .select('qbo_invoice_id')
      .eq('id', invoiceId)
      .single();

    if (iError || !invoice || !invoice.qbo_invoice_id) {
      return { success: false as const, error: 'Invoice not found or not synced to QuickBooks' };
    }

    // 2. Initialize QBO Client
    let qbo;
    try {
      qbo = await QuickBooksClient.fromUserId(user.id);
    } catch (e) {
      return { success: false as const, error: 'QuickBooks not connected.' };
    }

    // 3. Sync
    const result = await syncInvoiceByQboId(invoice.qbo_invoice_id, qbo);
    if (!result) {
      return { success: false as const, error: 'No se pudo sincronizar el estado desde QuickBooks' };
    }

    revalidatePath('/invoices');
    return { success: true as const, ...result };
  } catch (e: any) {
    console.error('Status Sync Error:', e);
    return { success: false as const, error: e.message || 'Failed to sync status' };
  }
}
