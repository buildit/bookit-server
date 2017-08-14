export interface MessageTemplate {
  subject: string;
  content: string;
}

const mailMessages: Map<string, MessageTemplate> = new Map<string, MessageTemplate>();

mailMessages.set(
  'test',
  {
    subject: 'Hi there',
    content: `
      <h1>Hi</h1>
      <p>Hey. This is a test message.</p>`
  }
);

mailMessages.set(
  'external_user_invitation',
  {
    subject: 'Welcome to Bookit',
    content: `
      <h1>Hi!</h1>
      <p>You're invited to <strong>Bookit</strong>.</p>
      <p><a href="http://bookit.riglet.io/login">Click here</a> and log in with the same email address and password 
you use to log in to Wipro's Microsoft Outlook.</p>`
  },
);

export default mailMessages;
