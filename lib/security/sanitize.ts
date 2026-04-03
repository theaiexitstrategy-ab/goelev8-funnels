// lib/security/sanitize.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  full_name: z.string().min(1).max(100),
  business_name: z.string().min(1).max(200).optional(),
  plan: z.enum(['launch', 'grow', 'scale']),
  prompt: z.string().max(2000).optional(),
});

export function sanitize(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export const phoneSchema = z.string().regex(/^\+?[\d\s\-().]{7,15}$/);

export const funnelSubmitSchema = z.object({
  funnel_slug: z.string().min(1).max(100),
  full_name: z.string().min(1).max(100),
  phone: z.string().regex(/^\+?[\d\s\-().]{7,15}$/),
  email: z.string().email().max(255).optional(),
  goal: z.string().max(500).optional(),
  source: z.string().max(50).optional(),
});
