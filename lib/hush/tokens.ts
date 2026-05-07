// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Hush design tokens. Mirrors tailwind.config.ts color/font keys — use
// these constants when raw values are needed (e.g. inline canvas/SVG fills,
// QR code colors, dynamic gradient strings).

export const HUSH_TOKENS = {
  colors: {
    black: '#040405',
    deep: '#07070a',
    card: '#0d0d11',
    card2: '#121216',
    gold: '#C9A84C',
    gold2: '#e8c96a',
    gold3: '#a8862e',
    gold4: '#f5d98a',
    white: '#f5f0e8',
    muted: 'rgba(245,240,232,0.35)',
    muted2: 'rgba(245,240,232,0.6)',
    green: '#00e89a',
    red: '#ff4757',
    cyan: '#00d4ff',
    purple: '#a29bfe',
    live: '#ff4757',
    credit: '#FFB347',
    tip: '#FFD700',
    gdim: 'rgba(201,168,76,0.12)',
    gline: 'rgba(201,168,76,0.2)',
    of: '#00AFF0',
  },
  fonts: {
    display: "'Bebas Neue', sans-serif",
    serif: "'Cormorant Garamond', serif",
    body: "'Outfit', sans-serif",
  },
  gradients: {
    gold: 'linear-gradient(135deg, #a8862e 0%, #e8c96a 50%, #C9A84C 100%)',
    goldText: 'linear-gradient(135deg, #a8862e, #f5d98a)',
    live: 'linear-gradient(135deg, #ff4757, #ff6b6b)',
    purple: 'linear-gradient(135deg, #a29bfe, #c4b5fd)',
  },
} as const;
