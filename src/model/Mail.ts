export interface Mail {
  message: {
    subject: string,
    toRecipients: [
      {
        emailAddress: {
          address: string,
        }
      }
    ],
    body: {
      content: string,
      contentType: 'html'
    }
  };
}
