import {Domain, GraphAPIParameters} from '../../model/EnvironmentConfig';

import {creds as builditCreds, domain as builditDomain} from './builditcontoso/credentials';
import {creds as wCreds, domain as wDomain} from './w_i_p_r_o_com/credentials';
import {domain as defaultDomain} from './default/credentials';

export interface Identity {
  domain: Domain;
  credentials?: GraphAPIParameters;
  serviceUserEmail?: string;
  internalTeam?: string;
  externalTeam?: string;
}

export const w_i_p_r_o: Identity = {
  domain: wDomain,
  credentials: wCreds
};

export const buildit: Identity = {
  domain: builditDomain,
  credentials: builditCreds,
  serviceUserEmail: `roodmin@${builditDomain.domainName}`,
  internalTeam: 'DESIGNIT',
  externalTeam: 'WIPRO',
};

export const defaultIdentity: Identity = {
  domain: defaultDomain
};
