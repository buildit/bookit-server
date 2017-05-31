import * as chai from 'chai';
import {StubRoomService} from '../../../src/services/stub/StubRoomService';
import DateTimeFormat = Intl.DateTimeFormat;

const expect = chai.expect;

describe('stub rooms', () => {
  it('should generate one room per name and use list name as a prefix', () => {
    const rooms = new StubRoomService(['a', 'b']);
    expect(rooms.getRooms('test')).to.be.deep.equal({
      found: true,
      rooms: [
        {name: 'test-a room', email: 'test-a-room@designit.com'},
        {name: 'test-b room', email: 'test-b-room@designit.com'}
      ]
    });
  });
});
