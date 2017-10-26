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

import {Runtime} from '../../src/config/runtime/configuration';
import {generateMSRoomResource, generateMSUserResource} from '../../src/config/bootstrap/rooms';
import {Meeting} from '../../src/model/Meeting';

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
const bruceOwner = generateMSUserResource('bruce', Runtime.meetingService.domain());
const babsOwner = generateMSUserResource('babs', Runtime.meetingService.domain());
const whiteRoom = generateMSRoomResource('white', Runtime.meetingService.domain());

const bruceCredentials = {
  user: bruceOwner.email,
  password: 'who da boss?'
};


const babsCredentials = {
  user: babsOwner.email,
  password: 'who da singer?'
};


const roodminCredentials = {
  user: roodminOwner.email,
  password: 'who cares?'
};


describe('update meeting routes', function testMeetingUpdateRoutes() {


  it('updates a meetings subject as the owner', function testUpdateMeetingSubject() {
    const meetingStart = '2013-05-08 10:00:00';
    const meetingEnd = '2013-05-08 10:45:00';

    const original = {
      title: 'original meeting title',
      start: moment(meetingStart),
      duration: moment.duration(moment(meetingEnd).diff(moment(meetingStart), 'minutes'), 'minutes'),
      bruceOwner,
      whiteRoom
    };

    const token = jwtTokenProvider.provideToken(bruceCredentials);

    return meetingService.createUserMeeting(original.title,
                                            original.start,
                                            original.duration,
                                            original.bruceOwner,
                                            original.whiteRoom)
                         .then(created => {
                           logger.info('Created meeting', created.id);
                           const updatedMeeting: MeetingRequest = {
                             id: created.id,
                             title: 'this is new',
                             start: meetingStart,
                             end: meetingEnd,
                           };

                           return request(app).put(`/room/${whiteRoom.email}/meeting/${updatedMeeting.id}`)
                                              .set('Content-Type', 'application/json')
                                              .set('x-access-token', token)
                                              .send(updatedMeeting)
                                              .expect(200)
                                              .then(response => {
                                                const meeting = response.body as Meeting;

                                                meetingService.clearCaches();

                                                return expect(meeting.title).to.be.eq(updatedMeeting.title);
                                              });
                         });
  });


  it('updates a meetings start time as the owner', function testUpdateMeetingStart() {
    const meetingStart = '2013-05-08 10:00:00';
    const meetingEnd = '2013-05-08 10:45:00';

    const newMeetingStart = '2013-05-08 10:15:00';

    const searchStart = '2013-05-08 09:00:00';
    const searchEnd = '2013-05-08 12:00:00';

    const original = {
      title: 'original meeting title',
      start: moment(meetingStart),
      duration: moment.duration(moment(meetingEnd).diff(moment(meetingStart), 'minutes'), 'minutes'),
      bruceOwner,
      whiteRoom
    };

    const token = jwtTokenProvider.provideToken(bruceCredentials);

    return meetingService.createUserMeeting(original.title,
                                            original.start,
                                            original.duration,
                                            original.bruceOwner,
                                            original.whiteRoom)
                         .then(created => {
                           const updatedMeeting: MeetingRequest = {
                             id: created.id,
                             title: 'this is new',
                             start: newMeetingStart,
                             end: meetingEnd,
                           };

                           // BookIt web posts to the room
                           return request(app).put(`/room/${whiteRoom.email}/meeting/${updatedMeeting.id}`)
                                              .set('Content-Type', 'application/json')
                                              .set('x-access-token', token)
                                              .send(updatedMeeting)
                                              .expect(200)
                                              .then(response => {
                                                const meeting = response.body as Meeting;

                                                meetingService.clearCaches();

                                                // The response is a JSON screen that we need to convert back to a moment
                                                const meetingUTC = moment.utc(meeting.start) + '';
                                                const updatedUTC = moment.utc(moment(updatedMeeting.start)) + '';

                                                expect(meetingUTC).to.be.eq(updatedUTC);
                                                return;
                                              });
                         });
  });

  it('updates a meetings end time as the owner', function testUpdateMeetingEnd() {
    const meetingStart = '2013-05-08 10:00:00';
    const meetingEnd = '2013-05-08 10:45:00';

    const newMeetingEnd = '2013-05-08 11:00:00';

    const original = {
      title: 'original meeting title',
      start: moment(meetingStart),
      duration: moment.duration(moment(meetingEnd).diff(moment(meetingStart), 'minutes'), 'minutes'),
      bruceOwner,
      whiteRoom
    };

    const token = jwtTokenProvider.provideToken(bruceCredentials);

    return meetingService.createUserMeeting(original.title,
                                            original.start,
                                            original.duration,
                                            original.bruceOwner,
                                            original.whiteRoom)
                         .then(created => {
                           const updatedMeeting: MeetingRequest = {
                             id: created.id,
                             title: 'this is new',
                             start: meetingStart,
                             end: newMeetingEnd,
                           };

                           // BookIt web posts to the room
                           return request(app).put(`/room/${whiteRoom.email}/meeting/${updatedMeeting.id}`)
                                              .set('Content-Type', 'application/json')
                                              .set('x-access-token', token)
                                              .send(updatedMeeting)
                                              .expect(200)
                                              .then(response => {
                                                const meeting = response.body as Meeting;

                                                meetingService.clearCaches();

                                                // The response is a JSON string that we need to convert back to a moment
                                                const meetingUTC = moment.utc(meeting.end) + '';
                                                const updatedUTC = moment.utc(moment(updatedMeeting.end)) + '';

                                                expect(meetingUTC).to.be.eq(updatedUTC);
                                                return;
                                              });

                         });
  });


  it('fails to update a meeting subject as a non-owner', function testUpdateMeetingSubjectNonOwner() {
    const meetingStart = '2013-05-08 10:00:00';
    const meetingEnd = '2013-05-08 10:45:00';


    const original = {
      title: 'original meeting title',
      start: moment(meetingStart),
      duration: moment.duration(moment(meetingEnd).diff(moment(meetingStart), 'minutes'), 'minutes'),
      bruceOwner,
      whiteRoom
    };

    const token = jwtTokenProvider.provideToken(babsCredentials);

    return meetingService.createUserMeeting(original.title,
                                            original.start,
                                            original.duration,
                                            original.bruceOwner,
                                            original.whiteRoom)
                         .then(created => {
                           const updatedMeeting: MeetingRequest = {
                             id: created.id,
                             title: 'this is new',
                             start: meetingStart,
                             end: meetingEnd,
                           };

                           return request(app).put(`/room/${whiteRoom.email}/meeting/${updatedMeeting.id}`)
                                              .set('Content-Type', 'application/json')
                                              .set('x-access-token', token)
                                              .send(updatedMeeting)
                                              .expect(403)
                                              .then(() => {
                                                meetingService.clearCaches();

                                                return;
                                              });
                         });
  });


  it('updates a meetings subject as an admin', function testUpdateMeetingSubjectAdmin() {
    const meetingStart = '2013-05-08 10:00:00';
    const meetingEnd = '2013-05-08 10:45:00';

    const original = {
      title: 'original meeting title',
      start: moment(meetingStart),
      duration: moment.duration(moment(meetingEnd).diff(moment(meetingStart), 'minutes'), 'minutes'),
      bruceOwner,
      whiteRoom
    };

    const token = jwtTokenProvider.provideToken(roodminCredentials);

    return meetingService.createUserMeeting(original.title,
                                            original.start,
                                            original.duration,
                                            original.bruceOwner,
                                            original.whiteRoom)
                         .then(created => {
                           const updatedMeeting: MeetingRequest = {
                             id: created.id,
                             title: 'this is new',
                             start: meetingStart,
                             end: meetingEnd,
                           };

                           return request(app).put(`/room/${whiteRoom.email}/meeting/${updatedMeeting.id}`)
                                              .set('Content-Type', 'application/json')
                                              .set('x-access-token', token)
                                              .send(updatedMeeting)
                                              .expect(200)
                                              .then(response => {
                                                const meeting = response.body as Meeting;

                                                meetingService.clearCaches();

                                                expect(meeting.title).to.be.eq(updatedMeeting.title);

                                                return;
                                              });
                         });
  });
});


