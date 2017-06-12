import {Domain, GraphAPIParameters} from '../../model/EnvironmentConfig';

import {creds as romanCreds, domain as romanDomain} from './roman/credentials';
import {creds as contosoCreds, domain as contosoDomain} from './contoso/credentials';
import {creds as testCreds, domain as testDomain} from './test/credentials';
import {creds as buildCreds, domain as buildDomain} from './digitalbuildit/credentials';
import {domain as defaultDomain} from './default/credentials';

export interface Identity {
  domain: Domain;
  credentials?: GraphAPIParameters;
}

export const roman: Identity = {
  domain: romanDomain,
  credentials: romanCreds
};

export const contoso: Identity = {
  domain: contosoDomain,
  credentials: contosoCreds
};

export const test: Identity = {
  domain: testDomain,
  credentials: testCreds
};

export const digital: Identity = {
  domain: buildDomain,
  credentials: buildCreds
};

export const defaultIdentity: Identity = {
  domain: defaultDomain
};

