
export interface PasswordStore {
  validateUser(user: string): boolean;
  getUserId(user: string): number;
  validatePassword(user: string, passwrod: string): boolean;
}
