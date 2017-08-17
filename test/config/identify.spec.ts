import {expect} from 'chai';
import {assignGraphIdentity} from '../../src/config/identity';
import {EnvironmentConfig, GraphAPIParameters} from '../../src/model/EnvironmentConfig';
import AppEnv from "../../src/config/env";

describe('Identity', () => {
  beforeEach('Set up env', () => {
    process.env.TEST_SECRET = 'test secret';
  });

  describe('assignGraphIdentity()', () => {
    it('throws Error when no identity passed', () => {
      const identity: any = undefined;
      const config: EnvironmentConfig = {};
      expect(assignGraphIdentity.bind(config, identity)).to.throw(Error);
    });

    it('populates config object properly', () => {
      const identity: any = 'test';
      const config: EnvironmentConfig = {};
      assignGraphIdentity(config, identity);
      expect(config.graphAPIIdentity).to.equal('test');
      expect(config.graphAPIParameters.clientSecret).to.equal('test secret');
    });
  });
});
