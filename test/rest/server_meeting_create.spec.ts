import * as moment from 'moment';
import * as chai from 'chai';
import * as chai_as_promised from 'chai-as-promised';

const expect = chai.expect;
chai.use(chai_as_promised);
chai.should();

import * as express from 'express';
import * as request from 'supertest';

import {configureRoutes} from '../../src/rest/server';

import {MeetingRequest} from '../../src/rest/meetings/meeting_routes';

import {Runtime} from '../../src/config/runtime/configuration';
import {generateMSRoomResource, generateMSUserResource} from '../../src/config/bootstrap/rooms';
import {Meeting} from '../../src/model/Meeting';
import {retryUntilAtInterval} from '../../src/utils/retry';
import {stringToTomorrowEnd, stringToYesterdayStart} from '../../src/utils/moment_support';

const meetingService = Runtime.meetingService;
const jwtTokenProvider = Runtime.jwtTokenProvider;

const app = configureRoutes(express(),
                            Runtime.graphTokenProvider,
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


describe('meeting routes creation operations', function testMeetingRoutes() {


  it('creates the meeting', function testCreateMeeting() {
    const meetingStart = '2013-02-08 10:00:00';
    const meetingEnd = '2013-02-08 10:45:00';

    const meetingReq: MeetingRequest = {
      title: 'meeting 0',
      start: meetingStart,
      end: meetingEnd,
    };

    const expected = {
      title: 'meeting 0',
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
                       .then(response => {
                         const meeting = response.body as Meeting;

                         console.log('Meeting', meeting);
                         meetingService.clearCaches();

                         return expect(meeting.title).to.be.eq(expected.title);
                       });
  });


  it('fails to double book a meeting', async function testFailOnDoubleBooking() {
    const meetingStart = '2013-02-08 10:00:00';
    const meetingEnd = '2013-02-08 10:45:00';

    const meetingReq: MeetingRequest = {
      title: 'meeting 0',
      start: meetingStart,
      end: meetingEnd,
    };

    const expected = {
      title: 'meeting 0',
      start: moment(meetingReq.start),
      duration: moment.duration(moment(meetingReq.end).diff(moment(meetingReq.start), 'minutes'), 'minutes'),
      bruceOwner,
      whiteRoom
    };

    const token = jwtTokenProvider.provideToken(bruceCredentials);

    await request(app).post(`/room/${whiteRoom.email}/meeting`)
                      .set('Content-Type', 'application/json')
                      .set('x-access-token', token)
                      .send(meetingReq)
                      .expect(200)
                      .then(response => {
                        const meeting = response.body as Meeting;
                        expect(meeting.title).to.be.eq(expected.title);
                        return meeting;
                      });

    const searchStart = stringToYesterdayStart(meetingStart);
    const searchEnd = stringToTomorrowEnd(meetingEnd);

    /*
    We have to wait until it shows up in the room in order to show a conflict
     */
    await retryUntilAtInterval(50,
                               () => meetingService.getMeetings(whiteRoom, searchStart, searchEnd),
                               (meetings) => meetings.length > 0);


    return request(app).post(`/room/${whiteRoom.email}/meeting`)
                       .set('Content-Type', 'application/json')
                       .set('x-access-token', token)
                       .send(meetingReq)
                       .expect(412)
                       .then(() => {
                         console.info('Completed');
                         meetingService.clearCaches();
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


