import * as moment from 'moment';
import {expect} from 'chai';

import {Runtime} from '../../../src/config/runtime/configuration';
import {getToken} from '../../../src/services/meetings/MeetingsSupport';
import {Perspective} from '../../../src/model/Meeting';
import {Participant} from '../../../src/model/Participant';
import {MOCK_APP_TOKEN} from '../../../src/services/tokens/MockGraphTokenOperations';

const mockTokenProvider = Runtime.graphTokenProvider;
const mockUserService = Runtime.userService;

describe('meeting support suite', function startDateCachingSuite() {
  it('should get an app token for the room', async function testsGetTokenForRoom() {
    const fetchedToken = await getToken(mockTokenProvider, mockUserService, Perspective.ROOM, 'irrelevant');

    expect(fetchedToken).to.be.equal(MOCK_APP_TOKEN);
  });


  it('should get an app token for an internal user', async function testsGetTokenForInternal() {
    const internalUser = new Participant(`user@${Runtime.domain.domainName}`, 'User');

    // MockService returns a distinct pattern for user tokens
    const internalToken = await getToken(mockTokenProvider, mockUserService, Perspective.USER, internalUser.email);
    expect(internalToken).to.be.equal(MOCK_APP_TOKEN);

  });

  it('should get a "user" token for an external user', async function testsGetTokenForInternal() {
    const externalUser = new Participant('user@externaldomain.com', 'User');

    const externalToken = await getToken(mockTokenProvider, mockUserService, Perspective.USER, externalUser.email);
    expect(externalToken).to.be.equal(`x${externalUser.email}x`);
  });

});
