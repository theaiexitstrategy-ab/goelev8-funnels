'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { useState, useTransition } from 'react';
import { saveGuestProfile } from './actions';

type Initial = {
  display_name: string;
  city: string;
  ig_handle: string;
  tt_handle: string;
  sc_handle: string;
  x_handle: string;
};

export default function GuestForm({ initial }: { initial: Initial }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const onSubmit = (formData: FormData) => {
    setError('');
    startTransition(async () => {
      const result = await saveGuestProfile(formData);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="flex w-full flex-col items-center">
      <p className="animate-fade-up font-bebas text-[11px] tracking-[0.35em] text-hush-gold">
        STEP 2 / 2
      </p>
      <h1
        className="bg-hush-gold-text-mid text-fill-transparent mt-2 animate-fade-up font-bebas text-[42px] leading-none tracking-wide"
        style={{ animationDelay: '0.1s' }}
      >
        Your party profile.
      </h1>
      <p
        className="mb-6 mt-3 animate-fade-up font-cormorant text-[15px] italic text-hush-muted2"
        style={{ animationDelay: '0.2s' }}
      >
        How others see you in the room.
      </p>

      <form
        action={onSubmit}
        className="flex w-full animate-fade-up flex-col gap-3"
        style={{ animationDelay: '0.3s' }}
      >
        <Field label="Display name" name="display_name" defaultValue={initial.display_name} required placeholder="Alex" />
        <Field label="City" name="city" defaultValue={initial.city} placeholder="St. Louis" />

        <p className="mt-3 font-outfit text-[9px] uppercase tracking-[0.2em] text-hush-muted">
          Socials (optional)
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Instagram" name="ig_handle" defaultValue={initial.ig_handle} placeholder="@you" compact />
          <Field label="TikTok" name="tt_handle" defaultValue={initial.tt_handle} placeholder="@you" compact />
          <Field label="Snapchat" name="sc_handle" defaultValue={initial.sc_handle} placeholder="@you" compact />
          <Field label="X" name="x_handle" defaultValue={initial.x_handle} placeholder="@you" compact />
        </div>

        {error && (
          <div className="mt-2 font-outfit text-[12px] leading-snug text-hush-red">{error}</div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bg-hush-gold-btn mt-4 flex w-full items-center justify-center rounded-md py-[17px] font-bebas text-[18px] tracking-[0.2em] text-hush-black shadow-[0_8px_32px_rgba(201,168,76,0.25)] transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? 'SAVING...' : 'ENTER HUSH'}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required,
  compact,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  compact?: boolean;
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
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className={`w-full rounded-md border border-hush-gline bg-hush-card font-outfit text-hush-white outline-none transition-colors placeholder:text-hush-muted focus:border-hush-gold ${
          compact ? 'px-3 py-2.5 text-[13px]' : 'px-3.5 py-3 text-[14px]'
        }`}
      />
    </div>
  );
}
