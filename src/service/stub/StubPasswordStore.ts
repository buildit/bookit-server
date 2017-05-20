import {PasswordStore} from '../PasswordStore';

const userPasswords = new Map<string, string>();
userPasswords.set('bruce@myews.onmicrosoft.com', 'who\'s da boss?');
userPasswords.set('romans@myews.onmicrosoft.com', 'ROMANS');



export class StubPasswordStore implements PasswordStore {
  validateUser(user: string): boolean {
    const password = userPasswords.get(user);
    return !!password;
  }

  validatePassword(user: string, _password: string): boolean {
    const password = userPasswords.get(user);
    return password === _password;
  }
}
