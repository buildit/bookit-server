import {EnvironmentConfig, TestMode} from '../model/EnvironmentConfig';


const integrationTestConfig: EnvironmentConfig = {
  port: 3000,
  testMode: TestMode.INTEGRATION
};

module.exports = integrationTestConfig;
