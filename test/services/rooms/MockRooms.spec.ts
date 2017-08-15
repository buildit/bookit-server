import * as chai from 'chai';
import * as chai_as_promised from 'chai-as-promised';

const expect = chai.expect;
chai.use(chai_as_promised);
chai.should();

import {MockRoomService} from '../../../src/services/rooms/MockRoomService';
import {Participant} from '../../../src/model/Participant';

const svc = new MockRoomService([
  {
    id: '1',
    name: 'room list',
    rooms: [ new Participant('test@test', 'room1') ]
  }
]);

describe('Room list', function testReturnRoom() {
  it('provides a room list', () => {
    const roomList = svc.getRooms('room list');
    expect(roomList).to.exist;
  });

  it('returns not found when requested list does not exist', function testMissingRoomListRejected() {
    return svc.getRooms('nyc').should.eventually.be.rejected;
  });
});
