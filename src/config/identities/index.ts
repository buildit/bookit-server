import {Domain, GraphAPIParameters} from '../../model/EnvironmentConfig';

import {creds as testCreds, domain as testDomain} from './test/credentials';
import {creds as builditCreds, domain as builditDomain} from './builditcontoso/credentials';
import {domain as defaultDomain} from './default/credentials';

export interface Identity {
  domain: Domain;
  credentials?: GraphAPIParameters;
  serviceUserEmail?: string;
  internalTeam?: string;
  externalTeam?: string;
}

export const buildit: Identity = {
  domain: builditDomain,
  credentials: builditCreds,
  serviceUserEmail: 'roodmin@builditcontoso.onmicrosoft.com',
  internalTeam: 'DESIGNIT',
  externalTeam: 'WIPRO',
};

export const test: Identity = {
  domain: testDomain,
  credentials: testCreds
};


export const defaultIdentity: Identity = {
  domain: defaultDomain
};
