import * as assert from 'assert';
import {roman, contoso, test} from './credentials';
import {EnvironmentConfig} from '../model/EnvironmentConfig';
import AppEnv from './env';


const environment: EnvironmentConfig = {};

function assignEnvironment(env: string) {
  switch (env) {
    case 'roman': {
      return roman;
    }
    case 'contoso': {
      return contoso;
    }
    case 'test': {
      return test;
    }
    default: {
      throw new Error('Unknown environment found is CLOUD_CONFIG');
    }
  }

}

if (AppEnv.USE_CLOUD) {
  /*
   These are the credentials/identifiers for accessing the MS Graph API.
   */
  const configName = AppEnv.CLOUD_CONFIG.toLowerCase();
  environment.graphAPIParameters = assignEnvironment(configName);
}

environment.jwtTokenSecret = AppEnv.JWT_TOKEN_SECRET || 'testing secret';

module.exports = environment;
