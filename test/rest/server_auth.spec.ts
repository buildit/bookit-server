import * as chai from 'chai';
import * as chai_as_promised from 'chai-as-promised';

const expect = chai.expect;
chai.use(chai_as_promised);
chai.should();

import * as express from 'express';
import * as request from 'supertest';

import {RootLog as logger} from '../../src/utils/RootLogger';
import {configureRoutes} from '../../src/rest/server';


import {Runtime} from '../../src/config/runtime/configuration';
import {UserDetail} from '../../src/rest/auth_routes';


const meetingService = Runtime.meetingService;


const app = configureRoutes(express(), Runtime.passwordStore, Runtime.jwtTokenProvider, Runtime.roomService, Runtime.userService, meetingService);


describe('tests authentication', () => {

  it('validates an unknown user is rejected', function testUnknownUser() {
    const unknownUser = {
      user: 'Doppleganger',
      password: ''
    };

    return request(app).post(`/authenticate`)
                       .set('Content-Type', 'application/json')
                       .send(unknownUser)
                       .expect(403)
                       .then(res => {
                         expect(JSON.parse(res.text).message).to.be.equal('Unrecognized user');
                       });

  });


  it('validates an incorrect password is rejected', function testIncorrectPassword() {
    const userWithIncorrectPassword = {
      user: 'bruce@myews.onmicrosoft.com',
      password: 'i think this is what it was'
    };

    return request(app).post(`/authenticate`)
                       .set('Content-Type', 'application/json')
                       .send(userWithIncorrectPassword)
                       .expect(403)
                       .then(res => {
                         expect(JSON.parse(res.text).message).to.be.equal('Incorrect user/password combination');
                       });

  });


  it('validates a token operations', function testValidCredentials() {
    const totallyBruce = {
      user: 'bruce@myews.onmicrosoft.com',
      password: 'who da boss?'
    };

    return request(app).post(`/authenticate`)
                       .set('Content-Type', 'application/json')
                       .send(totallyBruce)
                       .expect(200)
                       .then(res => {
                         const details = JSON.parse(res.text) as UserDetail;

                         expect(details.token.length > 0).to.be.true;
                         expect(details.id).to.be.equal(1);
                         expect(details.name).to.be.equal('bruce');
                         expect(details.email).to.be.equal('bruce@myews.onmicrosoft.com');

                         console.info('authenticated with token:', details.token);
                         return details.token;
                       })
                       .then(token => {
                         return request(app).get('/backdoor')
                                            .set('x-access-token', token)
                                            .expect(200)
                                            .then(res => {
                                              expect(res.text).to.be.equal(
                                                'You had a token and you are bruce@myews.onmicrosoft.com');
                                              return token;
                                            });
                       })
                       .then(token => {
                         return request(app).get('/backdoor')
                                            .set('x-access-token', token + 'invalid')
                                            .expect(403)
                                            .then(res => {
                                              const message = JSON.parse(res.text).message;
                                              expect(message).to.be.equal('Unauthorized');
                                            });
                       });

  });

});
