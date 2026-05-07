'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { useState, useTransition } from 'react';
import { savePromoterProfile } from './actions';
import { HUSH_PRICING, type PromoterTier } from '@/lib/hush/pricing';

type Initial = {
  brand_name: string;
  keyword_prefix: string;
  plan: PromoterTier;
};

const PLAN_ORDER: PromoterTier[] = ['hustle', 'pro', 'mogul'];

export default function PromoterForm({ initial }: { initial: Initial }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<PromoterTier>(initial.plan);
  const [keyword, setKeyword] = useState(initial.keyword_prefix);

  const onSubmit = (formData: FormData) => {
    setError('');
    formData.set('plan', plan);
    formData.set('keyword_prefix', keyword.toUpperCase());
    startTransition(async () => {
      const result = await savePromoterProfile(formData);
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
        Build your brand.
      </h1>
      <p
        className="mb-6 mt-3 animate-fade-up font-cormorant text-[15px] italic text-hush-muted2"
        style={{ animationDelay: '0.2s' }}
      >
        Set your line. Pick your plan.
      </p>

      <form
        action={onSubmit}
        className="flex w-full animate-fade-up flex-col gap-3"
        style={{ animationDelay: '0.3s' }}
      >
        <div>
          <label
            htmlFor="brand_name"
            className="mb-1.5 block font-outfit text-[9px] uppercase tracking-[0.18em] text-hush-muted"
          >
            Brand name
          </label>
          <input
            id="brand_name"
            name="brand_name"
            defaultValue={initial.brand_name}
            placeholder="Niddy Gritty Presents"
            required
            autoComplete="off"
            className="w-full rounded-md border border-hush-gline bg-hush-card px-3.5 py-3 font-outfit text-[14px] text-hush-white outline-none transition-colors placeholder:text-hush-muted focus:border-hush-gold"
          />
        </div>

        <div>
          <label
            htmlFor="keyword_prefix"
            className="mb-1.5 block font-outfit text-[9px] uppercase tracking-[0.18em] text-hush-muted"
          >
            Keyword prefix
          </label>
          <input
            id="keyword_prefix"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="HUSH"
            maxLength={20}
            required
            autoComplete="off"
            autoCapitalize="characters"
            className="w-full rounded-md border border-hush-gline bg-hush-card px-3.5 py-3 font-bebas text-[16px] tracking-[0.15em] text-hush-white outline-none transition-colors placeholder:text-hush-muted focus:border-hush-gold"
          />
          <p className="mt-1.5 font-outfit text-[10px] leading-snug text-hush-muted">
            Guests text your prefix to claim VIP access. Letters &amp; numbers only.
          </p>
        </div>

        <p className="mt-3 font-outfit text-[9px] uppercase tracking-[0.2em] text-hush-muted">
          Choose your plan
        </p>
        <div className="flex flex-col gap-2">
          {PLAN_ORDER.map((key) => {
            const opt = HUSH_PRICING.plans[key];
            const isSelected = plan === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setPlan(key)}
                className={`flex w-full items-center justify-between rounded-lg border bg-hush-card px-4 py-3 text-left transition-all active:scale-[0.99] ${
                  isSelected
                    ? 'border-hush-gold bg-hush-gdim'
                    : 'border-hush-gline hover:border-hush-gold'
                }`}
              >
                <div>
                  <div className="font-bebas text-[18px] tracking-[0.08em] text-hush-white">
                    {opt.name}
                  </div>
                  <div className="font-outfit text-[11px] text-hush-muted2">
                    {opt.credits} credits + {opt.smsIncluded} SMS &middot; {opt.numberType} number
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-hush-gold-text-mid text-fill-transparent font-bebas text-[22px] leading-none">
                    ${opt.price}
                  </div>
                  <div className="font-outfit text-[9px] uppercase tracking-[0.15em] text-hush-muted">
                    /mo
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mt-2 font-outfit text-[12px] leading-snug text-hush-red">{error}</div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bg-hush-gold-btn mt-4 flex w-full items-center justify-center rounded-md py-[17px] font-bebas text-[18px] tracking-[0.2em] text-hush-black shadow-[0_8px_32px_rgba(201,168,76,0.25)] transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? 'SAVING...' : 'OPEN THE DOOR'}
        </button>

        <p className="mt-2 text-center font-outfit text-[10px] leading-snug text-hush-muted">
          Billing connects in your dashboard. Trial runs while you set up.
        </p>
      </form>
    </div>
  );
}
