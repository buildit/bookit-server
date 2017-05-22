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
import {StubRoomService} from '../../src/service/stub/StubRoomService';

import {Participant} from '../../src/model/Participant';
import {InmemMeetingService} from '../../src/service/stub/InmemMeetingService';
import {MeetingRequest} from '../../src/rest/meeting_routes';
import {Meeting} from '../../src/model/Meeting';

import {Runtime} from '../../src/config/runtime/configuration';
import {StubPasswordStore} from '../../src/service/stub/StubPasswordStore';

const tokenOperations = Runtime.tokenOperations;


const passwordStore = new StubPasswordStore();
const roomService = new StubRoomService(['white', 'black']);
const meetingService = new InmemMeetingService();


const app = configureRoutes(express(), passwordStore, tokenOperations, roomService, meetingService);

const owner = new Participant('romans@myews.onmicrosoft.com', 'person');
const room = new Participant('white-room@myews.onmicrosoft.com', 'room');


describe('Meeting routes write operations', () => {
  it('it creates the room', function() {
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
                       .then(
                         () => meetingService.getMeetings(room.email, searchStart, searchEnd))
                       .then((meetings) => {
                         expect(meetings).to.be.length(1, 'Expected to find one created meeting');

                         const meeting = meetings[0];

                         expect(meeting.title).to.be.deep.eq(expected.title);
                       });
  });

  it('it deletes the meeting', function() {
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

describe('tests authentication', () => {

  it('validates an unknown user is rejected', function testUnknownUser() {
    const unknownUser = {
      user: 'Doppleganger',
      password: ''
    };

    return request(app).post(`/authenticate`)
                       .set('Content-Type', 'application/json')
                       .send(unknownUser)
                       .expect(403)
                       .then(res => {
                         expect(JSON.parse(res.text).message).to.be.equal('Unrecognized user');
                       });

  });


  it('validates an incorrect password is rejected', function testIncorrectPassword() {
    const userWithIncorrectPassword = {
      user: 'bruce@myews.onmicrosoft.com',
      password: 'i think this is what it was'
    };

    return request(app).post(`/authenticate`)
                       .set('Content-Type', 'application/json')
                       .send(userWithIncorrectPassword)
                       .expect(403)
                       .then(res => {
                         expect(JSON.parse(res.text).message).to.be.equal('Incorrect user/password combination');
                       });

  });


  it('validates a token operations', function testValidCredentials() {
    const totallyBruce = {
      user: 'bruce@myews.onmicrosoft.com',
      password: 'who\'s da boss?'
    };

    return request(app).post(`/authenticate`)
                       .set('Content-Type', 'application/json')
                       .send(totallyBruce)
                       .expect(200)
                       .then(res => {
                         const token = JSON.parse(res.text).token;
                         expect(token.length > 0).to.be.true;

                         console.info('authenticated with token:', token);
                         return token;
                       })
                       .then(token => {
                         return request(app).get('/backdoor')
                                            .set('x-access-token', token)
                                            .expect(200)
                                            .then(res => {
                                              expect(res.text).to.be.equal(
                                                'You had a token and you are bruce@myews.onmicrosoft.com');
                                              return token;
                                            });
                       })
                       .then(token => {
                         return request(app).get('/backdoor')
                                            .set('x-access-token', token + 'invalid')
                                            .expect(403)
                                            .then(res => {
                                              const message = JSON.parse(res.text).message;
                                              expect(message).to.be.equal('Unauthorized');
                                            });
                       });

  });

});
