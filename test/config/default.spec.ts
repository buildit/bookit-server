import {expect} from 'chai';
import * as sinon from 'sinon';
import {setupDefaultEnvironment} from '../../src/config/setup-environment';
import * as identity from '../../src/config/identity';
import {EnvironmentConfig} from '../../src/model/EnvironmentConfig';

describe('Default', () => {

  function assertBasicProperties(env: EnvironmentConfig) {
    expect(env.domain.domainName).to.equal('default');
    expect(env.jwtTokenSecret).to.equal('jwt test secret');
    expect(assignGraphIdentityStub.calledOnce).to.be.true;
  }

  let assignGraphIdentityStub: any;
  let env: EnvironmentConfig = {};

  beforeEach('Set up env and stub', () => {
    process.env.CLOUD_CONFIG = 'test';
    process.env.USE_AZURE = 'true';
    process.env.JWT_TOKEN_SECRET = 'jwt test secret';

    assignGraphIdentityStub = sinon.stub(identity, 'assignGraphIdentity');
  });

  afterEach('Reset stub', () => {
    assignGraphIdentityStub.restore();
  });

  describe('setupDefaultEnvironment() with cache disabled', () => {
    beforeEach('Set up env', () => {
      process.env.MEETING_CACHE_DISABLED = 'true';
      process.env.GROUP_CACHE_DISABLED = 'true';
    });

    it('environment object is set up properly', () => {
      setupDefaultEnvironment(env);

      assertBasicProperties(env);
      expect(env.useMeetingCache).to.be.false;
      expect(env.useGroupCache).to.be.false;
    });
  });

  describe('setupDefaultEnvironment() with cache enabled', () => {
    beforeEach('Set up env', () => {
      process.env.MEETING_CACHE_DISABLED = 'false';
      process.env.GROUP_CACHE_DISABLED = 'false';
    });

    it('environment object is set up properly', () => {
      setupDefaultEnvironment(env);

      assertBasicProperties(env);
      expect(env.useMeetingCache).to.be.true;
      expect(env.useGroupCache).to.be.true;
    });
  });
});
