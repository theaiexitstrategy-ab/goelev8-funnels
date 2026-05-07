'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Role selector tile UI. Three cards (guest / promoter / model) — each
// upserts hush_users.role and routes to the role-specific onboarding.

import { useState, useTransition } from 'react';
import { pickRole, type HushRole } from './actions';

type RoleOption = {
  role: HushRole;
  label: string;
  tagline: string;
  description: string;
};

const ROLES: RoleOption[] = [
  {
    role: 'guest',
    label: 'Guest',
    tagline: 'Find the party.',
    description: 'Discover events, grab passes, and join the night.',
  },
  {
    role: 'promoter',
    label: 'Promoter',
    tagline: 'Run the night.',
    description: 'Sell tickets, blast your list, book the room.',
  },
  {
    role: 'model',
    label: 'Model',
    tagline: 'Be the night.',
    description: 'Get booked, host events, and stream live.',
  },
];

export default function RoleSelector() {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<HushRole | null>(null);
  const [error, setError] = useState('');

  const handlePick = (role: HushRole) => {
    setSelected(role);
    setError('');
    startTransition(async () => {
      try {
        await pickRole(role);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.');
        setSelected(null);
      }
    });
  };

  return (
    <div className="flex w-full flex-col items-center">
      <p
        className="animate-fade-up font-bebas text-[11px] tracking-[0.35em] text-hush-gold"
      >
        STEP 1 / 2
      </p>
      <h1
        className="bg-hush-gold-text-mid text-fill-transparent mt-2 animate-fade-up font-bebas text-[42px] leading-none tracking-wide"
        style={{ animationDelay: '0.1s' }}
      >
        Who are you?
      </h1>
      <p
        className="mb-8 mt-3 animate-fade-up font-cormorant text-[15px] italic text-hush-muted2"
        style={{ animationDelay: '0.2s' }}
      >
        Pick how you&apos;ll show up tonight.
      </p>

      <div className="flex w-full flex-col gap-3">
        {ROLES.map((opt, i) => {
          const isSelected = selected === opt.role;
          return (
            <button
              key={opt.role}
              type="button"
              disabled={pending}
              onClick={() => handlePick(opt.role)}
              className={`group flex w-full animate-fade-up flex-col items-start rounded-lg border bg-hush-card px-5 py-4 text-left transition-all active:scale-[0.985] disabled:cursor-wait ${
                isSelected
                  ? 'border-hush-gold bg-hush-gdim'
                  : 'border-hush-gline hover:border-hush-gold'
              }`}
              style={{ animationDelay: `${0.3 + i * 0.08}s` }}
            >
              <span className="font-bebas text-[20px] tracking-[0.1em] text-hush-white">
                {opt.label}
              </span>
              <span className="font-cormorant text-[14px] italic text-hush-gold">
                {opt.tagline}
              </span>
              <span className="mt-1 font-outfit text-[12px] text-hush-muted2">
                {opt.description}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 font-outfit text-[12px] text-hush-red">{error}</p>
      )}

      <p className="mt-8 font-outfit text-[10px] uppercase tracking-[0.25em] text-hush-muted">
        You can change this later.
      </p>
    </div>
  );
}
