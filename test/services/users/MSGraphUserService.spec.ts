import * as chai from 'chai';
import * as chai_as_promised from 'chai-as-promised';

import {NockManager} from '../../NockManager';

const expect = chai.expect;
chai.use(chai_as_promised);
chai.should();

import {Runtime} from '../../../src/config/runtime/configuration';

import {MockGraphTokenProvider} from '../../../src/services/tokens/MockGraphTokenOperations';
import {MSGraphUserService} from '../../../src/services/users/MSGraphUserService';

describe('User Service', function testReturnRoom() {
  const nockManager = new NockManager();
  let service: MSGraphUserService;
  beforeEach(() => {
    const provider = new MockGraphTokenProvider(Runtime.domain.domainName);
    service = new MSGraphUserService(provider);
  });

  it('returns the correct list of external users', async function testExternalUsers() {
    nockManager.setupContactList();
    const externalUsers = await service.listExternalUsers();

    expect(externalUsers.length).to.equal(1);
    expect(externalUsers[0].email).to.equal('bruce@builditcontoso.onmicrosoft.com');
    expect(externalUsers[0].team).to.equal('WIPRO');
    expect(externalUsers[0].roles.length).to.equal(0);
    expect(externalUsers[0].createdDateTime).to.equal('2017-07-31T18:04:13Z');
    expect(externalUsers[0].firstName).to.equal('');
    expect(externalUsers[0].lastName).to.equal('');
  });

  it('returns the correct list of internal users', async function testInternalUsers() {
    nockManager.setupInternalUsersWithoutRooms();
    const internalUsers = await service.listInternalUsers();
    expect(internalUsers.length).to.equal(1);
  });

  it('filters out rooms from the internal users list', async function testInternalRooms() {
    nockManager.setupInternalUsersPlusRooms();
    const internalUsers = await service.listInternalUsers();
    expect(internalUsers.filter(user => user.email.match(/-room/)).length).to.equal(0);
  });

  it('validates an external user that exists', async function testValidExternalUser() {
    nockManager.setupContactList();
    const isValid = await service.validateUser('bruce@builditcontoso.onmicrosoft.com')
    expect(isValid).to.be.true;
  });

  it('validates an external user that does not exist', async function testInvalidExternalUser() {
    nockManager.setupContactList();
    const isValid = await service.validateUser('what@why.com')
    expect(isValid).to.be.false;
  });
});
