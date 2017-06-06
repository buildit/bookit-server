import * as nodeConfig from 'config';

import {RootLog as logger} from '../../utils/RootLogger';

import {RuntimeConfig} from '../../model/RuntimeConfig';
import {EnvironmentConfig, TestMode} from '../../model/EnvironmentConfig';

import {provideDevelopmentRuntime} from './development';
import {provideUnitRuntime} from './unit';
import {provideIntegrationRuntime} from './integration';

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
