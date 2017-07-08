import {RootLog as logger} from '../../utils/RootLogger';

import {GroupService, MSGroup} from './GroupService';
import {MSUser} from '../users/UserService';
import {GroupIdCachingStrategy} from './GroupIdCachingStrategy';
import {GroupNameCachingStrategy} from './GroupNameCachingStrategy';
import {IdentityCache, SurrogateListCache} from '../../utils/cache/caches';
import {SurrogateGroupNameCachingStrategy} from './SurrogateGroupNameCachingStrategy';


const DEFAULT_REFRESH_IN_MILLIS = 300 * 1000;

/**
 * This class is meant primarily for testing purposes against a mock set of data.
 */
export class CachedGroupService implements GroupService {
  private fetched: boolean;

  private jobId: NodeJS.Timer;

  private idCache = new IdentityCache<MSGroup>(new Map<string, MSGroup>(),
                                               new GroupIdCachingStrategy());
  private nameCache = new IdentityCache<MSGroup>(new Map<string, MSGroup>(),
                                                 new GroupNameCachingStrategy());
  private memberCache = new SurrogateListCache<MSGroup, MSUser>(new Map<string, Map<string, MSUser>>(),
                                                                new SurrogateGroupNameCachingStrategy());


  constructor(private _groupService: GroupService) {

    const _internalRefresh = () => {
      this.refreshCache().then(() => logger.info('Group cache refreshed'));
    };

    logger.info('Constructing CachedGroupService');
    _internalRefresh();
    this.jobId = setInterval(_internalRefresh, DEFAULT_REFRESH_IN_MILLIS);
  }


  getGroups(): Promise<Array<MSGroup>> {
    const refresh = this.fetched ? Promise.resolve() : this.refreshCache();
    return refresh.then(() => Array.from(this.idCache.values()));
  }


  getGroupMembers(id: string): Promise<MSUser[]> {
    const refresh = this.fetched ? Promise.resolve() : this.refreshCache();
    return refresh.then(() => {
      const group = this.idCache.get(id);
      const members = group ? this.memberCache.get(group) : [];
      return members || [];
    });
  }


  private refreshCache(): Promise<void> {
    logger.info('CachedGroupService::refreshCache() - refreshing groups');
    const promisedGroups = this._groupService.getGroups();

    promisedGroups.then(groups => {
      const groupIds = groups.map(group => group.id);
      groups.forEach(group => this.cacheGroup(group));
      this.reconcileAndEvict(groupIds);
      logger.info('CachedGroupService::refreshCache() - done caching groups');
    });

    return promisedGroups.then(groups => {
      logger.info('CachedGroupService::refreshCache() - about to fetch members');
      const promisedMembers = groups.map(group => {
        return this._groupService.getGroupMembers(group.id)
                   .then(members => {
                     return this.cacheMembers(group, members);
                   });
      });

      return Promise.all(promisedMembers).then(() => {
        logger.info('CachedGroupService::refreshCache() - done with members');
        this.fetched = true;
      });
    });

  }


  private reconcileAndEvict(groupIds: string[]) {
    const existingGroupIds = new Set(this.idCache.keys());
    const updatedGroupIds = new Set(groupIds);

    logger.info('Existing', existingGroupIds.size, 'updated', updatedGroupIds.size);
    updatedGroupIds.forEach(id => existingGroupIds.delete(id));
    existingGroupIds.forEach(id => this.evictGroup(id));
  }

  private cacheGroup(group: MSGroup) {
    this.idCache.put(group);
    this.nameCache.put(group);

    logger.info('Caching group', group.id);
    logger.debug('id keys', this.idCache.keys());
    logger.debug('name keys', this.nameCache.keys());

    return group;
  }


  private evictGroup(id: string) {
    logger.info('Evicting group', id);
    const group = this.idCache.get(id);

    this.idCache.remove(group);
    this.nameCache.remove(group);

    return group;
  }

  private cacheMembers(group: MSGroup, members: MSUser[]) {
    members.forEach(member => this.memberCache.put(group, member));
  }

}
