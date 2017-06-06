import {Credentials} from '../../model/Credentials';
/**
 * General interface for token operations.  A token needs to be obtained from the oauth2 endpoint
 * prior to using any of the Microsoft Graph endpoints.
 */
export interface GraphTokenProvider {
  hasToken(): boolean;
  getCurrentToken(): string;
  withToken(): Promise<string>;
}


export interface JWTTokenProvider {
  provideToken(credentials: Credentials): string;
  verify(token: string): Promise<Credentials>;
}
