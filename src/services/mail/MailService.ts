export class Mail {
  recipientEmail: string;
  subject: string;
  content: string;

  constructor(recipientEmail: string, subject: string, content: string) {
    this.recipientEmail = recipientEmail;
    this.subject = subject;
    this.content = content;
  }
}

export interface MailService {
  sendMail(): Promise<any>;
}
