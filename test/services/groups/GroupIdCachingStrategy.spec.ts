import * as moment from 'moment';
import {expect} from 'chai';

import {GroupIdCachingStrategy} from '../../../src/services/groups/GroupIdCachingStrategy';
import {MSGroup} from '../../../src/services/groups/GroupService';


const kewl: MSGroup = {
  id: '1',
  description: 'This is the cool group',
  displayName: 'K007',
  mail: 'rad@awesometacular.com'
};


describe('group id caching suite', function groupIdCachingSuite() {
  const cache = new Map<string, MSGroup>();
  const groupIdCacher = new GroupIdCachingStrategy();

  it('caches by id', function testCacheGroupById() {
    groupIdCacher.put(cache, kewl);
    const result = groupIdCacher.get(cache, '1');

    expect(result).to.exist;
    expect(result.description).to.be.equal('This is the cool group');
  });

  it('evicts by id', function testCacheGroupById() {
    groupIdCacher.remove(cache, kewl);
    const result = groupIdCacher.get(cache, '1');

    expect(result).to.not.exist;
  });
});
