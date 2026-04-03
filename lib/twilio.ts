// lib/twilio.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import twilio from 'twilio';

export async function provisionTollFreeNumber(userId: string) {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

  // Search available toll-free numbers
  const available = await client.availablePhoneNumbers('US')
    .tollFree.list({ limit: 1 });

  if (!available.length) throw new Error('No toll-free numbers available');

  // Purchase the number
  const purchased = await client.incomingPhoneNumbers.create({
    phoneNumber: available[0].phoneNumber,
    smsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/sms/inbound`,
    smsMethod: 'POST',
    friendlyName: `GoElev8.ai — ${userId.slice(0, 8)}`,
  });

  return { phoneNumber: purchased.phoneNumber, sid: purchased.sid };
}

export async function sendSMS(to: string, from: string, body: string) {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  return client.messages.create({ to, from, body });
}
