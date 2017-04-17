# Bookit server
 
 ## Local development
 
 `npm run dev`
 
 This starts a server on port 8888. 
 
 See room list at [http://localhost:8888/rooms/nyc/](http://localhost:8888/rooms/nyc/)
 
 See meeting list at [http://localhost:8888/rooms/nyc/meetings?start=2017-03-08?end=2017-03-12](http://localhost:8888/rooms/nyc/meetings?start=2017-03-08?end=2017-03-12)
 
 
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
