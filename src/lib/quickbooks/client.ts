import OAuthClient from 'intuit-oauth';
import { createClient } from '@/lib/supabase/server';

export class QuickBooksClient {
  private oauthClient: any;
  private realmId: string;
  private userId: string;

  constructor(tokens: any, realmId: string, userId: string) {
    this.oauthClient = new OAuthClient({
      clientId: process.env.QUICKBOOKS_CLIENT_ID || '',
      clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || '',
      environment: (process.env.QUICKBOOKS_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      redirectUri: process.env.QUICKBOOKS_REDIRECT_URI || '',
      token: tokens,
    });
    this.realmId = realmId;
    this.userId = userId;
  }

  static async fromUserId(userId: string, supabaseClient?: any) {
    const supabase = supabaseClient || await createClient();
    const { data: config, error } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('service_name', 'quickbooks')
      .single();

    if (error || !config) {
      throw new Error('QuickBooks integration not found or inactive');
    }

    const tokens = {
      access_token: config.access_token,
      refresh_token: config.refresh_token,
      realmId: config.realm_id,
      expires_in: Math.floor((new Date(config.expires_at).getTime() - Date.now()) / 1000),
      x_refresh_token_expires_in: Math.floor((new Date(config.refresh_token_expires_at).getTime() - Date.now()) / 1000),
    };

    return new QuickBooksClient(tokens, config.realm_id, userId);
  }

  private async ensureValidToken() {
    if (!this.oauthClient.isAccessTokenValid()) {
      try {
        const authResponse = await this.oauthClient.refresh();
        const tokens = authResponse.getJson();
        
        // Update tokens in DB
        const supabase = await createClient();
        await supabase
          .from('user_integrations')
          .update({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            refresh_token_expires_at: new Date(Date.now() + tokens.x_refresh_token_expires_in * 1000).toISOString(),
            last_sync_at: new Date().toISOString(),
          })
          .eq('user_id', this.userId)
          .eq('service_name', 'quickbooks');
      } catch (e) {
        console.error('Error refreshing QBO token:', e);
        throw new Error('Failed to refresh QuickBooks token');
      }
    }
  }

  private get baseUrl() {
    const isSandbox = this.oauthClient.environment === 'sandbox';
    return isSandbox ? 'sandbox-quickbooks.api.intuit.com' : 'quickbooks.api.intuit.com';
  }

  private async handleResponse(response: Response, context: string) {
    const text = await response.text();
    let data: any = null;

    try {
      if (text) {
        data = JSON.parse(text);
      }
    } catch (err) {
      // Fallback for non-JSON responses
    }

    if (!response.ok) {
      console.error(`QuickBooks API Error [${context}]:`, {
        status: response.status,
        statusText: response.statusText,
        body: data || text
      });

      // 1. Try to extract from QBO Fault object
      const errObj = data?.Fault?.Error?.[0];
      const detail = errObj?.Detail;
      const message = errObj?.Message;
      const code = errObj?.code;

      let qboError = detail || message || data?.Message;

      // 2. If no JSON error, use status text or a snippet of the raw response
      if (!qboError) {
        if (text && text.length > 0) {
          qboError = text.length > 150 ? text.substring(0, 150) + '...' : text;
        } else {
          qboError = response.statusText || `HTTP ${response.status}`;
        }
      }

      const finalMessage = code ? `${qboError} (Error ${code})` : qboError;
      throw new Error(`QuickBooks Sync Failed (${context}): ${finalMessage}`);
    }

    return data;
  }

  async createCustomer(client: { name: string; email?: string; phone?: string }) {
    await this.ensureValidToken();
    const url = `https://${this.baseUrl}/v3/company/${this.realmId}/customer?minorversion=70`;
    
    // De-dupe and truncate fields based on QuickBooks limits (Error 2050 prevention)
    const displayName = (client.name || '').substring(0, 100);
    const email = (client.email || '').substring(0, 100);
    const phone = (client.phone || '').substring(0, 30);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.oauthClient.getToken().access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        DisplayName: displayName,
        PrimaryEmailAddr: { Address: email },
        PrimaryPhone: { FreeFormNumber: phone },
      }),
    });

    return await this.handleResponse(response, 'Create Customer');
  }

  async createInvoice(invoice: { customerRef: string; items: any[]; total: number; number: string }) {
    await this.ensureValidToken();
    const url = `https://${this.baseUrl}/v3/company/${this.realmId}/invoice?minorversion=70`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.oauthClient.getToken().access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        DocNumber: invoice.number,
        Line: invoice.items.map(item => ({
          Description: item.description,
          Amount: item.amount,
          DetailType: 'SalesItemLineDetail',
          SalesItemLineDetail: {
            Qty: item.quantity,
            UnitPrice: item.unitPrice,
          }
        })),
        CustomerRef: { value: invoice.customerRef }
      }),
    });

    return await this.handleResponse(response, 'Create Invoice');
  }

  async createPayment(payment: { customerRef: string; invoiceRef: string; amount: number; date: string }) {
    await this.ensureValidToken();
    const url = `https://${this.baseUrl}/v3/company/${this.realmId}/payment?minorversion=70`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.oauthClient.getToken().access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        TotalAmt: payment.amount,
        TxnDate: payment.date,
        CustomerRef: { value: payment.customerRef },
        Line: [{
          Amount: payment.amount,
          LinkedTxn: [{
            TxnId: payment.invoiceRef,
            TxnType: 'Invoice'
          }]
        }]
      }),
    });

    return await this.handleResponse(response, 'Create Payment');
  }

  async getInvoice(invoiceId: string) {
    await this.ensureValidToken();
    const url = `https://${this.baseUrl}/v3/company/${this.realmId}/invoice/${invoiceId}?minorversion=70`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.oauthClient.getToken().access_token}`,
        'Accept': 'application/json',
      },
    });

    return await this.handleResponse(response, 'Get Invoice');
  }

  async getPayment(paymentId: string) {
    await this.ensureValidToken();
    const url = `https://${this.baseUrl}/v3/company/${this.realmId}/payment/${paymentId}?minorversion=70`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.oauthClient.getToken().access_token}`,
        'Accept': 'application/json',
      },
    });

    return await this.handleResponse(response, 'Get Payment');
  }
}
