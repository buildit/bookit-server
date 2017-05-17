import {expect} from 'chai';
import {Runtime} from '../../../src/config/runtime/configuration';
const svc = Runtime.userService;

describe('Cloud User service', () => {
  it('returns a list of users', () => {
    return svc.getUsers().then(users => {
      console.log(JSON.stringify(users));
      const user0 = users.value[0];
      //noinspection BadExpressionStatementJS
      expect(user0.id).to.be.string;
      //noinspection BadExpressionStatementJS
      expect(user0.displayName).to.be.string;
    });
  });
});
