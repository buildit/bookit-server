import AppEnv from './env';

import {RootLog as logger} from '../utils/RootLogger';

import {roman, test} from './identities';
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
