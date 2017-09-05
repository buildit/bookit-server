import {expect} from 'chai';
import {assignGraphIdentity} from '../../src/config/identity';
import {EnvironmentConfig} from '../../src/model/EnvironmentConfig';
import {buildit} from '../../src/config/identities/index';

describe('Identity', () => {
  beforeEach('Set up env', () => {
    process.env.BUILDIT_SECRET = 'test secret';
  });

  describe('assignGraphIdentity()', () => {
    it('throws Error when no identity passed', () => {
      const identity: any = undefined;
      const config: EnvironmentConfig = {};
      expect(assignGraphIdentity.bind(config, identity)).to.throw(Error);
    });

    it('populates test config object properly', () => {
      const identity: any = 'buildit';
      const config: EnvironmentConfig = {};
      assignGraphIdentity(config, identity);
      expect(config.graphAPIIdentity).to.equal('buildit');
      expect(config.graphAPIParameters.clientSecret).to.equal('test secret');
      expect(config.graphAPIParameters.tenantId).to.equal('37fcf0e4-ceb8-4866-8e26-293bab1e26a8');
    });
  });
});
