import {GraphTokenProvider} from './TokenProviders';


export class MockGraphTokenProvider implements GraphTokenProvider {
  constructor() {
  }


  hasToken(): boolean {
    return false;
  }


  getCurrentToken(): string {
    return 'invalid';
  }


  withToken(): Promise<string> {
    return Promise.reject('Unimplemented');
  }

}
