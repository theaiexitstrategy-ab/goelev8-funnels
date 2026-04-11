// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { createServiceClient } from '@/lib/db/supabase-service';
import { notFound } from 'next/navigation';
import BookingClient from './BookingClient';

type Props = { params: { slug: string } };

type Calendar = {
  id: string;
  slug: string;
  title: string;
  timezone: string;
  booking_window_days: number;
  min_notice_hours: number;
  custom_domain: string | null;
};

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  description: string | null;
  price_cents: number;
  is_active: boolean;
};

type Availability = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

type AppointmentSlot = {
  appointment_start: string;
  appointment_end: string;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = params;
  const supabase = createServiceClient();

  const { data: calendar } = await supabase
    .from('booking_calendars')
    .select('title')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!calendar) {
    return { title: 'Booking Page Not Found' };
  }

  return {
    title: `Book an Appointment — ${calendar.title}`,
    description: `Schedule a meeting with ${calendar.title}. Choose a service, pick a time, and book instantly.`,
    openGraph: {
      title: `Book an Appointment — ${calendar.title}`,
      description: `Schedule a meeting with ${calendar.title}. Choose a service, pick a time, and book instantly.`,
    },
  };
}

export default async function BookingPage({ params }: Props) {
  const { slug } = params;
  const supabase = createServiceClient();

  const { data: calendar } = await supabase
    .from('booking_calendars')
    .select('id, slug, title, timezone, booking_window_days, min_notice_hours, custom_domain')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!calendar) {
    notFound();
  }

  const [servicesRes, availabilityRes, appointmentsRes] = await Promise.all([
    supabase
      .from('booking_services')
      .select('id, name, duration_minutes, description, price_cents, is_active')
      .eq('calendar_id', calendar.id)
      .eq('is_active', true),
    supabase
      .from('booking_availability')
      .select('id, day_of_week, start_time, end_time')
      .eq('calendar_id', calendar.id),
    supabase
      .from('booking_appointments')
      .select('appointment_start, appointment_end')
      .eq('calendar_id', calendar.id)
      .neq('status', 'cancelled'),
  ]);

  const services = servicesRes.data || [];
  const availability = availabilityRes.data || [];
  const appointments = appointmentsRes.data || [];

  return (
    <BookingClient
      slug={slug}
      calendar={calendar}
      services={services}
      availability={availability}
      bookedAppointments={appointments}
    />
  );
}
