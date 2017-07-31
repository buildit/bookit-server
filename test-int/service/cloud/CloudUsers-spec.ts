import {expect} from 'chai';
import {Runtime} from '../../../src/config/runtime/configuration';
const svc = Runtime.userService;

describe('Cloud User services', function testUserService() {
  it('returns an array', function testGetUsers() {
    svc.listExternalUsers()
      .then(users => {
        expect(users).to.be.instanceOf(Array)
      })
      .catch(err => {
        expect(err).to.be.eq('Should not be here. The test failed.');
      });
  });
});
