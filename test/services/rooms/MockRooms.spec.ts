import * as chai from 'chai';
import * as chai_as_promised from 'chai-as-promised';

const expect = chai.expect;
chai.use(chai_as_promised);
chai.should();

import {MockRoomService} from '../../../src/services/rooms/MockRoomService';

const svc = new MockRoomService([
  {
    id: '1',
    name: 'room list',
    rooms: [
      {
        id: '2',
        name: 'room1',
        email: 'test@test',
        mail: 'test@test'
      }]}
]);

describe('Room list', function() {
  it('provides a room list', () => {
    const roomList = svc.getRooms('room list');
    expect(roomList).to.exist;
  });

  it('returns not found when requested list does not exist', function() {
    svc.getRooms('nyc').should.eventually.be.length(1);
  });
});
