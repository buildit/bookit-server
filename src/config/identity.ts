import AppEnv from './env';

import {RootLog as logger} from '../utils/RootLogger';

import {roman, contoso, test, digital} from './identities';
import {EnvironmentConfig} from '../model/EnvironmentConfig';

function _assignGraphIdentity(env: string) {
  switch (env) {
    case 'roman': {
      roman.clientSecret = AppEnv.ROMAN_SECRET;
      return roman;
    }
    case 'contoso': {
      contoso.clientSecret = AppEnv.CONTOSO_SECRET;
      return contoso;
    }
    case 'test': {
      test.clientSecret = AppEnv.TEST_SECRET;
      return test;
    }
    case 'digital': {
      digital.clientSecret = AppEnv.DIGITAL_SECRET;
      return digital;
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
}
