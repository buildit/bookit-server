import {GraphTokenProvider} from './TokenProviders';
import {Attendee} from '../../model/Attendee';


export class MockGraphTokenProvider implements GraphTokenProvider {
  private tokenMap = new Map<string, string>();

  constructor(private _domain: string) {
  }


  domain(): string {
    return this._domain;
  }


  hasToken(): boolean {
    return false;
  }


  getCurrentToken(): string {
    return 'invalid';
  }


  withToken(): Promise<string> {
    return Promise.resolve('xyzzy');
    // return Promise.reject('Unimplemented: MockGraphTokenProvider:withToken');
  }

  withDelegatedToken(user: string): Promise<string> {
    return Promise.resolve(`x${user}x`);
    // return Promise.reject('Unimplemented: MockGraphTokenProvider:withToken');
  }

  assignUserToken(user: string, token: string): void {
    this.tokenMap.set(user, token);
  }
}
