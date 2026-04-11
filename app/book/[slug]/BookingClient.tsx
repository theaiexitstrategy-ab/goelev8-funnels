'use client';

import { useMemo, useState } from 'react';

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

type Props = {
  slug: string;
  calendar: {
    title: string;
    timezone: string;
    booking_window_days: number;
    min_notice_hours: number;
  };
  services: Service[];
  availability: Availability[];
  bookedAppointments: AppointmentSlot[];
};

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const styles = {
  page: {
    minHeight: '100vh',
    background: '#080a0f',
    color: '#ffffff',
    fontFamily: 'Outfit, system-ui, sans-serif',
    padding: '24px 16px 48px',
  } as React.CSSProperties,
  container: {
    maxWidth: 980,
    margin: '0 auto',
  } as React.CSSProperties,
  card: {
    background: '#0f141f',
    border: '1px solid rgba(0, 212, 255, 0.15)',
    borderRadius: 28,
    padding: 28,
    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.25)',
  } as React.CSSProperties,
  heading: {
    fontFamily: 'Bebas Neue, sans-serif',
    fontSize: 52,
    lineHeight: 1,
    letterSpacing: 1.2,
    margin: 0,
    color: '#00d4ff',
  } as React.CSSProperties,
  subheading: {
    marginTop: 12,
    marginBottom: 24,
    color: '#b8c7d6',
    maxWidth: 760,
    fontSize: 16,
    lineHeight: 1.8,
  } as React.CSSProperties,
  stepBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 10,
    marginBottom: 28,
  } as React.CSSProperties,
  stepItem: (active: boolean) => ({
    padding: '12px 14px',
    borderRadius: 16,
    textAlign: 'center',
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    background: active ? '#00d4ff' : 'rgba(255,255,255,0.04)',
    color: active ? '#080a0f' : '#a3b1c2',
    fontWeight: 700,
  }) as React.CSSProperties,
  sectionTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  } as React.CSSProperties,
  sectionHeading: {
    fontSize: 18,
    letterSpacing: 0.8,
    margin: 0,
    color: '#ffffff',
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gap: 14,
  } as React.CSSProperties,
  cardButton: (active: boolean) => ({
    width: '100%',
    minHeight: 84,
    borderRadius: 22,
    border: active ? '1px solid #00e89a' : '1px solid rgba(255,255,255,0.08)',
    background: active ? 'rgba(0, 232, 154, 0.08)' : '#121826',
    color: active ? '#00e89a' : '#c6d2df',
    padding: '18px 20px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'transform 160ms ease, border-color 160ms ease',
  }) as React.CSSProperties,
  input: {
    width: '100%',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.12)',
    background: '#090c12',
    color: '#f5faff',
    padding: '16px 16px',
    fontSize: 15,
    outline: 'none',
  } as React.CSSProperties,
  button: {
    width: '100%',
    borderRadius: 18,
    border: 'none',
    background: '#00e89a',
    color: '#080a0f',
    padding: '18px 22px',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 16,
  } as React.CSSProperties,
  textSmall: {
    color: '#7d8ba5',
    fontSize: 13,
    lineHeight: 1.7,
  } as React.CSSProperties,
  status: {
    background: 'rgba(0, 212, 255, 0.08)',
    borderRadius: 16,
    padding: '16px 18px',
    marginTop: 20,
    color: '#b8c7d6',
    fontSize: 14,
  } as React.CSSProperties,
};

function formatMoney(cents: number) {
  if (cents === 0) return 'Free';
  return `$${(cents / 100).toFixed(2).replace(/\.00$/, '')}`;
}

function getCalendarDate(date: Date, timezone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function getCalendarDayOfWeek(date: Date, timezone: string) {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  }).format(date);
  return days.indexOf(weekday);
}

function formatDateLabel(dateString: string, timezone: string) {
  const date = new Date(`${dateString}T12:00:00`);
  const day = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: '2-digit',
  }).format(date);
  return day;
}

function buildTimeSlots(start: string, end: string, durationMinutes: number) {
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  const slots: string[] = [];
  let current = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;

  while (current + durationMinutes <= endTotal) {
    const hour = Math.floor(current / 60);
    const minute = current % 60;
    slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    current += durationMinutes;
  }

  return slots;
}

