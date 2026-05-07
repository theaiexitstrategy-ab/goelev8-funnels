// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// PostCSS runs project-wide, but Tailwind only emits utilities for files
// matching tailwind.config.ts content paths (Hush PWA only). Existing
// CSS Modules pages are unaffected.

export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
