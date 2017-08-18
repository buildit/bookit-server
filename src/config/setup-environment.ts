import {RootLog as logger} from '../utils/RootLogger';

import {EnvironmentConfig} from '../model/EnvironmentConfig';
import AppEnv from './env';
import {assignGraphIdentity} from './identity';
import {getDomain} from './domain';

const isTrue = (flag: string): boolean => {
  return (flag === 'true');
};

export function setupDefaultEnvironment(env: EnvironmentConfig) {
  env.domain = getDomain(AppEnv.CLOUD_CONFIG);

  logger.info('Using azure?', AppEnv.USE_AZURE);
  if (AppEnv.USE_AZURE && AppEnv.USE_AZURE === 'true') {
    logger.info('About to assign identity');
    assignGraphIdentity(env, AppEnv.CLOUD_CONFIG);
  }

  env.jwtTokenSecret = AppEnv.JWT_TOKEN_SECRET || 'testing secret';

  env.useMeetingCache = !isTrue(AppEnv.MEETING_CACHE_DISABLED);
  env.useGroupCache = !isTrue(AppEnv.GROUP_CACHE_DISABLED);

  logger.info('Meeting Cache enabled:', env.useMeetingCache);
  logger.info('Group Cache enabled:', env.useGroupCache);
}
