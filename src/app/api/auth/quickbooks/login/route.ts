import { NextResponse } from 'next/server';
import { getQBOAuthClient, QBO_SCOPES } from '@/lib/quickbooks/auth';

export async function GET() {
  const oauthClient = getQBOAuthClient();

  const authUri = oauthClient.authorizeUri({
    scope: QBO_SCOPES,
    state: 'quickbooks_auth', // Could be a random string for CSRF
  });

  return NextResponse.redirect(authUri);
}
