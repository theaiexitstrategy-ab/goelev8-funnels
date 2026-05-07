// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Tailwind is scoped to the Hush PWA only. Existing GoElev8.ai pages use
// CSS Modules and are untouched. The generated stylesheet is imported
// solely from app/hush/app/layout.tsx, so utilities never bleed into
// other route groups.
//
// Color, font, animation, and gradient values mirror the canonical Hush
// reference files in reference/hush/. See memory/reference_hush_tokens.md
// for the source-of-truth catalog.

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/hush/app/**/*.{ts,tsx}',
    './components/hush/**/*.{ts,tsx}',
    './lib/hush/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'hush-black': '#040405',
        'hush-deep': '#07070a',
        'hush-card': '#0d0d11',
        'hush-card2': '#121216',
        'hush-gold': '#C9A84C',
        'hush-gold2': '#e8c96a',
        'hush-gold3': '#a8862e',
        'hush-gold4': '#f5d98a',
        'hush-gdim': 'rgba(201,168,76,0.12)',
        'hush-gline': 'rgba(201,168,76,0.2)',
        'hush-gglow': 'rgba(201,168,76,0.06)',
        'hush-white': '#f5f0e8',
        'hush-muted': 'rgba(245,240,232,0.35)',
        'hush-muted2': 'rgba(245,240,232,0.6)',
        'hush-green': '#00e89a',
        'hush-red': '#ff4757',
        'hush-cyan': '#00d4ff',
        'hush-purple': '#a29bfe',
        'hush-live': '#ff4757',
        'hush-credit': '#FFB347',
        'hush-credit2': '#FF8C00',
        'hush-tip': '#FFD700',
        'hush-of': '#00AFF0',
        'hush-ig': '#e1306c',
        'hush-tt': '#010101',
        'hush-snap': '#FFFC00',
        'hush-posh': '#FF6B6B',
        'hush-eb': '#F05537',
      },
      fontFamily: {
        bebas: ['Bebas Neue', 'sans-serif'],
        cormorant: ['Cormorant Garamond', 'serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      backgroundImage: {
        'hush-gold-gradient': 'linear-gradient(135deg, #a8862e 0%, #e8c96a 50%, #C9A84C 100%)',
        'hush-gold-text': 'linear-gradient(135deg, #a8862e, #f5d98a)',
        'hush-gold-text-mid': 'linear-gradient(135deg, #a8862e, #e8c96a)',
        'hush-gold-btn': 'linear-gradient(135deg, #a8862e, #C9A84C)',
        'hush-gold-logo': 'linear-gradient(160deg, #a8862e 0%, #f5d98a 40%, #C9A84C 70%, #a8862e 100%)',
        'hush-credits-gradient': 'linear-gradient(135deg, #FF8C00, #FFB347)',
        'hush-live-gradient': 'linear-gradient(135deg, #ff4757, #ff6b6b)',
        'hush-purple-gradient': 'linear-gradient(135deg, rgba(162,155,254,0.7), rgba(162,155,254,0.5))',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        livePulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,71,87,0.4)' },
          '70%': { boxShadow: '0 0 0 10px rgba(255,71,87,0)' },
        },
        creditPulse: {
          '0%, 100%': { filter: 'drop-shadow(0 0 12px rgba(255,179,71,0.4))' },
          '50%': { filter: 'drop-shadow(0 0 28px rgba(255,179,71,0.7))' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.7' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        countUp: {
          from: { opacity: '0', transform: 'scale(0.8)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        boost: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.04)' },
        },
        glowPulse: {
          '0%, 100%': { transform: 'translate(-50%,-50%) scale(1)', opacity: '0.5' },
          '50%': { transform: 'translate(-50%,-50%) scale(1.2)', opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.8s ease both',
        'fade-up-fast': 'fadeUp 0.5s ease both',
        blink: 'blink 1.4s ease-in-out infinite',
        'live-pulse': 'livePulse 2s ease-in-out infinite',
        'credit-pulse': 'creditPulse 3s ease-in-out infinite',
        shimmer: 'shimmer 2.4s ease-in-out infinite',
        float: 'float 4s ease-in-out infinite',
        'count-up': 'countUp 0.6s ease both',
        boost: 'boost 0.5s ease',
        'glow-pulse': 'glowPulse 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
