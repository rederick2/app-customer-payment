declare module 'intuit-oauth' {
  class OAuthClient {
    constructor(config: {
      clientId: string;
      clientSecret: string;
      environment: 'sandbox' | 'production';
      redirectUri: string;
      token?: any;
    });

    static scopes: {
      Accounting: string;
      Payment: string;
      Payroll: string;
      TimeTracking: string;
      Benefits: string;
      V3Payroll: string;
      OpenId: string;
      Email: string;
      Profile: string;
      Phone: string;
      Address: string;
    };

    authorizeUri(config: { scope: string[]; state?: string }): string;
    createToken(url: string): Promise<any>;
    refresh(): Promise<any>;
    getToken(): any;
    isAccessTokenValid(): boolean;
    getJson(): any;
  }
  export default OAuthClient;
}
