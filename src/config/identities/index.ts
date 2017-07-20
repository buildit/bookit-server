import {Domain, GraphAPIParameters} from '../../model/EnvironmentConfig';

import {creds as romanCreds, domain as romanDomain} from './roman/credentials';
import {creds as testCreds, domain as testDomain} from './test/credentials';
import {creds as builditCreds, domain as builditDomain} from './builditcontoso/credentials';
import {domain as defaultDomain} from './default/credentials';

export interface Identity {
  domain: Domain;
  credentials?: GraphAPIParameters;
}

export const roman: Identity = {
  domain: romanDomain,
  credentials: romanCreds
};

export const buildit: Identity = {
  domain: builditDomain,
  credentials: builditCreds
};

export const test: Identity = {
  domain: testDomain,
  credentials: testCreds
};


export const defaultIdentity: Identity = {
  domain: defaultDomain
};

