import {RootLog as logger} from '../utils/RootLogger';

import {EnvironmentConfig} from '../model/EnvironmentConfig';
import AppEnv from './env';
import {assignGraphIdentity} from './identity';
import {getDomain} from './domain';


/*
Start creating the environment here
 */
const environment: EnvironmentConfig = {};

environment.domain = getDomain(AppEnv.CLOUD_CONFIG);

logger.info('Using cloud?', AppEnv.USE_CLOUD);
if (AppEnv.USE_CLOUD && AppEnv.USE_CLOUD === 'true') {
  logger.info('About to assign identity');
  assignGraphIdentity(environment, AppEnv.CLOUD_CONFIG);
}

environment.jwtTokenSecret = AppEnv.JWT_TOKEN_SECRET || 'testing secret';

module.exports = environment;
