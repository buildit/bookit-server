import {expect} from 'chai';
import {Runtime} from '../../../src/config/runtime/configuration';
const svc = Runtime.userService;

describe('Cloud User services', function testUserService() {
  it('returns a list of users', function testGetUsers() {
    return svc.getUsers().then(users => {
      const user0 = users[0];
      //noinspection BadExpressionStatementJS
      expect(user0.id).to.be.string;
      //noinspection BadExpressionStatementJS
      expect(user0.displayName).to.be.string;
    });
  });
});
