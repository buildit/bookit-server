import {roman, test, defaultIdentity} from './identities';
import {Domain} from '../model/EnvironmentConfig';


export function getDomain(_env: string): Domain {
  if (!_env) {
    return defaultIdentity.domain;
  }
  switch (_env.toLowerCase()) {
    case 'roman': {
      return roman.domain;
    }
    case 'test': {
      return test.domain;
    }
    default: {
      return defaultIdentity.domain;
    }
  }
}
