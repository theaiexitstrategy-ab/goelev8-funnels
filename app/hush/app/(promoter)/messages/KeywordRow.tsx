'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { useState, useTransition } from 'react';
import { Power, Trash2 } from 'lucide-react';
import { toggleKeywordActive, deleteKeyword } from './actions';

const TIER_LABEL: Record<'vip' | 'general' | 'new', string> = {
  vip: 'VIP',
  general: 'General',
  new: 'New',
};

const TIER_COLOR: Record<'vip' | 'general' | 'new', string> = {
  vip: 'text-hush-gold',
  general: 'text-hush-white',
  new: 'text-hush-cyan',
};

type Props = {
  id: string;
  keyword: string;
  tier: 'vip' | 'general' | 'new';
  price: number;
  isActive: boolean;
  usedCount: number;
  eventTitle: string;
};

export default function KeywordRow({
  id,
  keyword,
  tier,
  price,
  isActive,
  usedCount,
  eventTitle,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  const onToggle = () => {
    setError('');
    startTransition(async () => {
      const result = await toggleKeywordActive(id);
      if (result?.error) setError(result.error);
    });
  };

  const onDelete = () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    setError('');
    startTransition(async () => {
      const result = await deleteKeyword(id);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <li
      className={`rounded-lg border bg-hush-card px-4 py-3 transition-opacity ${
        isActive ? 'border-hush-gline' : 'border-hush-gline/40 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-bebas text-[20px] tracking-[0.08em] text-hush-white">
              {keyword}
            </span>
            <span className={`font-bebas text-[10px] uppercase tracking-[0.18em] ${TIER_COLOR[tier]}`}>
              {TIER_LABEL[tier]}
            </span>
          </div>
          <p className="mt-0.5 truncate font-outfit text-[12px] text-hush-muted2">
            {eventTitle} &middot; ${price.toFixed(2)}
          </p>
          <p className="mt-1 font-outfit text-[10px] uppercase tracking-[0.15em] text-hush-muted">
            Used {usedCount} time{usedCount === 1 ? '' : 's'}
          </p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onToggle}
            disabled={pending}
            aria-label={isActive ? 'Disable keyword' : 'Enable keyword'}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
              isActive
                ? 'bg-hush-gdim text-hush-gold hover:bg-hush-gline'
                : 'bg-hush-card2 text-hush-muted hover:text-hush-gold'
            } disabled:opacity-50`}
          >
            <Power size={14} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            aria-label={confirming ? 'Confirm delete' : 'Delete keyword'}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:opacity-50 ${
              confirming
                ? 'bg-[rgba(255,71,87,0.15)] text-hush-red'
                : 'text-hush-muted hover:text-hush-red'
            }`}
          >
            <Trash2 size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      {confirming && !pending && (
        <p className="mt-2 font-outfit text-[10px] text-hush-red">
          Tap delete again to confirm.
        </p>
      )}
      {error && (
        <p className="mt-2 font-outfit text-[11px] text-hush-red">{error}</p>
      )}
    </li>
  );
}
