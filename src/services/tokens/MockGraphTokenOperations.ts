import {GraphTokenProvider} from './TokenProviders';


export class MockGraphTokenProvider implements GraphTokenProvider {
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
    return Promise.reject('Unimplemented: MockGraphTokenProvider:withToken');
  }

}
