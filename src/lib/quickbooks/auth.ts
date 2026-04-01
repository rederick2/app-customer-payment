import OAuthClient from 'intuit-oauth';

export function getQBOAuthClient() {
  return new OAuthClient({
    clientId: process.env.QUICKBOOKS_CLIENT_ID || '',
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || '',
    environment: (process.env.QUICKBOOKS_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    redirectUri: process.env.QUICKBOOKS_REDIRECT_URI || '',
  });
}

export const QBO_SCOPES = [
  OAuthClient.scopes.Accounting,
  OAuthClient.scopes.OpenId,
  OAuthClient.scopes.Email,
  OAuthClient.scopes.Phone,
  OAuthClient.scopes.Address,
];
