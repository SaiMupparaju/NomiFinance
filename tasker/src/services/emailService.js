
const nodemailer = require('nodemailer');



class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.mailgun.org',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: 'postmaster@sandbox50a0776f6a664421bf6ca474029a8c00.mailgun.org', // your Gmail email
                pass: '7275b863ceb8407dec3ba8c0af983c32-777a617d-c01a0da4'   // your Gmail password or App Password
            }
        });
    }
  
    async sendEmail(to, subject, text) {
        try {
            const info = await this.transporter.sendMail({
                from: 'postmaster@sandbox50a0776f6a664421bf6ca474029a8c00.mailgun.org', // sender address
                to: to, // list of receivers
                subject: subject, // Subject line
                text: text, // plain text body
                html: `<p>${text}</p>` // html body
            });
    
            console.log('Message sent: %s', info.messageId);
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }
  }
  
  module.exports = new EmailService();