import AppEnv from './env';

import {RootLog as logger} from '../utils/RootLogger';

import {buildit, w_i_p_r_o} from './identities';
import {EnvironmentConfig, GraphAPIParameters} from '../model/EnvironmentConfig';


function _assignGraphIdentity(env: string): GraphAPIParameters {
  switch (env) {
    case buildit.credentials.identity: {
      buildit.credentials.clientSecret = AppEnv.BUILDIT_SECRET;
      return buildit.credentials;
    }
    case w_i_p_r_o.credentials.identity: {
      w_i_p_r_o.credentials.clientSecret = AppEnv.ORPIW_SECRET;
      return w_i_p_r_o.credentials;
    }
    default: {
      throw new Error(`Unknown environment ${env} found is CLOUD_CONFIG`);
    }
  }
}



export function assignGraphIdentity(_environment: EnvironmentConfig, _identity: string) {
  /*
   These are the identities/identifiers for accessing the MS Graph API.
   */
  if (!_identity) {
    throw new Error('When using cloud expected \'CLOUD_CONFIG\' in \'.env\'');
  }

  const identity = _identity.toLowerCase();
  _environment.graphAPIIdentity = identity;
  logger.info('Will access MS Graph using identity:', identity);
  _environment.graphAPIParameters = _assignGraphIdentity(identity);

  const external = new Map<string, GraphAPIParameters>();
  external.set(w_i_p_r_o.credentials.identity, _assignGraphIdentity(w_i_p_r_o.credentials.identity));
  _environment.externalGraphParameters = external;
  logger.info('Will access MS Graph using parameters:', _environment);
}


export function getServiceUser(env: string) {
  switch (env) {
    case 'buildit': {
      return buildit.serviceUserEmail;
    }
    default: {
      throw new Error(`No service user defined for this environment: ${env}`);
    }
  }
}


export function getExternalTeam(env: string) {
  switch (env) {
    case 'buildit': {
      return buildit.externalTeam;
    }
    default: {
      throw new Error(`No external team is defined for this environment: ${env}`);
    }
  }
}


export function getInternalTeam(env: string) {
  switch (env) {
    case 'buildit': {
      return buildit.internalTeam;
    }
    default: {
      throw new Error(`No internal team is defined for this environment: ${env}`);
    }
  }
}
