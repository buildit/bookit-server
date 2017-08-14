import {Credentials} from '../../model/Credentials';
import {Attendee} from '../../model/Attendee';
/**
 * General interface for token operations.  A token needs to be obtained from the oauth2 endpoint
 * prior to using any of the Microsoft Graph endpoints.
 */
export interface GraphTokenProvider {
  domain(): string;
  hasToken(): boolean;
  getCurrentToken(): string;

  assignUserToken(user: string, token: string): void;
  withToken(): Promise<string>;
  withDelegatedToken(user: string): Promise<string>;
}


export interface JWTTokenProvider {
  provideToken(credentials: Credentials): string;
  verify(token: string): Promise<Credentials>;
  decode(token: string): any;
  verifyOpenId(token: string): Promise<any>;
}

export interface AzureTokenProvider {
  verifyOpenIdToken(token: string): Promise<any>;
}
