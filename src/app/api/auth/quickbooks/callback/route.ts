import { NextRequest, NextResponse } from 'next/server';
import { getQBOAuthClient } from '@/lib/quickbooks/auth';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = request.url;
  const code = searchParams.get('code');
  const realmId = searchParams.get('realmId');

  if (!code || !realmId) {
    return NextResponse.redirect(new URL('/settings?error=QuickBooks auth failed', request.url));
  }

  try {
    const oauthClient = getQBOAuthClient();
    const authResponse = await oauthClient.createToken(url);
    const tokens = authResponse.getJson();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Upsert the integration
    const { error } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: user.id,
        service_name: 'quickbooks',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        realm_id: realmId,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        refresh_token_expires_at: new Date(Date.now() + tokens.x_refresh_token_expires_in * 1000).toISOString(),
        is_active: true,
        last_sync_at: new Date().toISOString(),
      }, { onConflict: 'user_id, service_name' });

    if (error) {
      console.error('Supabase error saving QBO tokens:', error);
      return NextResponse.redirect(new URL('/settings?error=QuickBooks DB error', request.url));
    }

    return NextResponse.redirect(new URL('/settings?activeTab=integrations&success=QuickBooks connected', request.url));
  } catch (e) {
    console.error('QuickBooks Auth Error:', e);
    return NextResponse.redirect(new URL('/settings?error=QuickBooks auth exception', request.url));
  }
}
