import {roman, contoso, test, digital, defaultIdentity} from './identities';
import {Domain} from '../model/EnvironmentConfig';


export function getDomain(_env: string): Domain {
  if (!_env) {
    return defaultIdentity.domain;
  }
  switch (_env.toLowerCase()) {
    case 'roman': {
      return roman.domain;
    }
    case 'contoso': {
      return contoso.domain;
    }
    case 'test': {
      return test.domain;
    }
    case 'digital': {
      return digital.domain;
    }
    default: {
      return defaultIdentity.domain;
    }
  }
}
