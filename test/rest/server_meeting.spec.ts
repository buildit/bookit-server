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

import {Participant} from '../../src/model/Participant';
import {MeetingRequest} from '../../src/rest/meetings/meeting_routes';
import {Meeting} from '../../src/model/Meeting';

import {Runtime} from '../../src/config/runtime/configuration';
import {UserDetail} from '../../src/rest/auth_routes';
import {Room} from '../../src/model/Room';
import {generateMSRoomResource, generateMSUserResource} from '../../src/config/bootstrap/rooms';
import {RoomMeetings} from '../../src/services/meetings/MeetingsOps';

const roomService = Runtime.roomService;
const meetingService = Runtime.meetingService;
const jwtTokenProvider = Runtime.jwtTokenProvider;


const app = configureRoutes(express(),
                            Runtime.passwordStore,
                            jwtTokenProvider,
                            Runtime.roomService,
                            Runtime.userService,
                            meetingService);


const bruceOwner = generateMSUserResource('bruce', Runtime.meetingService.domain());
const room = generateMSRoomResource('white', Runtime.meetingService.domain());

const bruceCredentials = {
  user: bruceOwner.email,
  password: 'who da boss?'
};


describe('meeting routes operations', function testMeetingRoutes() {

  it('room list is available on /rooms/nyc', function testRoomList() {
    return request(app).get('/rooms/nyc')
                       .expect(200)
                       .then((res) => {
                         logger.info('', roomService);
                         return roomService.getRoomList('nyc')
                                           .then(roomList => {
                                             const rooms = roomList.rooms;
                                             expect(rooms).to.be.deep.equal(res.body);
                                           })
                                           .catch(error => {
                                             logger.error(error);
                                             throw new Error('RLIA Should not be here');
                                           });
                       });
  });

  it('it creates the meeting', function testCreateMeeting() {
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
      room
    };

    const token = jwtTokenProvider.provideToken(bruceCredentials);

    return request(app).post(`/room/${room.email}/meeting`)
                       .set('Content-Type', 'application/json')
                       .set('x-access-token', token)
                       .send(meetingReq)
                       .expect(200)
                       .then(() => meetingService.getMeetings(room, searchStart, searchEnd))
                       .then((meetings) => {
                         expect(meetings.length).to.be.at.least(1, 'Expected to find at least one meeting');

                         const meeting = meetings[0];

                         expect(meeting.title).to.be.deep.eq(expected.title);
                       });
  });

  it('it tests meeting visibility without a token', function testMeetingVisibilityWithoutToken() {
    const meetingStart = '2013-02-08 09:00:00';
    const meetingEnd = '2013-02-08 09:30:00';

    const searchStart = '2013-02-08 08:55:00';
    const searchEnd = '2013-02-08 09:35:00';

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
      room
    };

    return meetingService.createMeeting(expected.title,
                                        expected.start,
                                        expected.duration,
                                        expected.bruceOwner,
                                        expected.room)
                         .then((meeting) => {
                           const meetingId = meeting.id;
                           return request(app)
                             .get(`/rooms/nyc/meetings?start=${searchStart}&&end=${searchEnd}`)
                             .then(query => {
                               const roomMeetings = query.body as RoomMeetings[];
                               const allMeetings = roomMeetings.reduce((acc, room) => {
                                 acc.push.apply(acc, room.meetings);
                                 return acc;
                               }, []);

                               const meetings = allMeetings.filter(m => m.id === meetingId);
                               expect(meetings.length).to.be.at.least(1);
                               return expect(meetings[0].title).to.be.equal('bruce');
                             });
                         });
  });


  it('it tests meeting visibility with a token', function testMeetingVisibilityWithToken() {
    const meetingStart = '2013-02-08 09:00:00';
    const meetingEnd = '2013-02-08 09:30:00';

    const searchStart = '2013-02-08 08:55:00';
    const searchEnd = '2013-02-08 09:35:00';

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
      room
    };


    const token = jwtTokenProvider.provideToken(bruceCredentials);
    console.info('Token', token);

    return meetingService.createMeeting(expected.title,
                                        expected.start,
                                        expected.duration,
                                        expected.bruceOwner,
                                        expected.room)
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
                               return expect(meetings[0].title).to.be.equal('meeting 0');
                             });
                         });
  });


  it('it deletes the meeting', function testDeletingAMeeting() {
    const meetingStart = '2013-02-08 09:00:00';
    const meetingEnd = '2013-02-08 09:30:00';

    const momentStart = moment(meetingStart);
    const momentEnd = moment(meetingEnd);
    const meetingDuration = moment.duration(30, 'minutes');

    const searchStart = momentStart.clone().subtract(5, 'minutes');
    const searchEnd = momentEnd.clone().add(5, 'minutes');

    return meetingService.createMeeting('test delete', momentStart, meetingDuration, bruceOwner, room)
                         .then((meeting: Meeting) => {
                           logger.info('meeting to delete created!');
                           const meetingRoom = room.email;
                           const meetingId = meeting.id;

                           const token = jwtTokenProvider.provideToken(bruceCredentials);

                           return new Promise<Meeting>((resolve) => {
                             request(app).delete(`/room/${meetingRoom}/meeting/${meetingId}`)
                                         .set('x-access-token', token)
                                         .then(() => {
                                           logger.info('delete completed');
                                           resolve(meeting);
                                         });
                           });
                         })
                         .then((meeting) => {
                           return meetingService.findMeeting(room, meeting.id, searchStart, searchEnd).should.eventually.be.rejected;
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


