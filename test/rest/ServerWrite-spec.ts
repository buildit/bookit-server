import {expect} from 'chai';
import * as express from 'express';
import {Duration, Moment} from 'moment';
import * as request from 'supertest';
import {Meeting} from '../../src/model/Meeting';
import {Participant} from '../../src/model/Participant';
import {MeetingRequest, registerBookitRest} from '../../src/rest/server';
import {Meetings} from '../../src/service/Meetings';
import {StubRooms} from '../../src/service/stub/StubRooms';
import * as moment from 'moment';

const stubRooms = new StubRooms(['white', 'black']);

class MockMeetings implements Meetings {

  lastAdded: any;

  createEvent(subj: string, start: moment.Moment, duration: moment.Duration, owner: Participant, room: Participant): Promise<any> {
    this.lastAdded = {subj, start, duration, owner, room};
    return new Promise<any>((resolve, reject) => resolve({data: 'new event'}));
  }

  getMeetings(email: string, start: Moment, end: Moment): Promise<Meeting[]> {
    return new Promise((resolve) => resolve([]));
  }

  deleteEvent(owner: string, id: string): Promise<any> {
    throw 'NOT USED';
  }
}

const svc = new MockMeetings();

const app = registerBookitRest(express(), stubRooms, svc);

describe('Meeting routes', () => {
  it('Create room actually creates the room', () => {
    const meetingReq: MeetingRequest = {
      title: 'meeting 0',
      start: '2013-02-08 09:00',
      end: '2013-02-09 09:00',
    };

    return request(app)
      .post('/room/white-room@designit.com@somewhere/meeting')
      .set('Content-Type', 'application/json')
      .send(meetingReq)
      .expect(200)
      .then(() => {
        expect(svc.lastAdded).to.be.deep.eq({
          subj: 'meeting 0',
          start: moment(meetingReq.start),
          duration: moment.duration(moment(meetingReq.end).diff(moment(meetingReq.start), 'minutes'), 'minutes'),
          owner: {email: 'romans@myews.onmicrosoft.com', name: 'Comes from the session!!!'},
          room: {email: 'white-room@designit.com@somewhere', name: 'room'}
        });
      });
  });

  const validationCases = [
    {
      message: 'End date must be after start date',
      data: {
        title: 'meeting 0',
        start: '2013-02-08 09:00',
        end: '2013-02-08 08:00',
      }
    },
    {
      message: 'Title must be provided',
      data: {
        title: '',
        start: '2013-02-08 08:00',
        end: '2013-02-08 09:00'
      }
    },
    {
      message: 'Start date must be provided',
      data: {
        title: 'baaad meeting',
        start: 'baad date',
        end: '2013-02-08 09:00'
      }
    },
  ];

  validationCases.forEach(c => {
    it(`Create room validations ${c.message}`, () => {
      const meetingReq: MeetingRequest = c.data;

      return request(app)
        .post('/room/white-room@designit.com@somewhere/meeting')
        .set('Content-Type', 'application/json')
        .send(meetingReq)
        .expect(400)
        .then((res) => {
          expect(JSON.parse(res.text).message).to.be.eq(c.message);
        });
    });

  });

});

