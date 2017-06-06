import {Runtime} from '../../../src/config/runtime/configuration';
import {StatefulMeetingSpec} from '../../../test/services/StatefulMeeting-spec';

const meetingsService = Runtime.meetingService;

StatefulMeetingSpec(meetingsService, 'Cloud Meetings services');
