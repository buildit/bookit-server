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
const babsOwner = generateMSUserResource('babs', Runtime.meetingService.domain());
const whiteRoom = generateMSRoomResource('white', Runtime.meetingService.domain());
const redRoom = generateMSRoomResource('red', Runtime.meetingService.domain());

const bruceCredentials = {
  user: bruceOwner.email,
  password: 'who da boss?'
};


const babsCredentials = {
  user: babsOwner.email,
  password: 'the effect'
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

  it('exposes ids and titles for meetings owned by user and obscures these properties for meetings owned by others.', function testMeetingPropertyVisibility() {
    // This tests for the behavior specified in the below ticket.
    // https://kanbanflow.com/t/e5f15264f6292a2cf7f7a213e0953e6f/ep-20170622-as-a-user-i-expect-visibil

    const searchStart = '2013-02-08 08:00:00';
    const searchEnd = '2013-02-08 18:00:00';

    const brucesMeetingStart = '2013-02-08 09:00:00';
    const brucesMeetingEnd = '2013-02-08 09:30:00';

    const brucesMeetingDetails = {
      title: 'bruces meeting',
      start: moment(brucesMeetingStart),
      duration: moment.duration(moment(brucesMeetingEnd).diff(moment(brucesMeetingStart), 'minutes'), 'minutes'),
      bruceOwner,
      whiteRoom
    };

    const babsMeetingStart = '2013-02-08 09:00:00';
    const babsMeetingEnd = '2013-02-08 09:30:00';

    const babsMeetingDetails = {
      title: 'babs meeting',
      start: moment(babsMeetingStart),
      duration: moment.duration(moment(babsMeetingEnd).diff(moment(babsMeetingStart), 'minutes'), 'minutes'),
      babsOwner,
      redRoom
    };

    const brucesMeeting = meetingService.createUserMeeting(brucesMeetingDetails.title,
                                                           brucesMeetingDetails.start,
                                                           brucesMeetingDetails.duration,
                                                           brucesMeetingDetails.bruceOwner,
                                                           brucesMeetingDetails.whiteRoom);

    const babsMeeting = meetingService.createUserMeeting(babsMeetingDetails.title,
                                                         babsMeetingDetails.start,
                                                         babsMeetingDetails.duration,
                                                         babsMeetingDetails.babsOwner,
                                                         babsMeetingDetails.redRoom);

    const meetingPromises = Promise.all([brucesMeeting, babsMeeting]);

    const bruceToken = jwtTokenProvider.provideToken(bruceCredentials);

    const bruceQuery = meetingPromises.then((meeting) => {
      return request(app)
        .get(`/rooms/nyc/meetings?start=${searchStart}&&end=${searchEnd}`)
        .set('x-access-token', bruceToken)
        .then(query => {
          const roomMeetings = query.body as RoomMeetings[];
          const allMeetings = roomMeetings.reduce((acc, room) => {
            acc.push.apply(acc, room.meetings);
            return acc;
          }, []);

          const brucesMeetings = allMeetings.filter(m => m.owner.email === bruceOwner.email);
          const bruceMeeting = brucesMeetings[0];
          const otherMeetings = allMeetings.filter(m => m.owner.email !== bruceOwner.email);
          const otherMeeting = otherMeetings[0];

          expect(allMeetings.length).to.be.equal(2);

          // Titles of meetings owned by the user are exposed. Titles of other meetings are obscured.
          expect(bruceMeeting.title).to.be.equal('bruces meeting');
          expect(otherMeeting.title).to.be.equal('babs');

          // Ids of meetings owned by user are exposed. Ids of other meetings are obscured.
          expect(bruceMeeting.id).to.be.have.string('user');
          expect(otherMeeting.id).to.have.string('obscured');

          return;
        });
    });

    const babsToken = jwtTokenProvider.provideToken(babsCredentials);

    const babsQuery = meetingPromises.then((meeting) => {
      return request(app)
        .get(`/rooms/nyc/meetings?start=${searchStart}&&end=${searchEnd}`)
        .set('x-access-token', babsToken)
        .then(query => {
          const roomMeetings = query.body as RoomMeetings[];
          const allMeetings = roomMeetings.reduce((acc, room) => {
            acc.push.apply(acc, room.meetings);
            return acc;
          }, []);

          const babsMeetings = allMeetings.filter(m => m.owner.email === babsOwner.email);
          const babsMeeting = babsMeetings[0];
          const otherMeetings = allMeetings.filter(m => m.owner.email !== babsOwner.email);
          const otherMeeting = otherMeetings[0];

          expect(allMeetings.length).to.be.equal(2);

          // Titles of meetings owned by the user are exposed. Titles of other meetings are obscured.
          expect(babsMeeting.title).to.be.equal('babs meeting');
          expect(otherMeeting.title).to.be.equal('bruce');

          // Ids of meetings owned by user are exposed. Ids of other meetings are obscured.
          expect(babsMeeting.id).to.be.have.string('user');
          expect(otherMeeting.id).to.have.string('obscured');

          return;
        });
    });

    return Promise.all([bruceQuery, babsQuery])
                  .then(queries => {
                    meetingService.clearCaches();
                  });
  });

});
