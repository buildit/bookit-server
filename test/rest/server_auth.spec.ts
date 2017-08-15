import * as chai from 'chai';
import * as chai_as_promised from 'chai-as-promised';

import {NockManager} from '../NockManager';

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


const app = configureRoutes(
  express(),
  Runtime.graphTokenProvider,
  Runtime.jwtTokenProvider,
  Runtime.roomService,
  Runtime.userService,
  Runtime.mailService,
  meetingService);


describe('tests authentication', () => {
  const nockManager = new NockManager();
  beforeEach(() => {
    nockManager.setupContactList();
    nockManager.setupGetBruceUser();
  });

  it('validates an unknown user is rejected', function testUnknownUser() {
    const unknownUser = {
      code: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxMjM5OTljNS03NzFkLTQxMzYtOWQ4Ny1iNWZjMDNmMzI2NmUiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC81NzVjNWI5OC1jMDY5LTQ0NzUtOTlkOS1jZmIzMmUzOWQyNGUvIiwiaWF0IjoxNDk4MjM3NzYzLCJuYmYiOjE0OTgyMzc3NjMsImV4cCI6MTQ5ODUwNDM5OSwiYWlvIjoiWTJaZ1lFaDVPelBsOVBiU0JtYW5vNlpQQmVTazkyMytYblpRVHFIRk55V3pxcVY1NDNZQSIsImFtciI6WyJwd2QiXSwiaXBhZGRyIjoiNjkuMTEyLjIzLjg0IiwibmFtZSI6IkZha2V5IE1jRmFrZVVzZXJGYWNlIiwibm9uY2UiOiIxMjM0NSIsIm9pZCI6ImFhZTQ2NzA0LWI0MjgtNDJlNy1iOWI4LWNlZjQ3MDVhNTgzZCIsInBsYXRmIjoiNSIsInN1YiI6IjFmZ212bmptZ2N0UndUcC1XeG1vaWhiZ3A0eFZhemtkUl9kbFFjR2VBbFEiLCJ0aWQiOiI1NzVjNWI5OC1jMDY5LTQ0NzUtOTlkOS1jZmIzMmUzOWQyNGUiLCJ1bmlxdWVfbmFtZSI6ImlhbUBmYWtlLmNvbSIsInVwbiI6ImlhbUBmYWtlLmNvbSIsInV0aSI6Ik1sd1V0bHc1bjB5Q25TTFBSeXdXQUEiLCJ2ZXIiOiIxLjAiLCJqdGkiOiI3NjcyNTczNC00OTViLTQ3NzYtYWExYi02NTJjZWY3OGI0ZjQifQ.7UAdQmc31rp5cexLDc3hsrPE-Xn357lnMVftnUnhhQs'
    };

    return request(app).post(`/authenticate`)
                       .set('Content-Type', 'application/json')
                       .send(unknownUser)
                       .expect(403)
                       .then(res => {
                         expect(JSON.parse(res.text).message).to.be.equal('Unrecognized user');
                         return;
                       });

  });


  it('validates a token operation', function testValidCredentials() {
    const totallyBruce = {
      code: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxMjM5OTljNS03NzFkLTQxMzYtOWQ4Ny1iNWZjMDNmMzI2NmUiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC81NzVjNWI5OC1jMDY5LTQ0NzUtOTlkOS1jZmIzMmUzOWQyNGUvIiwiaWF0IjoxNDk4MjM3NzYzLCJuYmYiOjE0OTgyMzc3NjMsImV4cCI6MTQ5ODUwNDIxOCwiYWlvIjoiWTJaZ1lFaDVPelBsOVBiU0JtYW5vNlpQQmVTazkyMytYblpRVHFIRk55V3pxcVY1NDNZQSIsImFtciI6WyJwd2QiXSwiaXBhZGRyIjoiNjkuMTEyLjIzLjg0IiwibmFtZSI6ImJydWNlIiwibm9uY2UiOiIxMjM0NSIsIm9pZCI6ImFhZTQ2NzA0LWI0MjgtNDJlNy1iOWI4LWNlZjQ3MDVhNTgzZCIsInBsYXRmIjoiNSIsInN1YiI6IjFmZ212bmptZ2N0UndUcC1XeG1vaWhiZ3A0eFZhemtkUl9kbFFjR2VBbFEiLCJ0aWQiOiI1NzVjNWI5OC1jMDY5LTQ0NzUtOTlkOS1jZmIzMmUzOWQyNGUiLCJ1bmlxdWVfbmFtZSI6ImJydWNlQGJ1aWxkaXRjb250b3NvLm9ubWljcm9zb2Z0LmNvbSIsInVwbiI6ImJydWNlQGJ1aWxkaXRjb250b3NvLm9ubWljcm9zb2Z0LmNvbSIsInV0aSI6Ik1sd1V0bHc1bjB5Q25TTFBSeXdXQUEiLCJ2ZXIiOiIxLjAiLCJqdGkiOiI2NzQxMGQ4Ny1kODY2LTQyOTUtOTJkOC0yNzEyNDBmZTUyZjgifQ.rCHGgod5jX6CGUAf-qWu48eauGsx75u5nZjr5eA28tI'
    };

    return request(app).post(`/authenticate`)
                       .set('Content-Type', 'application/json')
                       .send(totallyBruce)
                       .expect(200)
                       .then(res => {
                         const details = JSON.parse(res.text) as UserDetail;

                         expect(details.token.length > 0).to.be.true;
                         expect(details.name).to.be.equal('bruce');
                         expect(details.email).to.be.equal('bruce@builditcontoso.onmicrosoft.com');

                         console.info('authenticated with token:', details.token);
                         return details.token;
                       })
                       .then(token => {
                         return request(app).get('/backdoor')
                                            .set('x-access-token', token)
                                            .expect(200)
                                            .then(res => {
                                              expect(res.text).to.be.equal(
                                                'You had a token and you are bruce@builditcontoso.onmicrosoft.com');
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
                                              return;
                                            });
                       });

  });

});
