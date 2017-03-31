import {expect} from 'chai';
import {CloudUsers} from '../../../src/service/cloud/CloudUsers';
const svc = new CloudUsers();

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
