export interface IConfig {
  clientId: string;
  clientSecret: string;
  tokenEndpoint: string;
  port: number;
}

export const AppConfig: IConfig = {
  clientId: '3140930b-1a27-4e28-8139-d350e3c30843',
  clientSecret: 'set me',
  tokenEndpoint: 'https://login.windows.net/92261769-1013-420f-8d22-32da90a97f5b/oauth2/token',
  port: 8888
};
