import * as moment from 'moment';
import * as chai from 'chai';
import * as chai_as_promised from 'chai-as-promised';

const expect = chai.expect;
chai.use(chai_as_promised);
chai.should();

import * as express from 'express';
import * as request from 'supertest';

import {RootLog as logger} from '../../src/utils/RootLogger';
import {configureRoutes} from '../../src/rest/server';

import {MeetingRequest} from '../../src/rest/meetings/meeting_routes';
import {Meeting} from '../../src/model/Meeting';

import {Runtime} from '../../src/config/runtime/configuration';
import {generateMSRoomResource, generateMSUserResource} from '../../src/config/bootstrap/rooms';
import {RoomMeetings} from '../../src/services/meetings/MeetingsOps';
import {retryUntil} from '../../src/utils/retry';

const roomService = Runtime.roomService;
const meetingService = Runtime.meetingService;
const jwtTokenProvider = Runtime.jwtTokenProvider;


const app = configureRoutes(express(),
                            Runtime.passwordStore,
                            jwtTokenProvider,
                            Runtime.roomService,
                            Runtime.userService,
                            Runtime.mailService,
                            meetingService);


const bruceOwner = generateMSUserResource('bruce', Runtime.meetingService.domain());
const whiteRoom = generateMSRoomResource('white', Runtime.meetingService.domain());

const bruceCredentials = {
  user: bruceOwner.email,
  password: 'who da boss?'
};


describe('meeting routes operations', function testMeetingRoutes() {


  it('creates the meeting', function testCreateMeeting() {
    const meetingStart = '2013-02-08 10:00:00';
    const meetingEnd = '2013-02-08 10:45:00';

    const meetingReq: MeetingRequest = {
      title: 'meeting 0',
      start: meetingStart,
      end: meetingEnd,
    };

    const searchStart = moment(meetingStart).subtract(5, 'minutes');
    const searchEnd = moment(meetingEnd).add(5, 'minutes');

    const expected = {
      title: bruceOwner.name,
      start: moment(meetingReq.start),
      duration: moment.duration(moment(meetingReq.end).diff(moment(meetingReq.start), 'minutes'), 'minutes'),
      bruceOwner,
      whiteRoom
    };

    const token = jwtTokenProvider.provideToken(bruceCredentials);

    return request(app).post(`/room/${whiteRoom.email}/meeting`)
                       .set('Content-Type', 'application/json')
                       .set('x-access-token', token)
                       .send(meetingReq)
                       .expect(200)
                       .then(() => meetingService.getMeetings(whiteRoom, searchStart, searchEnd))
                       .then((meetings) => {
                         meetingService.clearCaches();

                         expect(meetings.length).to.be.at.least(1, 'Expected to find at least one meeting');
                         const meeting = meetings[0];
                         return expect(meeting.title).to.be.deep.eq(expected.title);
                       });
  });


  it('validates parameters against the API properly', function testEndpointValidation() {
    const validationCases = [
      {
        message: 'End date must be after start date',
        data: {
          title: 'meeting 0',
          start: '2013-02-08 09:00:00',
          end: '2013-02-08 08:00:00',
        }
      },
      {
        message: 'Title must be provided',
        data: {
          title: '',
          start: '2013-02-08 08:00:00',
          end: '2013-02-08 09:00:00'
        }
      },
      {
        message: 'Start date must be provided',
        data: {
          title: 'baaad meeting',
          start: 'baad date',
          end: '2013-02-08 09:00:00'
        }
      },
    ];

    validationCases.forEach(c => {
      it(`Create room validations ${c.message}`, () => {
        const meetingReq: MeetingRequest = c.data;

        return request(app).post('/room/white-room@designit.com@somewhere/meeting')
                           .set('Content-Type', 'application/json')
                           .send(meetingReq)
                           .expect(400)
                           .then((res) => {
                             expect(JSON.parse(res.text).message).to.be.eq(c.message);
                           });
      });
    });
  });


});


