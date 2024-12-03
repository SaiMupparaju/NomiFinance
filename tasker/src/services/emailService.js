
const nodemailer = require('nodemailer');



class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.mailgun.org',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: 'postmaster@mg.nomifinance.com', // your Gmail email
                pass: '811ee3b1812ef0142872b7d432aec11e-6df690bb-6783f095'   // your Gmail password or App Password
            }
        });
    }
  
    async sendEmail(to, subject, text) {
        try {
            const info = await this.transporter.sendMail({
                from: 'sophia@mg.nomifinance.com', // sender address
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