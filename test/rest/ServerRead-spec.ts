import {expect} from 'chai';
import * as express from 'express';
import * as request from 'supertest';

import {RootLog as logger} from '../../src/utils/RootLogger';

import {configureRoutes} from '../../src/rest/server';

import {Runtime} from '../../src/config/runtime/configuration';

const roomService = Runtime.roomService;
const userService = Runtime.userService;
const passwordStore = Runtime.passwordStore;
const jwtTokenProvider = Runtime.jwtTokenProvider;
const meetingService = Runtime.meetingService;


const app = configureRoutes(express(), passwordStore, jwtTokenProvider, roomService, userService, meetingService);


describe('Meeting routes read operations', function meetingReadSuite() {
  it('room list is available on /rooms/nyc', function testRoomList() {
    return request(app).get('/rooms/nyc')
                       .expect(200)
                       .then((res) => {
                         const rooms = roomService.getRooms('nyc');
                         // logger.info(res.body);
                         logger.info('Got rooms', rooms);
                         expect(res.body).to.deep.equal(rooms);
                       });
  });

  // it('valid response contains a list of rooms', function testReadRooms() {
  //   const expectedResponse = {
  //     title: 'meeting 0',
  //     start: '2013-02-08 09',
  //     end: '2013-02-10 09',
  //     location: 'location 0',
  //     participants: [{name: 'part 0', email: 'part-0@designit.com'}]
  //   };
  //
  //   return request(app).get('/rooms/nyc/meetings?start=2013-02-08 09&end=2013-02-10 09')
  //                      .expect(200)
  //                      .then((res) => {
  //                        const firstMeeting = res.body[0].meetings[0];
  //                        expect(firstMeeting.title).to.deep.equal(expectedResponse.title);
  //                      });
  // });
});
