import * as nodeConfig from 'config';

import {RootLog as logger} from '../../utils/RootLogger';

import {RuntimeConfig} from '../../model/RuntimeConfig';
import {EnvironmentConfig, TestMode} from '../../model/EnvironmentConfig';

import {provideDevelopmentRuntime} from './development-runtime';
import {provideUnitRuntime} from './unit-runtime';
import {provideIntegrationRuntime} from './integration-runtime';

const environment = nodeConfig as EnvironmentConfig;

/*
Start of run-time configuration creation
 */
function providerRuntime(): RuntimeConfig {
  switch (environment.testMode) {
    case TestMode.NONE:
      return provideDevelopmentRuntime(environment);
    case TestMode.UNIT:
      return provideUnitRuntime(environment);
    case TestMode.INTEGRATION:
      return provideIntegrationRuntime(environment);
  }
}

const __runtime = providerRuntime();
export const Runtime = __runtime;
