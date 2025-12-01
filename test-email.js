const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'julietetebenissan@gmail.com',  // Remplacez par votre email
    pass: 'wnbldvfmdvhijlgh'       // Le mot de passe généré
  }
});

async function sendTestEmail() {
  try {
    const info = await transporter.sendMail({
      from: '"Kekeli Group" <julietetebenissan@gmail.com>',
      to: 'lydiecocou@gmail.com@gmail.com',  // Mettez votre email de test
      subject: 'Test d\'envoi d\'email',
      text: 'Ceci est un email de test depuis Kekeli Group',
      html: '<b>Ceci est un email de test depuis Kekeli Group</b>'
    });

    console.log('Message envoyé: %s', info.messageId);
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
  }
}

sendTestEmail();