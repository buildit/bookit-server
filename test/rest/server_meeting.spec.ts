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
import {retryUntil} from "../../src/utils/retry";

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

  it('can query a room list for nyc', function testRoomList() {
    return request(app).get('/rooms/nyc')
                       .expect(200)
                       .then((res) => {
                         logger.info('', roomService);
                         return roomService.getRoomList('nyc')
                                           .then(roomList => {
                                             const rooms = roomList.rooms;
                                             return expect(rooms).to.be.deep.equal(res.body);
                                           })
                                           .catch(error => {
                                             logger.error(error);
                                             throw new Error('RLIA Should not be here');
                                           });
                       });
  });


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


  it('has expected meeting visibility without a token', function testMeetingVisibilityWithoutToken() {
    const meetingStart = '2013-02-08 09:00:00';
    const meetingEnd = '2013-02-08 09:30:00';

    const searchStart = '2013-02-08 08:55:00';
    const searchEnd = '2013-02-08 09:35:00';

    const title = 'meeting without a token';
    const meetingToCreate = {
      title: title,
      start: moment(meetingStart),
      duration: moment.duration(moment(meetingEnd).diff(moment(meetingStart), 'minutes'), 'minutes'),
      bruceOwner,
      whiteRoom
    };

    return meetingService.createUserMeeting(meetingToCreate.title,
                                            meetingToCreate.start,
                                            meetingToCreate.duration,
                                            meetingToCreate.bruceOwner,
                                            meetingToCreate.whiteRoom)
                         .then((meeting) => {
                           return request(app)
                             .get(`/rooms/nyc/meetings?start=${searchStart}&&end=${searchEnd}`)
                             .then(query => {
                               const roomMeetings = query.body as RoomMeetings[];
                               const allMeetings = roomMeetings.reduce((acc, room) => {
                                 acc.push.apply(acc, room.meetings);
                                 return acc;
                               }, []);

                               expect(allMeetings.length).to.be.equal(1);
                               const meeting = allMeetings[0];
                               const expected = expect(meeting.title).to.be.equal('bruce');

                               meetingService.clearCaches();

                               return expected;
                             });
                         })
                         .catch(error => {
                           return expect.fail(error);
                         });
  });

  it('has expected meeting visibility with a token', function testMeetingVisibilityWithToken() {
    const meetingStart = '2013-02-08 09:00:00';
    const meetingEnd = '2013-02-08 09:30:00';

    const searchStart = '2013-02-08 08:55:00';
    const searchEnd = '2013-02-08 09:35:00';

    const meetingToCreate = {
      title: 'meeting with token',
      start: moment(meetingStart),
      duration: moment.duration(moment(meetingEnd).diff(moment(meetingEnd), 'minutes'), 'minutes'),
      bruceOwner,
      whiteRoom
    };

    const token = jwtTokenProvider.provideToken(bruceCredentials);

    return meetingService.createUserMeeting(meetingToCreate.title,
                                            meetingToCreate.start,
                                            meetingToCreate.duration,
                                            meetingToCreate.bruceOwner,
                                            meetingToCreate.whiteRoom)
                         .then((meeting) => {
                           const meetingId = meeting.id;
                           return request(app)
                             .get(`/rooms/nyc/meetings?start=${searchStart}&&end=${searchEnd}`)
                             .set('x-access-token', token)
                             .then(query => {
                               const roomMeetings = query.body as RoomMeetings[];
                               const allMeetings = roomMeetings.reduce((acc, room) => {
                                 acc.push.apply(acc, room.meetings);
                                 return acc;
                               }, []);

                               const meetings = allMeetings.filter(m => m.id === meetingId);
                               expect(meetings.length).to.be.at.least(1);
                               const expected = expect(meetings[0].title).to.be.equal('meeting with token');

                               meetingService.clearCaches();

                               return expected;
                             });
                         })
                         .catch(error => {
                           return expect.fail(error);
                         });
  });


  it('deletes the meeting', function testDeletingAMeeting() {
    const meetingStart = '2013-02-08 09:00:00';
    const meetingEnd = '2013-02-08 09:30:00';

    const momentStart = moment(meetingStart);
    const momentEnd = moment(meetingEnd);
    const meetingDuration = moment.duration(30, 'minutes');

    const searchStart = momentStart.clone().subtract(5, 'minutes');
    const searchEnd = momentEnd.clone().add(5, 'minutes');

    return meetingService.createUserMeeting('test delete', momentStart, meetingDuration, bruceOwner, whiteRoom)
                         .then((meeting: Meeting) => {
                           logger.info('meeting to delete created!');
                           const meetingRoom = whiteRoom.email;
                           const meetingId = meeting.id;

                           const token = jwtTokenProvider.provideToken(bruceCredentials);

                           return request(app).delete(`/room/${meetingRoom}/meeting/${meetingId}`)
                                         .set('x-access-token', token)
                                         .expect(200)
                                         .then(() => {
                                           logger.info('delete completed');
                                            return meeting;
                                         })
                                         .catch((e) => {
                                           throw new Error(`Error deleting meeting ${e}`);
                                         });
                         })
                         .then((meeting) => {
                           return meetingService.findMeeting(whiteRoom, meeting.id, searchStart, searchEnd).should.eventually.be.rejected;
                         })
                         .catch(e => {
                           return expect.fail(e.message);
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


