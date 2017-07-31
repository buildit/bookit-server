import AppEnv from './env';

import {RootLog as logger} from '../utils/RootLogger';

import {roman, test, buildit} from './identities';
import {EnvironmentConfig, GraphAPIParameters} from '../model/EnvironmentConfig';


function _assignGraphIdentity(env: string): GraphAPIParameters {
  switch (env) {
    case 'roman': {
      roman.credentials.clientSecret = AppEnv.ROMAN_SECRET;
      return roman.credentials;
    }
    case 'test': {
      test.credentials.clientSecret = AppEnv.TEST_SECRET;
      return test.credentials;
    }
    case 'buildit': {
      buildit.credentials.clientSecret = AppEnv.BUILDIT_SECRET;
      return buildit.credentials;
    }
    default: {
      throw new Error('Unknown environment found is CLOUD_CONFIG');
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
  logger.info('Will access MS Graph using parameters:', _environment.graphAPIParameters);
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
