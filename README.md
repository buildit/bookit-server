# Bookit server

A server for [Bookit](https://github.com/buildit/bookit-web).

## Quick start
```
npm install
npm run dev
```

See room list at [http://localhost:8888/rooms/nyc/](http://localhost:8888/rooms/nyc/)

See meeting list at [http://localhost:8888/rooms/nyc/meetings?start=2017-03-08?end=2017-03-12](http://localhost:8888/rooms/nyc/meetings?start=2017-03-08?end=2017-03-12)

## Modes of operation

The back end is heavily geared towards testing and stand-alone operation at the moment.  It has a dev mode against an in-memory generated
meeting list, a dev mode against a test Azure AD using the Microsoft Graph API, a unit-test configuration, and an
integration test configuration.  The **default mode of operation is in-memory dev**.  When the app runs in "in-mem" mode, an `EventGenerator` 
creates a bunch of sample event data. The events are randomized, so you will see somewhat different results with every run.


### Accessing additional modes

To work with additional modes, you will need to create a plaintext file named '.env' in the root of your checkout.

##### Toggle usage of the Graph API backend
```
USE_CLOUD=true
```

##### MICROSOFT_CLIENT_SECRET
This setting is the application secret that the app was registered with.  There will be some rework to take into account 
the application id and the tenant id.  You will have to obtain the secret from a fellow developer.
```
MICROSOFT_CLIENT_SECRET=your-client-secret
```

## Authentication
There are a few endpoints that require a token in order to access.  It's either because it needs 
to be protected or because it is user-context sensitive.  The server has an endpoint for retrieving a token for using 
in some subsequent requests.  Send a json object that conforms to the below interface.

```
POST /authenticate

export interface Credentials {
  user: string;
  password: string;
}
```
You will get back an object that has a member called 'token.'  The token is hardcoded to last 60 minutes at the moment.

```
export interface TokenInfo {
  user: string;
  password: string;
  iat: number;
  exp: number;
}
```

This token should be placed in the header for authentication for those endpoints that require it.

                         return request(app).get('/backdoor')
                                            .set('x-access-token', token)
                                            .expect(200)


## Code architecture
The environment bootstrapping is simple and is mainly driven off the two environment variables above.  This can be
found under src/config.  The environment loading code is in env.ts.  The config is loaded using [node-config](https://github.com/lorenwest/node-config).

The run-time configuration is generated in src/config/runtime.  The creation of all services is
done in configuration.ts.  Note that the test are still a source of pain as there are unit and
integration versions that still locally create stubs or mocks.

## Services
There are a small set of services under which the code is organized.  There are too many versions
at the moment that include: stub, mock, local, cached and cloud.  The cloud versions are the ones that
interact with the MS Graph API.  These will be simplified and reduced to fewer versions.

##### Stub
Basic implementation of the interface that throws exceptions or does nothing.

##### Local
Specifically "mocked" version that is used to provide a specific and repeatable data set in dev mode.

##### Mock
A version that is more open-ended and implements the service

##### Cached
Wraps the service and caches data from the underlying service.  This is typically used with the cloud
services

##### Cloud
These are the services that connect to Microsoft.

#### TokenOperations
This is a class the provides two types of tokens.  The first are JWT tokens for protected endpoints.  The second
are cloud tokens for MS Graph calls.

#### RoomService
This service provides room lists for a particular site.

#### UserService
This service provides a user list.

#### MeetingService
This service is the main service of the application that does CRUD meeting operations.

## REST
The app is using express for its web server.  There are three endpoint categories:

##### Test
For test routes to see if the server is up.

##### Authentication
To set up the login routes

##### Meetings
The routes for CRUD meeting operations that bookit-web interacts with.

## Special cases
MeetingOps seems to be an IOC class meant for reusing logic (e.g. checking for meeting availability) against an 
interchangeable set of services.

## Useful links

[Office Portal](https://portal.office.com/) (resource management)

[Azure Portal](https://portal.azure.com) (application management)

[Node.js Graph API](https://github.com/microsoftgraph/msgraph-sdk-javascript)

[Calendar REST API reference](https://developer.microsoft.com/en-us/graph/docs/api-reference/v1.0/resources/calendar)  

[Microsoft Graph API permissins list](https://developer.microsoft.com/en-us/graph/docs/authorization/permission_scopes)

## Docker packaging

Travis build performs Docker image push only for `master` branch.
We do not perform separate `npm i` and reuse build `node_modules` with `npm prune --production`.

Local build and run example
`docker build . -t bookit-server:local && docker run --rm -ti -e MICROSOFT_CLIENT_SECRET=set_me -p 8888:8888  bookit-server:local`

Build and push (just in case you do not trust Travis build)
`npm run build && docker build . -t builditdigital/bookit-server:latest && docker push builditdigital/bookit-server:latest`

Local run of both server and the client
`docker-compose up`
