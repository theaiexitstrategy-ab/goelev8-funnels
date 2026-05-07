// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Tailwind is scoped to the Hush PWA only. Existing GoElev8.ai pages use
// CSS Modules and are untouched. The generated stylesheet is imported
// solely from app/hush/app/layout.tsx, so utilities never bleed into
// other route groups.

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
        'hush-white': '#f5f0e8',
        'hush-muted': 'rgba(245,240,232,0.35)',
        'hush-muted2': 'rgba(245,240,232,0.6)',
        'hush-green': '#00e89a',
        'hush-red': '#ff4757',
        'hush-cyan': '#00d4ff',
        'hush-purple': '#a29bfe',
        'hush-live': '#ff4757',
        'hush-credit': '#FFB347',
        'hush-tip': '#FFD700',
        'hush-of': '#00AFF0',
      },
      fontFamily: {
        bebas: ['Bebas Neue', 'sans-serif'],
        cormorant: ['Cormorant Garamond', 'serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      backgroundImage: {
        'hush-gold-gradient': 'linear-gradient(135deg, #a8862e 0%, #e8c96a 50%, #C9A84C 100%)',
        'hush-gold-text': 'linear-gradient(135deg, #a8862e, #f5d98a)',
        'hush-live-gradient': 'linear-gradient(135deg, #ff4757, #ff6b6b)',
        'hush-purple-gradient': 'linear-gradient(135deg, #a29bfe, #c4b5fd)',
      },
    },
  },
  plugins: [],
};

export default config;
