
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
        const msg = { from: 'support@mg.nomifinance.com', 
          to: to, 
          subject: subject, 
          text: text,
          html :  `<p>${text}</p>` 
        };
        await this.transporter.sendMail(msg);
      };
  }
  
  module.exports = new EmailService();