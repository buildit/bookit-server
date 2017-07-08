import {expect} from 'chai';

import {GroupNameCachingStrategy} from '../../../src/services/groups/GroupNameCachingStrategy';
import {MSGroup} from '../../../src/services/groups/GroupService';


const kewl: MSGroup = {
  id: '1',
  description: 'This is the cool group',
  displayName: 'K007',
  mail: 'rad@awesometacular.com'
};


describe('group name caching suite', function groupNameCachingSuite() {
  const cache = new Map<string, MSGroup>();
  const groupNameCacher = new GroupNameCachingStrategy();

  it('caches by name', function testCacheGroupByName() {
    groupNameCacher.put(cache, kewl);
    const result = groupNameCacher.get(cache, 'K007');

    expect(result).to.exist;
    expect(result.description).to.be.equal('This is the cool group');
  });


  it('evicts by name', function testCacheGroupByName() {
    groupNameCacher.remove(cache, kewl);
    const result = groupNameCacher.get(cache, 'K007');

    expect(result).to.not.exist;
  });

});
