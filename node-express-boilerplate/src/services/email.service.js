const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');

//TODO : update config for postman from sandbox
const transport = nodemailer.createTransport({
  host: 'smtp.mailgun.org',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
      user: 'postmaster@sandbox50a0776f6a664421bf6ca474029a8c00.mailgun.org', // your Gmail email
      pass: '7275b863ceb8407dec3ba8c0af983c32-777a617d-c01a0da4'   // your Gmail password or App Password
  }
});

/* istanbul ignore next */
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() => logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env'));
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text) => {
  const msg = { from: config.email.from, 
    to: to, 
    subject: subject, 
    text: text,
    html :  `<p>${text}</p>` 
  };
  await transport.sendMail(msg);
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
  const subject = 'Reset password';
  // replace this url with the link to the reset password page of your front-end app
  const resetPasswordUrl = `http://localhost:3000/reset-password?token=${token}`;
  const text = `Dear user,
To reset your password, click on this link: ${resetPasswordUrl}
If you did not request any password resets, then ignore this email.`;
  await sendEmail(to, subject, text);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
  const subject = 'Nomi Email Verification';
  // replace this url with the link to the email verification page of your front-end app
  const verificationEmailUrl = `http://localhost:3000/verify-email?token=${token}`; //TODO Update 
  const text = `
Thanks for signing up to Nomi! \n \n To verify your email, click on this link: ${verificationEmailUrl}
If you did not create an account, then ignore this email.`;
  await sendEmail(to, subject, text);
};

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
};
