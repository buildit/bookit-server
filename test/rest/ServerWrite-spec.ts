import {expect} from 'chai';
import * as express from 'express';
import * as request from 'supertest';
import {MeetingRequest, registerBookitRest} from '../../src/rest/server';
import {InmemMeetings} from '../../src/service/stub/InmemMeetings';
import {StubRooms} from '../../src/service/stub/StubRooms';

const stubRooms = new StubRooms(['white', 'black']);

// TODO: DI is a must!
const inmemMeetings = new InmemMeetings();
const app = registerBookitRest(express(), stubRooms, inmemMeetings);

describe('Meeting routes', () => {
  it('Create room actually creates the room', () => {
    const meetingReq: MeetingRequest = {
      title: 'meeting 0',
      start: '2013-02-08 09:00',
      end: '2013-02-09 09:00',
    };

    return request(app)
      .post('/room/white-room@designit.com@somewhere/meetings')
      .set('Content-Type', 'application/json')
      .send(meetingReq)
      .expect(200)
      .then((res) => {
        expect(inmemMeetings.lastAddedMeeting).to.be.deep.eq({
          title: 'meeting 0'
        });
      });
  });
});

