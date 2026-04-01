import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { QuickBooksClient } from '@/lib/quickbooks/client';
import { syncInvoiceByQboId, syncPaymentByQboId } from '@/app/invoices/actions';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('intuit-signature');
  const verifier = process.env.QUICKBOOKS_WEBHOOK_VERIFIER;

  if (!signature || !verifier) {
    console.error('Webhook Error: Missing signature or verifier');
    return NextResponse.json({ error: 'Missing signature or verifier' }, { status: 401 });
  }

  const rawBody = await req.text();
  const hash = crypto
    .createHmac('sha256', verifier)
    .update(rawBody)
    .digest('base64');

  if (hash !== signature) {
    console.error('Webhook Error: Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (e) {
    console.error('Webhook Error: Failed to parse body');
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const notifications = payload.eventNotifications || [];
  const supabase = createAdminClient();

  for (const notification of notifications) {
    const realmId = notification.realmId;
    
    // Find the user integration for this realmId
    const { data: integration, error: iError } = await supabase
      .from('user_integrations')
      .select('user_id')
      .eq('realm_id', realmId)
      .eq('service_name', 'quickbooks')
      .single();

    if (iError || !integration) {
      console.error(`Webhook Error: No integration found for realmId: ${realmId}`, iError);
      continue;
    }

    try {
      const qboClient = await QuickBooksClient.fromUserId(integration.user_id, supabase);
      const entities = notification.dataChangeEvent?.entities || [];

      for (const entity of entities) {
        const { name, id, operation } = entity;
        console.log(`Webhook Processing: ${operation} ${name} ${id} for Realm ${realmId}`);

        try {
          if (name === 'Invoice') {
            await syncInvoiceByQboId(id, qboClient, supabase);
            
            // Notification for Invoice Sync
            const { data: updatedInvoice } = await supabase
              .from('invoices')
              .select('invoice_number, proforma_id, client_id')
              .eq('qbo_invoice_id', id)
              .single();

            if (updatedInvoice) {
              await supabase.from('notifications').insert({
                user_id: integration.user_id,
                proforma_id: updatedInvoice.proforma_id,
                client_id: updatedInvoice.client_id,
                type: 'sync',
                message: `Factura ${updatedInvoice.invoice_number} actualizada desde QuickBooks`
              });
            }
          } else if (name === 'Payment') {
            await syncPaymentByQboId(id, qboClient, supabase);

            // Notification for Payment Sync
            const { data: updatedPayment } = await supabase
              .from('payments')
              .select('amount, proforma_id, client_id')
              .eq('qbo_payment_id', id)
              .single();

            if (updatedPayment) {
              await supabase.from('notifications').insert({
                user_id: integration.user_id,
                proforma_id: updatedPayment.proforma_id,
                client_id: updatedPayment.client_id,
                type: 'payment',
                message: `Pago recibido por $${updatedPayment.amount.toLocaleString()} para el proyecto`
              });
            }
          }
        } catch (err) {
          console.error(`Webhook Error syncing ${name} ${id}:`, err);
        }
      }
    } catch (err) {
      console.error(`Webhook Error initializing QBO Client for user ${integration.user_id}:`, err);
    }
  }

  return NextResponse.json({ success: true });
}
