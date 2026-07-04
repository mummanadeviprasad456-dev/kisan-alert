import { Request, Response } from 'express';

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: any = null;

if (TWILIO_SID && TWILIO_AUTH) {
  try {
    const twilio = require('twilio');
    twilioClient = twilio(TWILIO_SID, TWILIO_AUTH);
  } catch (e) {
    console.warn('⚠️  Twilio SDK not available. SMS will be mocked.');
  }
}

export const sendSMS = async (req: Request, res: Response) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: 'Phone number (to) and message are required' });
    }

    if (!twilioClient) {
      console.log(`📱 [MOCK SMS] To: ${to} | Message: ${message}`);
      return res.json({
        success: true,
        mock: true,
        message: `SMS would be sent to ${to}: "${message.substring(0, 50)}..."`,
        sid: `MOCK_${Date.now()}`,
      });
    }

    const result = await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE,
      to: to,
    });

    res.json({
      success: true,
      mock: false,
      sid: result.sid,
      message: `SMS sent to ${to}`,
    });
  } catch (error: any) {
    console.error('SMS send error:', error.message);
    res.status(500).json({ error: 'Failed to send SMS' });
  }
};

export const sendBulkAlerts = async (req: Request, res: Response) => {
  try {
    const { phones, alertTitle, alertMessage } = req.body;

    if (!phones || !Array.isArray(phones) || !alertMessage) {
      return res.status(400).json({ error: 'phones (array) and alertMessage are required' });
    }

    const results = [];

    for (const phone of phones) {
      const fullMessage = `🌾 KISAN ALERT: ${alertTitle || 'Advisory'}\n\n${alertMessage}`;

      if (!twilioClient) {
        console.log(`📱 [MOCK BULK SMS] To: ${phone} | ${fullMessage.substring(0, 50)}...`);
        results.push({ phone, status: 'mock_sent', sid: `MOCK_${Date.now()}` });
      } else {
        try {
          const result = await twilioClient.messages.create({
            body: fullMessage,
            from: TWILIO_PHONE,
            to: phone,
          });
          results.push({ phone, status: 'sent', sid: result.sid });
        } catch (e: any) {
          results.push({ phone, status: 'failed', error: e.message });
        }
      }
    }

    res.json({ success: true, results });
  } catch (error: any) {
    console.error('Bulk alert error:', error.message);
    res.status(500).json({ error: 'Failed to send bulk alerts' });
  }
};
