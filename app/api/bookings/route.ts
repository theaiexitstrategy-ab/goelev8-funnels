// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { createServiceClient } from '@/lib/db/supabase-service';
import { funnelArcjet, applyRateLimit } from '@/lib/security/rate-limit';
import { z } from 'zod';

const bookingSchema = z.object({
  slug: z.string().min(1),
  service_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  lead_name: z.string().min(1).max(200),
  lead_email: z.string().email(),
  lead_phone: z.string().min(7).max(30),
});

function parseTimezoneDateTime(dateString: string, timeString: string, timeZone: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hour, minute] = timeString.split(':').map(Number);
  const localAsUtc = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = formatter.formatToParts(localAsUtc).reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {} as Record<string, string>);

  const targetUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  const offset = targetUtc - localAsUtc.getTime();
  return new Date(localAsUtc.getTime() - offset);
}

function getCalendarDate(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function addDaysToDate(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function getWeekday(dateString: string, timeZone: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  const utcDate = parseTimezoneDateTime(dateString, '00:00', timeZone);
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(utcDate);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);
}

function formatSmsDateTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

async function sendSmsConfirmation(name: string, phone: string, businessName: string, appointmentDate: Date, timeZone: string) {
  const firstName = name.split(' ')[0].replace(/[^a-zA-Z]/g, '') || 'there';
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_MASTER_NUMBER;

  if (!accountSid || !authToken || !fromNumber) return false;

  const smsBody = `Hi ${firstName}! Your appointment with ${businessName} is confirmed for ${formatSmsDateTime(appointmentDate, timeZone)}. Reply STOP to opt out.`;

  const twilioRes = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: phone,
        From: fromNumber,
        Body: smsBody,
      }),
    }
  );

  return twilioRes.ok;
}

export async function POST(req: Request) {
  try {
    const rateLimit = await applyRateLimit(funnelArcjet, req);
    if (rateLimit) return rateLimit;

    const body = await req.json();
    const parsed = bookingSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Invalid booking request' }, { status: 400 });
    }

    const { slug, service_id, date, time, lead_name, lead_email, lead_phone } = parsed.data;
    const supabase = createServiceClient();

    const { data: calendar, error: calendarError } = await supabase
      .from('booking_calendars')
      .select('id, title, timezone, booking_window_days, min_notice_hours')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (calendarError || !calendar) {
      return Response.json({ error: 'Calendar not found' }, { status: 404 });
    }

    const { data: service, error: serviceError } = await supabase
      .from('booking_services')
      .select('id, name, duration_minutes, price_cents')
      .eq('id', service_id)
      .eq('calendar_id', calendar.id)
      .eq('is_active', true)
      .single();

    if (serviceError || !service) {
      return Response.json({ error: 'Service not available' }, { status: 404 });
    }

    const calendarToday = getCalendarDate(new Date(), calendar.timezone);
    const windowLastDate = addDaysToDate(calendarToday, calendar.booking_window_days);

    if (date < calendarToday || date > windowLastDate) {
      return Response.json({ error: 'Selected date is outside booking window' }, { status: 400 });
    }

    const slotDate = parseTimezoneDateTime(date, time, calendar.timezone);
    const minNoticeAt = new Date(Date.now() + calendar.min_notice_hours * 60 * 60 * 1000);
    if (slotDate < minNoticeAt) {
      return Response.json({ error: 'Selected time is too soon' }, { status: 400 });
    }

    const dayOfWeek = getWeekday(date, calendar.timezone);
    const { data: availabilityRows } = await supabase
      .from('booking_availability')
      .select('start_time, end_time')
      .eq('calendar_id', calendar.id)
      .eq('day_of_week', dayOfWeek);

    if (!availabilityRows || availabilityRows.length === 0) {
      return Response.json({ error: 'No availability for selected day' }, { status: 400 });
    }

    const validSlot = availabilityRows.some((window) => {
      const start = window.start_time.slice(0, 5);
      const end = window.end_time.slice(0, 5);
      const slots = [];
      let [slotHour, slotMinute] = start.split(':').map(Number);
      const [endHour, endMinute] = end.split(':').map(Number);
      let current = slotHour * 60 + slotMinute;
      const endTotal = endHour * 60 + endMinute;
      while (current + service.duration_minutes <= endTotal) {
        const hour = Math.floor(current / 60);
        const minute = current % 60;
        slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
        current += service.duration_minutes;
      }
      return slots.includes(time);
    });

    if (!validSlot) {
      return Response.json({ error: 'Selected time does not match availability' }, { status: 400 });
    }

    const appointmentEndDate = new Date(slotDate.getTime() + service.duration_minutes * 60 * 1000);

    const { data: existingAppointments } = await supabase
      .from('booking_appointments')
      .select('appointment_start, appointment_end')
      .eq('calendar_id', calendar.id)
      .neq('status', 'cancelled');

    if (existingAppointments?.some((existing) => {
      const existingStart = new Date(existing.appointment_start);
      const existingEnd = new Date(existing.appointment_end);
      return existingStart < appointmentEndDate && existingEnd > slotDate;
    })) {
      return Response.json({ error: 'Selected time is already booked' }, { status: 409 });
    }

    const { data: appointment, error: insertError } = await supabase
      .from('booking_appointments')
      .insert({
        calendar_id: calendar.id,
        service_id: service.id,
        lead_name,
        lead_email,
        lead_phone,
        appointment_start: slotDate.toISOString(),
        appointment_end: appointmentEndDate.toISOString(),
        status: 'pending',
        notes: null,
        confirmation_sms_sent: false,
        reminder_sms_sent: false,
      })
      .select('id')
      .single();

    if (insertError || !appointment) {
      console.error('[bookings] insert error', insertError);
      return Response.json({ error: 'Failed to create appointment' }, { status: 500 });
    }

    const smsSent = await sendSmsConfirmation(lead_name, lead_phone, calendar.title, slotDate, calendar.timezone);
    if (smsSent) {
      await supabase
        .from('booking_appointments')
        .update({ confirmation_sms_sent: true })
        .eq('id', appointment.id);
    }

    return Response.json({ success: true, appointment_id: appointment.id });
  } catch (err) {
    console.error('[api/bookings]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
