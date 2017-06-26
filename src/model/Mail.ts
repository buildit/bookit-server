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


// {
//   message: {
//     subject,
//       toRecipients: [
//       {
//         emailAddress: {
//           address: recipientEmail,
//         }
//       },
//     ],
//       body: {
//       content,
//         contentType: 'html'
//     }
//   }
// };
