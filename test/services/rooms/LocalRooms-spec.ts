import {expect} from 'chai';
import {MockRoomService} from '../../../src/services/rooms/MockRoomService';

const svc = new MockRoomService([
  {name: 'room list', rooms: [{name: 'room1', email: 'test@test'}]}
]);

describe('Room list', () => {
  it('provides a room list', () => {
    const roomList = svc.getRooms('room list');
    expect(roomList).to.exist;
  });

  it('returns not found when requested list does not exist', () => {
    const roomList = svc.getRooms('nyc');
    expect(roomList.found).to.be.false;
  });
});
