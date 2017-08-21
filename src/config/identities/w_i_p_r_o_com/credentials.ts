import {Domain, GraphAPIParameters} from '../../../model/EnvironmentConfig';

const W_I_P_R_O = 'w' + 'i' + 'p' + 'r' + 'o' + '.com';

export const domain: Domain = {
  domainName: W_I_P_R_O,
  sites: ['nyc']
};


export const creds: GraphAPIParameters = {
  identity: W_I_P_R_O,
  tenantId: '258ac4e4-146a-411e-9dc8-79a9e12fd6da',
  clientId: 'ab5d8868-f5ea-44b1-b4ad-1587ffbec86d',
};


