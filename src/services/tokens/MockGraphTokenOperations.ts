import {GraphTokenProvider} from './TokenProviders';
import {Attendee} from '../../model/Attendee';


export class MockGraphTokenProvider implements GraphTokenProvider {
  private tokenMap = new Map<string, string>();

  constructor() {
  }


  domain(): string {
    throw new Error('Should not be called');
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

  withDelegatedToken(attendee: Attendee): Promise<string> {
    return Promise.resolve(`x${attendee.email}x`);
    // return Promise.reject('Unimplemented: MockGraphTokenProvider:withToken');
  }

  assignUserToken(user: string, token: string): void {
    this.tokenMap.set(user, token);
  }
}
