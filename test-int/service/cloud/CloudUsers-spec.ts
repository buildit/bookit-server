import {expect} from 'chai';
import {Runtime} from '../../../src/config/runtime/configuration';
const svc = Runtime.userService;

describe('Cloud User services', function testUserService() {
  it('returns a list of users', function testGetUsers() {
    return svc.getUsers().then(() => {
      throw new Error('Should not be here.')
    })
    .catch(err => {
      expect(err).to.be.eq('Not implemented yet.');
    });
  });
});
