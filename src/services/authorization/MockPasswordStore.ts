import {PasswordStore} from './PasswordStore';

import {testAppADusers} from '../../config/identities/test/credentials';

interface UserDetail {
  password: string;
  id: number;
}

let counter = 1;

const userPasswords = new Map<string, UserDetail>();
userPasswords.set('bruce@myews.onmicrosoft.com', {password: 'who da boss?', id: counter++});
userPasswords.set('babs@myews.onmicrosoft.com', {password: 'call me barbra', id: counter++});
userPasswords.set('romans@myews.onmicrosoft.com', {password: 'enterprise: engage', id: counter++});

Object.keys(testAppADusers).forEach(user => {
  const userMap = testAppADusers as any;
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
