import * as moment from 'moment';
import * as chai from 'chai';
import * as chai_as_promised from 'chai-as-promised';

const expect = chai.expect;
chai.use(chai_as_promised);
chai.should();

import {RootLog as logger} from '../../src/utils/RootLogger';
import {MeetingsService} from '../../src/service/MeetingService';
import {Participant} from '../../src/model/Participant';
import {MeetingsOps} from '../../src/service/MeetingsOps';
import {retryUntil} from '../../src/utils/retry';

// import * as UUID from 'uuid';

export default function StatefulSpec(meetingService: MeetingsService, description: string) {
  const ROMAN_ID = 'romans@myews.onmicrosoft.com';
  const cyanRoomId = 'cyan-room@myews.onmicrosoft.com';

  const romanParticipant = new Participant(ROMAN_ID);
  const cyanRoomParticipant = new Participant(cyanRoomId);

  /* why do we have these three? */
  const meetingOps = new MeetingsOps(meetingService);

  const start = moment().add(20 + Math.random() * 20, 'days').startOf('day');
  const end = start.clone().add(1, 'day');
  const subject = 'helper made!!';


  describe(description + ' meeting creation test', function testCreateMeeting() {

    it('should create a room booking', function testMeetingReturnedAsExpected() {
      return meetingOps.createMeeting(subject,
                                       start.clone().add(1, 'minute'),
                                       moment.duration(10, 'minute'),
                                       romanParticipant,
                                       cyanRoomParticipant)
                       .then(meeting => {
                         logger.info('Created the following meeting', meeting);
                         return meeting;
                       }).should.eventually.be.not.empty;
    });


    it('will not allow a meeting overlaps before', function testDoubleBookingBefore() {
      before('wait until the cloud service registers the above initial meeting', function wait() {
        return retryUntil(() => meetingOps.getMeetings(cyanRoomId, start, end), meetings => meetings.length > 0);
      });

      it('will actually conflict', function theTest() {
        return meetingOps.createMeeting('double booking before',
                                        start.clone().subtract(5, 'minutes'),
                                        moment.duration(10, 'minutes'),
                                        romanParticipant,
                                        cyanRoomParticipant)
                         .then((thing) => {
                           logger.debug('what is this?', thing);
                           throw new Error('Should not be here!!!');
                         })
                         .catch(err => {
                           expect(err).to.be.eq('Found conflict');
                         });
      });
    });


    it('will not allow a meeting that overlaps after', function testDoubleBookingAfter() {
      before('wait until the cloud service registers the above initial meeting', function wait() {
        return retryUntil(() => meetingOps.getMeetings(cyanRoomId, start, end), meetings => meetings.length > 0);
      });

      it('will actually conflict', function theTest() {
        return meetingOps.createMeeting('double booking after',
                                        start.clone().add(5, 'minutes'),
                                        moment.duration(10, 'minutes'),
                                        romanParticipant,
                                        cyanRoomParticipant)
                         .then(() => {
                           throw new Error('Should not be here!!!');
                         })
                         .catch(err => {
                           expect(err).to.be.eq('Found conflict');
                         });
      });
    });


  });


  describe(description + ' cleanup works', function testCleanupWorks() {
    it('has empty rooms', function testMeetingsAreEmpty() {

      return meetingOps.getMeetings(cyanRoomId, start, end)
                        .then(meetings => {
                          const deletePromises = meetings.map(
                            meeting => meetingOps.deleteMeeting(meeting.owner.email, meeting.id));
                          return Promise.all(deletePromises);
                        })
                        .then(() => meetingOps.getMeetings(cyanRoomId, start, end)).should.eventually.be.empty;
    });
  });

}
