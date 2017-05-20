import {TokenOperations} from '../TokenOperations';
import {Credentials} from '../../model/Credentials';


export class StubTokenOperations implements TokenOperations {

  provideToken(credentials: Credentials): string {
    return undefined;
  }

  verify(token: string): Promise<Credentials> {
    return undefined;
  }

  hasToken(): boolean {
    return undefined;
  }

  getCurrentToken(): string {
    return undefined;
  }

  withToken(): Promise<string> {
    return undefined;
  }
}
