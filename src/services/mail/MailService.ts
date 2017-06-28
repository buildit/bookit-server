export interface MailService {
  sendMail(
    senderEmail: string,
    recipientEmail: string,
    messageType: string,
  ): Promise<string>;
}
