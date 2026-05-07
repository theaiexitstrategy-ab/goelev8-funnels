// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// One-shot: generate Hush PWA icons from a source logo image.
// Run: node scripts/generate-hush-icons.mjs <path-to-source-logo>
// Outputs:
//   public/hush/icons/icon-192.png            (192x192, contain)
//   public/hush/icons/icon-512.png            (512x512, contain)
//   public/hush/icons/icon-512-maskable.png   (512x512, padded for safe-zone)

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

const HUSH_BLACK = { r: 4, g: 4, b: 5, alpha: 1 };
const SRC = process.argv[2];
if (!SRC) {
  console.error('Usage: node scripts/generate-hush-icons.mjs <path-to-source-logo>');
  process.exit(1);
}

const OUT_DIR = path.resolve(process.cwd(), 'public/hush/icons');
await fs.mkdir(OUT_DIR, { recursive: true });

await sharp(SRC)
  .resize(192, 192, { fit: 'contain', background: HUSH_BLACK })
  .png()
  .toFile(path.join(OUT_DIR, 'icon-192.png'));

await sharp(SRC)
  .resize(512, 512, { fit: 'contain', background: HUSH_BLACK })
  .png()
  .toFile(path.join(OUT_DIR, 'icon-512.png'));

// Maskable: PWA spec requires the visible content fit within an 80%-radius
// safe circle. We render the logo at 360px and pad to 512 with the brand
// black so iOS/Android masks never crop the H mark.
await sharp(SRC)
  .resize(360, 360, { fit: 'contain', background: HUSH_BLACK })
  .extend({ top: 76, bottom: 76, left: 76, right: 76, background: HUSH_BLACK })
  .png()
  .toFile(path.join(OUT_DIR, 'icon-512-maskable.png'));

console.log('Hush PWA icons generated in', OUT_DIR);
