import * as request from 'request';

export class GraphAPI {

  public getUsers(token: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      request.get('https://graph.microsoft.com/v1.0/users?$select=id,displayName', {auth: {bearer: token}},
        (err, response, body) => {
          const data = JSON.parse(body);
          if (err) {
            reject(err);
          } else if (data.error) {
            reject(data.error.message);
          } else {
            resolve(data.value);
          }
        });
    });
  }
}
