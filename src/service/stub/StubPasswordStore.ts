import {PasswordStore} from '../PasswordStore';

interface UserDetail {
  password: string;
  id: number;
}

const userPasswords = new Map<string, UserDetail>();
userPasswords.set('bruce@myews.onmicrosoft.com', {password: 'who da boss?', id: 1});
userPasswords.set('babs@myews.onmicrosoft.com', {password: 'call me barbra', id: 2});
userPasswords.set('romans@myews.onmicrosoft.com', {password: 'enterprise: engage', id: 3});



export class StubPasswordStore implements PasswordStore {
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
