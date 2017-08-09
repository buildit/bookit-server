import {PasswordStore} from './PasswordStore';

import {AppADusers} from '../../config/identities/builditcontoso/credentials';

interface UserDetail {
  password: string;
  id: number;
}

let counter = 1;

const userPasswords = new Map<string, UserDetail>();
userPasswords.set('bruce@myews.onmicrosoft.com', {password: 'who da boss?', id: counter++});
userPasswords.set('babs@myews.onmicrosoft.com', {password: 'call me barbra', id: counter++});
userPasswords.set('romans@myews.onmicrosoft.com', {password: 'enterprise: engage', id: counter++});
userPasswords.set('rasmus@designit.com', {password: 'hey', id: 4});
userPasswords.set('z', {password: 'z', id: 5});
userPasswords.set('roodmin@designitcontoso.onmicrosoft.com', {password: 'yo', id: counter++});


Object.keys(AppADusers).forEach(user => {
  const userMap = AppADusers as any;
  userPasswords.set(user, {password: userMap[user], id: counter++});
});


export class MockPasswordStore implements PasswordStore {
  getUserId(user: string): number {
    const details = userPasswords.get(user);
    return details.id;
  }

  validateUser(user: string): boolean {
    const details = userPasswords.get(user);
    return !!details;
  }

  validatePassword(user: string, _password: string): boolean {
    const details = userPasswords.get(user);
    return details.password === _password;
  }
}
