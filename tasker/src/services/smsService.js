const telnyx = require('telnyx')('KEY0191920CB51DA5E845BF061503B32F31_10ozqIwzPhVlV8epTGBGUF');

class TextService {
    constructor() {
        this.telnyx = telnyx;
    }
  
    async sendText(to, text) {
        try {
            telnyx.messages.create({
                'from': '+12722071694', // Your Telnyx number
                'to': to,
                'text': text
            }).then(function(response){
              const message = response.data; // asynchronously handled
              console.log("message sent:", message);
            })
    
        } catch (error) {
            console.error('Error sending text:', error);
        }
    }
  }
  
  module.exports = new TextService();