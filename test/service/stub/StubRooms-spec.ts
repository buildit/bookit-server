import * as chai from 'chai';
import DateTimeFormat = Intl.DateTimeFormat;
import * as moment from 'moment';
import {Meeting} from '../../../src/model/Meeting';
import {StubMeetings} from '../../../src/service/stub/StubMeetings';
import {StubRooms} from '../../../src/service/stub/StubRooms';

const expect = chai.expect;

describe('stub rooms', () => {
  it('should generate one room per name and use list name as a prefix', () => {
    const rooms = new StubRooms(['a', 'b']);
    expect(rooms.getRooms('test')).to.be.deep.equal([
      {name: 'test-a room', email: 'test-a-room@designit.com'},
      {name: 'test-b room', email: 'test-b-room@designit.com'}
      ]);
  });
});
