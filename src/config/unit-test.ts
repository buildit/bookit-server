import {EnvironmentConfig, TestMode} from '../model/EnvironmentConfig';

const unitTestConfig: EnvironmentConfig = {
  port: 3000,
  testMode: TestMode.UNIT
};

module.exports = unitTestConfig;
