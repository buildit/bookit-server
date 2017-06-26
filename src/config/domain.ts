import {roman, contoso, test, digital, defaultIdentity} from './identities';
import {Domain} from '../model/EnvironmentConfig';


export function getDomain(_env: string): Domain {
  const env = _env.toLowerCase();
  switch (env) {
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
