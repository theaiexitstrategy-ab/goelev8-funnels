'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { ArrowLeft } from 'lucide-react';
import { createEvent } from './actions';

export default function EventForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const onSubmit = (formData: FormData) => {
    setError('');
    startTransition(async () => {
      const result = await createEvent(formData);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <main className="mx-auto flex w-full max-w-[420px] flex-col px-5 pt-6 pb-8">
      <div className="mb-2 flex items-center gap-2">
        <Link
          href="/hush/app/dashboard"
          className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-hush-muted2 transition-colors hover:text-hush-gold"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={18} strokeWidth={1.75} />
        </Link>
        <p className="font-bebas text-[11px] tracking-[0.35em] text-hush-gold">
          NEW EVENT
        </p>
      </div>

      <h1 className="bg-hush-gold-text-mid text-fill-transparent animate-fade-up font-bebas text-[36px] leading-tight tracking-wide">
        Set the room.
      </h1>
      <p
        className="mb-6 mt-2 animate-fade-up font-cormorant text-[14px] italic text-hush-muted2"
        style={{ animationDelay: '0.1s' }}
      >
        Lock the night, then add keywords to start selling.
      </p>

      <form
        action={onSubmit}
        className="flex w-full animate-fade-up flex-col gap-3"
        style={{ animationDelay: '0.2s' }}
      >
        <Field label="Event title" name="title" placeholder="HUSH at Skybar" required />
        <Field label="Venue" name="venue" placeholder="Moonrise Hotel" required />
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <Field label="City" name="city" placeholder="St. Louis" required />
          <Field label="Age" name="age_restriction" defaultValue="21+" />
        </div>
        <Field label="Address (optional)" name="address" placeholder="6177 Delmar Blvd" />

        <Field
          label="Event date & time"
          name="event_date"
          type="datetime-local"
          required
        />
        <Field label="Doors open (optional)" name="doors_open" type="datetime-local" />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Capacity" name="capacity" type="number" placeholder="200" />
          <Field label="Dress code" name="dress_code" placeholder="Elevated" />
        </div>

        <Field
          label="Posh / Eventbrite link (optional)"
          name="posh_url"
          type="url"
          placeholder="https://posh.vip/e/your-event"
        />

        <div>
          <label
            htmlFor="description"
            className="mb-1.5 block font-outfit text-[9px] uppercase tracking-[0.18em] text-hush-muted"
          >
            Description (optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={1000}
            placeholder="Rooftop garden + terrace experience. Tables, VIP, the moment."
            className="w-full resize-none rounded-md border border-hush-gline bg-hush-card px-3.5 py-3 font-outfit text-[13px] text-hush-white outline-none transition-colors placeholder:text-hush-muted focus:border-hush-gold"
          />
        </div>

        {error && (
          <div className="font-outfit text-[12px] leading-snug text-hush-red">{error}</div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bg-hush-gold-btn mt-3 flex w-full items-center justify-center rounded-md py-[17px] font-bebas text-[18px] tracking-[0.2em] text-hush-black shadow-[0_8px_32px_rgba(201,168,76,0.25)] transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? 'CREATING...' : 'CREATE EVENT'}
        </button>

        <p className="mt-1 text-center font-outfit text-[10px] leading-snug text-hush-muted">
          You can add keywords, flyer, and tickets after the event is created.
        </p>
      </form>
    </main>
  );
}

function Field({
  label,
  name,
  type = 'text',
  placeholder,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block font-outfit text-[9px] uppercase tracking-[0.18em] text-hush-muted"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        autoComplete="off"
        className="w-full rounded-md border border-hush-gline bg-hush-card px-3.5 py-3 font-outfit text-[14px] text-hush-white outline-none transition-colors placeholder:text-hush-muted focus:border-hush-gold"
        style={type === 'datetime-local' ? { colorScheme: 'dark' } : undefined}
      />
    </div>
  );
}
