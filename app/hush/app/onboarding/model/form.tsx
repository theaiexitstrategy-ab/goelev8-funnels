'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { useState, useTransition } from 'react';
import { saveModelProfile } from './actions';

type Initial = {
  stage_name: string;
  city: string;
  ig_handle: string;
  of_url: string;
};

export default function ModelForm({ initial }: { initial: Initial }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const onSubmit = (formData: FormData) => {
    setError('');
    startTransition(async () => {
      const result = await saveModelProfile(formData);
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
        Be the night.
      </h1>
      <p
        className="mb-6 mt-3 animate-fade-up font-cormorant text-[15px] italic text-hush-muted2"
        style={{ animationDelay: '0.2s' }}
      >
        Stage name, socials, the room is yours.
      </p>

      <form
        action={onSubmit}
        className="flex w-full animate-fade-up flex-col gap-3"
        style={{ animationDelay: '0.3s' }}
      >
        <div>
          <label
            htmlFor="stage_name"
            className="mb-1.5 block font-outfit text-[9px] uppercase tracking-[0.18em] text-hush-muted"
          >
            Stage name
          </label>
          <input
            id="stage_name"
            name="stage_name"
            defaultValue={initial.stage_name}
            placeholder="Lola Noir"
            required
            autoComplete="off"
            className="w-full rounded-md border border-hush-gline bg-hush-card px-3.5 py-3 font-cormorant text-[18px] italic text-hush-white outline-none transition-colors placeholder:text-hush-muted focus:border-hush-gold"
          />
        </div>

        <div>
          <label
            htmlFor="city"
            className="mb-1.5 block font-outfit text-[9px] uppercase tracking-[0.18em] text-hush-muted"
          >
            Home city
          </label>
          <input
            id="city"
            name="city"
            defaultValue={initial.city}
            placeholder="St. Louis"
            autoComplete="off"
            className="w-full rounded-md border border-hush-gline bg-hush-card px-3.5 py-3 font-outfit text-[14px] text-hush-white outline-none transition-colors placeholder:text-hush-muted focus:border-hush-gold"
          />
        </div>

        <div>
          <label
            htmlFor="ig_handle"
            className="mb-1.5 block font-outfit text-[9px] uppercase tracking-[0.18em] text-hush-muted"
          >
            Instagram
          </label>
          <input
            id="ig_handle"
            name="ig_handle"
            defaultValue={initial.ig_handle}
            placeholder="@lolanoir"
            autoComplete="off"
            className="w-full rounded-md border border-hush-gline bg-hush-card px-3.5 py-3 font-outfit text-[14px] text-hush-white outline-none transition-colors placeholder:text-hush-muted focus:border-hush-gold"
          />
        </div>

        <div>
          <label
            htmlFor="of_url"
            className="mb-1.5 block font-outfit text-[9px] uppercase tracking-[0.18em] text-hush-muted"
          >
            OnlyFans <span className="text-hush-of">(optional)</span>
          </label>
          <input
            id="of_url"
            name="of_url"
            defaultValue={initial.of_url}
            type="url"
            placeholder="https://onlyfans.com/lolanoir"
            autoComplete="off"
            className="w-full rounded-md border border-hush-gline bg-hush-card px-3.5 py-3 font-outfit text-[13px] text-hush-white outline-none transition-colors placeholder:text-hush-muted focus:border-hush-gold"
          />
          <p className="mt-1.5 font-outfit text-[10px] leading-snug text-hush-muted">
            Linked profiles unlock the OF badge once verified.
          </p>
        </div>

        {error && (
          <div className="mt-2 font-outfit text-[12px] leading-snug text-hush-red">{error}</div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bg-hush-gold-btn mt-4 flex w-full items-center justify-center rounded-md py-[17px] font-bebas text-[18px] tracking-[0.2em] text-hush-black shadow-[0_8px_32px_rgba(201,168,76,0.25)] transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? 'SAVING...' : 'TAKE THE STAGE'}
        </button>

        <p className="mt-2 text-center font-outfit text-[10px] leading-snug text-hush-muted">
          Payouts connect once you take your first booking.
        </p>
      </form>
    </div>
  );
}
