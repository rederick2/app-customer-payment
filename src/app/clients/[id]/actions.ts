'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { parseSafeFloat } from '@/lib/utils';

export async function recordPayment(clientId: string, proformaId: string | null, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authorized' };
  }

  const amount = parseSafeFloat(formData.get('amount') as string);
  const type = formData.get('type') as string; // 'payment' or 'deposit'
  const paymentMethod = formData.get('payment_method') as string;
  const paymentDate = formData.get('payment_date') as string || new Date().toISOString();
  const notes = formData.get('notes') as string;

  if (isNaN(amount) || amount <= 0) {
    return { error: 'The amount must be a positive number.' };
  }
  console.log('amount', formData.get('amount'));
  const { error } = await supabase
    .from('payments')
    .insert([{
      client_id: clientId,
      proforma_id: proformaId,
      amount,
      type,
      payment_method: paymentMethod,
      payment_date: paymentDate,
      notes,
      status: 'completed'
    }]);

  if (error) {
    console.error('Error recording payment:', error);
    return { error: 'Error recording payment.' };
  }

  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

export async function getUnlinkedPayments(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('client_id', clientId)
    .is('invoice_id', null)
    .eq('status', 'completed')
    .order('payment_date', { ascending: false });

  if (error) {
    console.error('Error fetching unlinked payments:', error);
    return [];
  }
  return data || [];
}

export async function createInvoice(clientId: string, proformaId: string, formData: FormData, paymentIds: string[] = []) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authorized' };
  }

  const invoiceNumber = formData.get('invoice_number') as string;
  const totalAmount = parseSafeFloat(formData.get('total_amount') as string);
  const issueDate = formData.get('issue_date') as string || new Date().toISOString().split('T')[0];
  const dueDate = formData.get('due_date') as string;
  const notes = formData.get('notes') as string;

  const taxAmount = parseSafeFloat(formData.get('tax_amount') as string);
  const discountAmount = parseSafeFloat(formData.get('discount_amount') as string);

  if (!invoiceNumber) {
    return { error: 'An invoice number is required.' };
  }

  const { data: newData, error } = await supabase
    .from('invoices')
    .insert([{
      client_id: clientId,
      proforma_id: proformaId,
      invoice_number: invoiceNumber,
      total_amount: totalAmount,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      issue_date: issueDate,
      due_date: dueDate,
      notes,
      status: 'sent'
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating invoice:', error);
    return { error: 'Error creating invoice. It is possible that the invoice number already exists.' };
  }

  // Link payments
  if (paymentIds.length > 0) {
    await supabase
      .from('payments')
      .update({ invoice_id: newData.id })
      .in('id', paymentIds);
  }

  revalidatePath(`/clients/${clientId}`);
  return { success: true, data: newData };
}

export async function deleteInvoice(id: string, clientId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authorized' };
  }

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting invoice:', error);
    return { error: 'Error deleting invoice.' };
  }

  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

export async function deletePayment(id: string, clientId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authorized' };
  }

  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting payment:', error);
    return { error: 'Error deleting payment.' };
  }

  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}
