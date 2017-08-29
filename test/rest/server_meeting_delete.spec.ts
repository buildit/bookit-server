import * as moment from 'moment';
import * as chai from 'chai';
import * as chai_as_promised from 'chai-as-promised';

const expect = chai.expect;
chai.use(chai_as_promised);
chai.should();

import * as express from 'express';
import * as request from 'supertest';

import {configureRoutes} from '../../src/rest/server';

import {Runtime} from '../../src/config/runtime/configuration';
import {generateMSRoomResource, generateMSUserResource} from '../../src/config/bootstrap/rooms';

const meetingService = Runtime.meetingService;
const jwtTokenProvider = Runtime.jwtTokenProvider;


const app = configureRoutes(express(),
                            Runtime.graphTokenProvider,
                            jwtTokenProvider,
                            Runtime.roomService,
                            Runtime.userService,
                            Runtime.mailService,
                            meetingService);


const roodminOwner = generateMSUserResource('roodmin', Runtime.meetingService.domain());
const babsOwner = generateMSUserResource('babs', Runtime.meetingService.domain());
const bruceOwner = generateMSUserResource('bruce', Runtime.meetingService.domain());
const whiteRoom = generateMSRoomResource('white', Runtime.meetingService.domain());

const bruceCredentials = {
  user: bruceOwner.email,
  password: 'who da boss?'
};


const roodminCredentials = {
  user: roodminOwner.email,
  password: 'who cares?'
};

describe('delete meeting routes', function testMeetingDeleteRoutes() {


  it('fails to delete a meeting owned by another user that is an ordinary user', function testOrdinaryUnownedDelete() {
    const meetingStart = '2013-05-08 14:00:00';
    const meetingEnd = '2013-05-08 14:45:00';

    const original = {
      title: 'original meeting title',
      start: moment(meetingStart),
      duration: moment.duration(moment(meetingEnd).diff(moment(meetingStart), 'minutes'), 'minutes'),
      babsOwner,
      whiteRoom
    };

    const bruceToken = jwtTokenProvider.provideToken(bruceCredentials);

    return meetingService.createUserMeeting(original.title,
                                            original.start,
                                            original.duration,
                                            original.babsOwner,
                                            original.whiteRoom)
                         .then(created => {
                           return request(app).delete(`/room/${whiteRoom.email}/meeting/${created.id}`)
                                              .set('x-access-token', bruceToken)
                                              .expect(403);
                           });
                         });

  it('deletes a meeting owned by the user', function testOrdinaryOwnedDelete() {
    const meetingStart = '2013-05-08 14:00:00';
    const meetingEnd = '2013-05-08 14:45:00';

    const original = {
      title: 'original meeting title',
      start: moment(meetingStart),
      duration: moment.duration(moment(meetingEnd).diff(moment(meetingStart), 'minutes'), 'minutes'),
      bruceOwner,
      whiteRoom
    };

    const bruceToken = jwtTokenProvider.provideToken(bruceCredentials);

    return meetingService.createUserMeeting(original.title,
                                            original.start,
                                            original.duration,
                                            original.bruceOwner,
                                            original.whiteRoom)
                         .then(created => {
                           return request(app).delete(`/room/${whiteRoom.email}/meeting/${created.id}`)
                                              .set('x-access-token', bruceToken)
                                              .expect(200);
                         });
  });


  it('deletes a meeting owned by another user as the admin', function testOrdinaryOwnedDelete() {
    const meetingStart = '2013-05-08 14:00:00';
    const meetingEnd = '2013-05-08 14:45:00';

    const original = {
      title: 'original meeting title',
      start: moment(meetingStart),
      duration: moment.duration(moment(meetingEnd).diff(moment(meetingStart), 'minutes'), 'minutes'),
      bruceOwner,
      whiteRoom
    };

    const roodminToken = jwtTokenProvider.provideToken(roodminCredentials);

    return meetingService.createUserMeeting(original.title,
                                            original.start,
                                            original.duration,
                                            original.bruceOwner,
                                            original.whiteRoom)
                         .then(created => {
                           return request(app).delete(`/room/${whiteRoom.email}/meeting/${created.id}`)
                                              .set('x-access-token', roodminToken)
                                              .expect(200);
                         });
  });

});


