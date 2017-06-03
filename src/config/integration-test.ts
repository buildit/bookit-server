import AppEnv from './env';

import {EnvironmentConfig, TestMode} from '../model/EnvironmentConfig';
import {assignGraphIdentity} from './identity';


const integrationTestConfig: EnvironmentConfig = {
  port: 3000,
  testMode: TestMode.INTEGRATION
};

// integration tests require a graph identity
assignGraphIdentity(integrationTestConfig, AppEnv.CLOUD_CONFIG);

module.exports = integrationTestConfig;
