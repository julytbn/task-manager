const { google } = require('googleapis');
const nodemailer = require('nodemailer');

const oauth2Client = new google.auth.OAuth2(
  '399706892720-bvgc8ukg7n9a4pnc8gf127e8k1p56tn2.apps.googleusercontent.com',
  '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',
  'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
  refresh_token: '1//04ENIPmGPuyylCgYIARAAGAQSNwF-L9IrzEwxwoYDuJ_LT1QXu1fgNgWbhx8H5AfH-JmGUR9yu0fhtJU2py-qoC6DiJwKHtQ2t2A'
});

async function sendMail() {
  try {
    const accessToken = await oauth2Client.getAccessToken();
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'julietetebenissan@gmail.com',
        clientId: '399706892720-bvgc8ukg7n9a4pnc8gf127e8k1p56tn2.apps.googleusercontent.com',
        clientSecret: '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',
        refreshToken: '1//04ENIPmGPuyylCgYIARAAGAQSNwF-L9IrzEwxwoYDuJ_LT1QXu1fgNgWbhx8H5AfH-JmGUR9yu0fhtJU2py-qoC6DiJwKHtQ2t2A',
        accessToken: accessToken.token
      }
    });
    
    const mailOptions = {
      from: 'Kekeli Group <julietetebenissan@gmail.com>',
      to: 'email-de-destination@exemple.com',
      subject: 'Test OAuth2 - Kekeli Group',
      text: 'Ceci est un test avec OAuth2',
      html: '<b>Ceci est un test avec OAuth2</b>'
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Email envoyé:', result.messageId);
  } catch (error) {
    console.error('Erreur:', error);
  }
}

sendMail();