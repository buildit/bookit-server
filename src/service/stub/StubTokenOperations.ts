import {TokenOperations} from '../TokenOperations';


export class StubTokenOperations implements TokenOperations {
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
