# Bookit server

A server for [Bookit](https://github.com/buildit/bookit-web).

## Quick start
```
npm install
npm run dev
```

See room list at [http://localhost:8888/rooms/nyc/](http://localhost:8888/rooms/nyc/)

See meeting list at [http://localhost:8888/rooms/nyc/meetings?start=2017-03-08?end=2017-03-12](http://localhost:8888/rooms/nyc/meetings?start=2017-03-08?end=2017-03-12)

## Connecting to MS Exchange
Create a .env file. Put the following in it:
```
MICROSOFT_CLIENT_SECRET=your-client-secret
USE_CLOUD=true

```

## Using the in-memory datastore
The server defaults to "in-mem" mode, which is useful for developing locally. Setting `USE_CLOUD=true` in `.env` turns "in-mem" off. See `Services.ts` for the actual switching logic.

When the app runs in "in-mem" mode, an `EventGenerator` creates a bunch of sample event data. The events are randomized, so you will see somewhat different results with every run.

## Authentication
The server has an endpoint for retrieving a token for using in some subsequent requests.  Send a json object that conforms to the below interface.

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

This token should be placed in the header for authentication.

                         return request(app).get('/backdoor')
                                            .set('x-access-token', token)
                                            .expect(200)



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
