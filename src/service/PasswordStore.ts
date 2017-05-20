
export interface PasswordStore {
  validateUser(user: string): boolean;
  validatePassword(user: string, passwrod: string): boolean;
}
