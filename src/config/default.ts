import * as assert from 'assert';
import {EnvironmentConfig} from '../model/EnvironmentConfig';
import AppEnv from './env';


const configuration: EnvironmentConfig = {};


if (AppEnv.USE_CLOUD) {
  /*
   These are the credentials/identifiers for accessing the MS Graph API.
   */
  const clientSecret = AppEnv.MICROSOFT_CLIENT_SECRET;
  const tenantId = '92261769-1013-420f-8d22-32da90a97f5b';
  const clientId = '3140930b-1a27-4e28-8139-d350e3c30843';

  assert(clientSecret, 'Please set MICROSOFT_CLIENT_SECRET in your env');

  const tokenEndpoint = 'https://login.windows.net/' + tenantId + '/oauth2/token';

  configuration.graphAPIParameters = {
    tenantId,
    clientId,
    clientSecret,
    tokenEndpoint
  };
}

configuration.jwtTokenSecret = AppEnv.JWT_TOKEN_SECRET || 'testing secret';

module.exports = configuration;
