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
import {MeetingRequest} from '../../src/rest/meeting_routes';
import {Meeting} from '../../src/model/Meeting';

import {Runtime} from '../../src/config/runtime/configuration';
import {UserDetail} from '../../src/rest/auth_routes';

const roomService = Runtime.roomService;
const meetingService = Runtime.meetingService;


const app = configureRoutes(express(), Runtime.passwordStore, Runtime.jwtTokenProvider, Runtime.roomService, Runtime.userService, meetingService);

const owner = new Participant('romans@myews.onmicrosoft.com', 'person');
const room = new Participant('white-room@myews.onmicrosoft.com', 'room');


describe('meeting routes operations', function testMeetingRoutes() {

  it('room list is available on /rooms/nyc', function testRoomList() {
    return request(app).get('/rooms/nyc')
                       .expect(200)
                       .then((res) => {
                         roomService.getRoomList('nyc')
                                    .then(roomList => {
                                      const rooms = roomList.rooms;
                                      expect(rooms).should.eventually.be.deep.equal(res.body);
                                    })
                                    .catch(error => {
                                      throw new Error('Should not be here');
                                    });
                       });
  });

  it('it creates the meeting', function testCreateMeeting() {
    const meetingStart = '2013-02-08 09:00';
    const meetingEnd = '2013-02-09 09:00';

    const meetingReq: MeetingRequest = {
      title: 'meeting 0',
      start: meetingStart,
      end: meetingEnd,
    };

    const searchStart = moment(meetingStart).subtract(5, 'minutes');
    const searchEnd = moment(meetingEnd).add(5, 'minutes');

    const expected = {
      title: 'meeting 0',
      start: moment(meetingReq.start),
      duration: moment.duration(moment(meetingReq.end).diff(moment(meetingReq.start), 'minutes'), 'minutes'),
      owner,
      room
    };

    return request(app).post(`/room/${room.email}/meeting`)
                       .set('Content-Type', 'application/json')
                       .send(meetingReq)
                       .expect(200)
                       .then(() => meetingService.getMeetings(room.email, searchStart, searchEnd))
                       .then((meetings) => {
                         expect(meetings).to.be.length(1, 'Expected to find one created meeting');

                         const meeting = meetings[0];

                         expect(meeting.title).to.be.deep.eq(expected.title);
                       });
  });

  it('it deletes the meeting', function testDeletingAMeeting() {
    const meetingStart = '2013-02-08 09:00';
    const meetingEnd = '2013-02-08 09:30';

    const momentStart = moment(meetingStart);
    const momentEnd = moment(meetingEnd);
    const meetingDuration = moment.duration(30, 'minutes');

    const searchStart = momentStart.clone().subtract(5, 'minutes');
    const searchEnd = momentEnd.clone().add(5, 'minutes');

    return meetingService.createMeeting('test delete', momentStart, meetingDuration, owner, room)
                         .then((meeting: Meeting) => {
                           const meetingRoom = room.email;
                           const meetingId = meeting.id;

                           return new Promise<Meeting>((resolve) => {
                             request(app).delete(`/room/${meetingRoom}/meeting/${meetingId}`)
                                         .then(() => resolve(meeting));
                           });
                         })
                         .then((meeting) => {
                           return meetingService.findMeeting(room.email, meeting.id, searchStart, searchEnd).should.eventually.be.rejected;
                         });
  });


  it('validates parameters against the API properly', function testEndpointValidation() {
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


