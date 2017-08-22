import {test, defaultIdentity, buildit} from './identities';
import {Domain} from '../model/EnvironmentConfig';


export function getDomain(_env: string): Domain {
  if (!_env) {
    return defaultIdentity.domain;
  }
  switch (_env.toLowerCase()) {
    case 'test': {
      return test.domain;
    }
    case 'buildit': {
      return buildit.domain;
    }
    default: {
      return defaultIdentity.domain;
    }
  }
}
