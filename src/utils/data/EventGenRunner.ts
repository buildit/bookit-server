import {generateMeetings} from './EventGenerator';
import {Runtime} from '../../config/runtime/configuration';

// create random events with meaningful topics
// 2 weeks by default
const promisedMeetings = generateMeetings(Runtime.roomService,
                                          Runtime.meetingService);

promisedMeetings.then(() => console.log('Done'))
                .catch(err => console.error('Failed!', err));