function formatTime(time: string) {
  const [hour, minute] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function appointmentKey(date: string, time: string) {
  return `${date}|${time}`;
}

export default function BookingClient({
  slug,
  calendar,
  services,
  availability,
  bookedAppointments,
}: Props) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calendarToday = useMemo(() => getCalendarDate(new Date(), calendar.timezone), [calendar.timezone]);
  const dateOptions = useMemo(() => {
    const options: string[] = [];
    const today = new Date(calendarToday + 'T00:00:00');
    for (let i = 0; i < Math.max(7, calendar.booking_window_days); i += 1) {
      const next = new Date(today.getTime() + i * 86400000);
      const nextDate = getCalendarDate(next, calendar.timezone);
      if (!options.includes(nextDate)) options.push(nextDate);
    }
    return options.slice(0, calendar.booking_window_days);
  }, [calendar.booking_window_days, calendar.timezone, calendarToday]);

  const bookedKeys = useMemo(() => {
    return new Set(
      bookedAppointments.map((appointment) => {
        const date = new Date(appointment.appointment_start).toLocaleDateString('en-CA', {
          timeZone: calendar.timezone,
        });
        const time = new Date(appointment.appointment_start).toLocaleTimeString('en-GB', {
          timeZone: calendar.timezone,
          hour: '2-digit',
          minute: '2-digit',
        });
        return appointmentKey(date, time);
      })
    );
  }, [bookedAppointments, calendar.timezone]);

  const selectedService = services.find((service) => service.id === selectedServiceId) || services[0];

  const availableDates = useMemo(() => {
    return dateOptions.filter((date) => {
      const dayIndex = getWeekdayFromDate(date, calendar.timezone);
      return availability.some((item) => item.day_of_week === dayIndex);
    });
  }, [availability, calendar.timezone, dateOptions]);

  const availableTimes = useMemo(() => {
    if (!selectedDate || !selectedService) return [];
    const dayIndex = getWeekdayFromDate(selectedDate, calendar.timezone);
    const windows = availability.filter((item) => item.day_of_week === dayIndex);

    const slots = windows.flatMap((window) =>
      buildTimeSlots(window.start_time.slice(0, 5), window.end_time.slice(0, 5), selectedService.duration_minutes)
    );

    return slots.filter((slot) => !bookedKeys.has(appointmentKey(selectedDate, slot)));
  }, [availability, bookedKeys, selectedDate, selectedService, calendar.timezone]);

  function getWeekdayFromDate(dateString: string, timezone: string) {
    const date = new Date(`${dateString}T12:00:00`);
    const weekday = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
    }).format(date);
    return days.indexOf(weekday);
  }

  async function handleSubmit() {
    if (!selectedServiceId || !selectedDate || !selectedTime || !leadName || !leadEmail || !leadPhone) {
      setError('Please complete every step before booking your appointment.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          service_id: selectedServiceId,
          date: selectedDate,
          time: selectedTime,
          lead_name: leadName,
          lead_email: leadEmail,
          lead_phone: leadPhone,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload?.error || 'We could not complete your booking. Please try again.');
      } else {
        setConfirmation(`Your appointment is confirmed for ${formatDateLabel(selectedDate, calendar.timezone)} at ${formatTime(selectedTime)}.`);
        setStep(5);
      }
    } catch (err) {
      setError('Unable to submit booking right now. Please try again in a moment.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.sectionTitle}>
            <div>
              <p style={{ margin: 0, color: '#00e89a', letterSpacing: 1.5, fontSize: 13 }}>Book with {calendar.title}</p>
              <h1 style={styles.heading}>Schedule a meeting</h1>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, color: '#7e8e9d', fontSize: 13 }}>Timezone</p>
              <p style={{ margin: 0, fontWeight: 700, color: '#ffffff' }}>{calendar.timezone}</p>
            </div>
          </div>

          <p style={styles.subheading}>Choose a service, pick a day, select a time, and confirm your details. This booking experience is designed to feel premium, fast, and distraction-free.</p>

          <div style={styles.stepBar}>
            {['Service', 'Date', 'Time', 'Info'].map((label, index) => (
              <div key={label} style={styles.stepItem(step === index + 1 || (step > index + 1 && step < 5))}>
                {label}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div style={styles.grid}>
              <div style={styles.sectionTitle}>
                <h2 style={styles.sectionHeading}>Select a service</h2>
                <p style={styles.textSmall}>{services.length} option{services.length === 1 ? '' : 's'} available</p>
              </div>
              {services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  style={styles.cardButton(service.id === selectedServiceId)}
                  onClick={() => setSelectedServiceId(service.id)}
                >
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{service.name}</div>
                  <div style={{ color: '#9da9b9', marginBottom: 8 }}>{service.description || 'No description provided.'}</div>
                  <div style={{ color: '#00e89a', fontWeight: 700 }}>{formatMoney(service.price_cents)} · {service.duration_minutes} min</div>
                </button>
              ))}
              <button
                type="button"
                style={{ ...styles.button, opacity: selectedServiceId ? 1 : 0.5, cursor: selectedServiceId ? 'pointer' : 'not-allowed' }}
                onClick={() => selectedServiceId && setStep(2)}
                disabled={!selectedServiceId}
              >
                Continue to date
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={styles.grid}>
              <div style={styles.sectionTitle}>
                <h2 style={styles.sectionHeading}>Pick a day</h2>
                <p style={styles.textSmall}>Available for the next {calendar.booking_window_days} days</p>
              </div>
              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
                {availableDates.map((date) => {
                  const available = availability.some((item) => item.day_of_week === getWeekdayFromDate(date, calendar.timezone));
                  return (
                    <button
                      key={date}
                      type="button"
                      style={styles.cardButton(date === selectedDate)}
                      onClick={() => available && setSelectedDate(date)}
                      disabled={!available}
                    >
                      <div>{formatDateLabel(date, calendar.timezone)}</div>
                      <div style={{ marginTop: 8, color: available ? '#c6d2df' : '#4d5765' }}>
                        {available ? 'Available' : 'Closed'}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div>
                <button
                  type="button"
                  style={{ ...styles.button, opacity: selectedDate ? 1 : 0.5, cursor: selectedDate ? 'pointer' : 'not-allowed' }}
                  onClick={() => selectedDate && setStep(3)}
                  disabled={!selectedDate}
                >
                  Continue to time
                </button>
                <button
                  type="button"
                  style={{ ...styles.button, marginTop: 10, background: 'transparent', color: '#00d4ff', border: '1px solid rgba(0, 212, 255, 0.3)' }}
                  onClick={() => setStep(1)}
                >
                  Back to service
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={styles.grid}>
              <div style={styles.sectionTitle}>
                <h2 style={styles.sectionHeading}>Choose a time</h2>
                <p style={styles.textSmall}>Slots are shown in {calendar.timezone}</p>
              </div>
              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
                {availableTimes.length > 0 ? (
                  availableTimes.map((time) => (
                    <button
                      key={time}
                      type="button"
                      style={styles.cardButton(time === selectedTime)}
                      onClick={() => setSelectedTime(time)}
                    >
                      <div>{formatTime(time)}</div>
                      <div style={{ color: '#9da9b9' }}>{selectedService?.duration_minutes} min</div>
                    </button>
                  ))
                ) : (
                  <div style={{ color: '#b8c7d6' }}>No open slots on this day. Please select another date.</div>
                )}
              </div>
              <div>
                <button
                  type="button"
                  style={{ ...styles.button, opacity: selectedTime ? 1 : 0.5, cursor: selectedTime ? 'pointer' : 'not-allowed' }}
                  onClick={() => selectedTime && setStep(4)}
                  disabled={!selectedTime}
                >
                  Continue to info
                </button>
                <button
                  type="button"
                  style={{ ...styles.button, marginTop: 10, background: 'transparent', color: '#00d4ff', border: '1px solid rgba(0, 212, 255, 0.3)' }}
                  onClick={() => setStep(2)}
                >
                  Back to date
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={styles.grid}>
              <div style={styles.sectionTitle}>
                <h2 style={styles.sectionHeading}>Your details</h2>
                <p style={styles.textSmall}>We only need your name, email, and phone to confirm your booking.</p>
              </div>
              <div style={{ display: 'grid', gap: 14 }}>
                <input
                  style={styles.input}
                  placeholder="Full name"
                  value={leadName}
                  onChange={(event) => setLeadName(event.target.value)}
                />
                <input
                  style={styles.input}
                  placeholder="Email address"
                  type="email"
                  value={leadEmail}
                  onChange={(event) => setLeadEmail(event.target.value)}
                />
                <input
                  style={styles.input}
                  placeholder="Phone number"
                  type="tel"
                  value={leadPhone}
                  onChange={(event) => setLeadPhone(event.target.value)}
                />
              </div>
              <div>
                <button
                  type="button"
                  style={styles.button}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Booking...' : 'Confirm appointment'}
                </button>
                <button
                  type="button"
                  style={{ ...styles.button, marginTop: 10, background: 'transparent', color: '#00d4ff', border: '1px solid rgba(0, 212, 255, 0.3)' }}
                  onClick={() => setStep(3)}
                >
                  Back to time
                </button>
              </div>
              <p style={styles.textSmall}>By booking, you agree to receive a confirmation SMS. Reply STOP to opt out.</p>
            </div>
          )}

          {step === 5 && (
            <div style={styles.grid}>
              <div style={styles.sectionTitle}>
                <h2 style={styles.sectionHeading}>Appointment confirmed</h2>
                <p style={styles.textSmall}>A confirmation has been created for your selected time.</p>
              </div>
              <div style={{ ...styles.card, background: '#07101a', border: '1px solid rgba(0, 232, 154, 0.18)' }}>
                <p style={{ color: '#00e89a', margin: 0, fontWeight: 700 }}>Booking confirmed</p>
                <p style={{ margin: '12px 0 0', fontSize: 18 }}>{confirmation}</p>
                <p style={{ marginTop: 18, color: '#9da9b9' }}>You will receive a confirmation SMS shortly. If there is an issue with SMS delivery, your booking remains confirmed.</p>
              </div>
            </div>
          )}

          {error && <div style={styles.status}>{error}</div>}
        </div>
      </div>
    </div>
  );
}
