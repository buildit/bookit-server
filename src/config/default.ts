import {RootLog as logger} from '../utils/RootLogger';

import {EnvironmentConfig} from '../model/EnvironmentConfig';
import AppEnv from './env';
import {assignGraphIdentity} from './identity';
import {getDomain} from './domain';


const checkFlag = (flag: string): boolean => {
  if (!flag) {
    return false;
  }

  return flag.toLowerCase() === 'true';
};


function buildEnvironment() {
  const environment: EnvironmentConfig = {};
  environment.domain = getDomain(AppEnv.CLOUD_CONFIG);

  logger.info('Using azure?', AppEnv.USE_AZURE);
  if (AppEnv.USE_AZURE && AppEnv.USE_AZURE === 'true') {
    logger.info('About to assign identity');
    assignGraphIdentity(environment, AppEnv.CLOUD_CONFIG);
  }

  environment.jwtTokenSecret = AppEnv.JWT_TOKEN_SECRET || 'testing secret';

  environment.useMeetingCache = !checkFlag(AppEnv.MEETING_CACHE_DISABLED);
  environment.useGroupCache = !checkFlag(AppEnv.GROUP_CACHE_DISABLED);

  logger.info('Meeting Cache enabled:', environment.useMeetingCache);
  logger.info('Group Cache enabled:', environment.useGroupCache);
  return environment;
}

module.exports = buildEnvironment();
