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

export function setupDefaultEnvironment(env: EnvironmentConfig) {
  env.domain = getDomain(AppEnv.CLOUD_CONFIG);

  logger.info('Using azure?', AppEnv.USE_AZURE);
  if (AppEnv.USE_AZURE && AppEnv.USE_AZURE === 'true') {
    logger.info('About to assign identity');
    assignGraphIdentity(env, AppEnv.CLOUD_CONFIG);
  }

  env.jwtTokenSecret = AppEnv.JWT_TOKEN_SECRET || 'testing secret';

  env.useMeetingCache = !checkFlag(AppEnv.MEETING_CACHE_DISABLED);
  env.useGroupCache = !checkFlag(AppEnv.GROUP_CACHE_DISABLED);

  logger.info('Meeting Cache enabled:', env.useMeetingCache);
  logger.info('Group Cache enabled:', env.useGroupCache);
}
