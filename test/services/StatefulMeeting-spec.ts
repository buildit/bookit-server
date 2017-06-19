import * as moment from 'moment';
import * as chai from 'chai';
import * as chai_as_promised from 'chai-as-promised';

const expect = chai.expect;
chai.use(chai_as_promised);
chai.should();

import {RootLog as logger} from '../../src/utils/RootLogger';
import {MeetingsService} from '../../src/services/meetings/MeetingService';
import {Participant} from '../../src/model/Participant';
import {MeetingsOps} from '../../src/services/meetings/MeetingsOps';
import {retryUntil} from '../../src/utils/retry';
import {getEmail, getRoomEmail} from '../../src/config/bootstrap/rooms';
import {Room} from '../../src/model/Room';


export function StatefulMeetingSpec(meetingService: MeetingsService, description: string) {
  const BRUCE_ID = getEmail('bruce', meetingService.domain());
  const redRoomId = getRoomEmail('red', meetingService.domain());

  const bruceParticipant = new Participant(BRUCE_ID);
  const redRoom = new Room('1', 'Red', redRoomId);

  console.log('participants are:', bruceParticipant, redRoom);

  /* why do we have these three? */
  const meetingOps = new MeetingsOps(meetingService);

  const start = moment().add(20 + Math.random() * 20, 'days').startOf('day');
  const end = start.clone().add(1, 'day');
  const subject = 'helper made!!';

  /* integration tests may take more time */
  const defaultTimeoutMillis = 60000;

  describe(description + ' meeting creation test', function testCreateMeeting() {
    this.timeout(defaultTimeoutMillis);

    it('should create a room booking', function testMeetingReturnedAsExpected() {
      return meetingOps.createMeeting(subject,
                                      start.clone().add(1, 'minute'),
                                      moment.duration(10, 'minute'),
                                      bruceParticipant,
                                      redRoom)
                       .then(meeting => {
                         logger.info('Created the following meeting', meeting);
                         return meeting;
                       }).should.eventually.be.not.empty;
    });


    describe('will not allow meeting overlaps', function testDoubleBookingBefore() {
      before('wait until the cloud services registers the above initial meeting', function wait() {
        logger.debug('waiting on meeting');
        return retryUntil(() => meetingOps.getMeetings(redRoom, start, end), meetings => meetings.length > 0);
      });

      it('will conflict on before', function theTest() {
        logger.debug('about to create duplicate');
        return meetingOps.createMeeting('double booking before',
                                        start.clone().subtract(5, 'minutes'),
                                        moment.duration(10, 'minutes'),
                                        bruceParticipant,
                                        redRoom)
                         .then((thing) => {
                           logger.debug('what is this?', thing);
                           throw new Error('WCOB should not be here!!!');
                         })
                         .catch(err => {
                           expect(err).to.be.eq('Found conflict');
                         });
      });

      it('will conflict on after', function theTest() {
        return meetingOps.createMeeting('double booking after',
                                        start.clone().add(5, 'minutes'),
                                        moment.duration(10, 'minutes'),
                                        bruceParticipant,
                                        redRoom)
                         .then(() => {
                           throw new Error('WCOA Should not be here!!!');
                         })
                         .catch(err => {
                           expect(err).to.be.eq('Found conflict');
                         });
      });
    });


  });


  describe(description + ' meeting querying works', function testQuerying() {
    this.timeout(defaultTimeoutMillis);

    before('wait until the cloud services registers the above initial meeting', function wait() {
      return retryUntil(() => meetingOps.getMeetings(redRoom, start, end), meetings => meetings.length > 0);
    });

    it('`findMeeting` works', function testMeetingsAreEmpty() {

      return meetingOps.getMeetings(redRoom, start, end)
                       .then(meetings => {
                         const meeting = meetings[0];
                         return meetingOps.findMeeting(redRoom, meeting.id, start, end);
                       })
                       .should.eventually.be.not.empty;
    });

    it('`findMeeting` throws on non-existent', function testMeetingsAreEmpty() {
      return meetingOps.findMeeting(redRoom, 'bogus', start, end).should.be.rejected;
    });

  });


  describe(description + ' cleanup works', function testCleanupWorks() {
    this.timeout(defaultTimeoutMillis);

    it('fails to delete non-existent room', function testDeleteOfNonexistent() {
      meetingOps.deleteMeeting(redRoom, 'bogus').should.eventually.be.rejected;
    });

    it('has deletes all meetings', function testMeetingsAreEmpty() {

      /*
      This looks a bit off.  Need to ensure that the owner is a user an not a room.
       */
      return meetingOps.getMeetings(redRoom, start, end)
                        .then(meetings => {
                          const deletePromises = meetings.map(meeting => meetingOps.deleteMeeting(redRoom, meeting.id));
                          return Promise.all(deletePromises);
                        })
                        .then(() => meetingOps.getMeetings(redRoom, start, end)).should.eventually.be.empty;
    });

    it('verifies no meetings', function testMeetingsEmpty() {

      return meetingOps.getMeetings(redRoom, start, end)
                       .should.eventually.be.empty;
    });

  });

}
