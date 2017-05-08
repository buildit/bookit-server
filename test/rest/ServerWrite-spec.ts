import * as moment from 'moment';
import {expect} from 'chai';
import * as express from 'express';
import * as request from 'supertest';

import {RootLog as logger} from '../../src/utils/RootLogger';
import {MeetingRequest, configureRoutes} from '../../src/rest/server';
import {StubRooms} from '../../src/service/stub/StubRooms';
import {MockMeetings} from '../service/MockMeetings';

const stubRooms = new StubRooms(['white', 'black']);

const svc = new MockMeetings();

const app = configureRoutes(express(), stubRooms, svc);

describe('Meeting routes write operations', () => {
  it('Create room actually creates the room', () => {
    const meetingReq: MeetingRequest = {
      title: 'meeting 0',
      start: '2013-02-08 09:00',
      end: '2013-02-09 09:00',
    };

    const expected = {
      subj: 'meeting 0',
      start: moment(meetingReq.start),
      duration: moment.duration(moment(meetingReq.end).diff(moment(meetingReq.start), 'minutes'), 'minutes'),
      owner: {
        email: 'romans@myews.onmicrosoft.com',
        name: 'Comes from the session!!!'
      },
      room: {
        email: 'white-room@designit.com@somewhere',
        name: 'room'
      }
    };

    return request(app).post('/room/white-room@designit.com@somewhere/meeting')
                       .set('Content-Type', 'application/json')
                       .send(meetingReq)
                       .expect(200)
                       .then(() => {
                         expect(svc.lastAdded).to.be.deep.eq(expected);
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

