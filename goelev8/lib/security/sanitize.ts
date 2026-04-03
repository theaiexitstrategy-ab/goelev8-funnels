// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

export const sanitize = (s: string) =>
  DOMPurify.sanitize(s.trim(), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).slice(0, 2000);

export const slugSchema = z.string().min(3).max(50).regex(/^[a-z0-9-]+$/);
export const phoneSchema = z.string().regex(/^\+?[\d\s\-().]{7,15}$/);
export const emailSchema = z.string().email().max(254);

export const funnelSubmitSchema = z.object({
  funnel_slug: slugSchema,
  full_name:   z.string().min(1).max(100).transform(sanitize),
  phone:       phoneSchema,
  email:       emailSchema.optional(),
  goal:        z.string().max(500).transform(sanitize).optional(),
  source:      z.enum(['funnel','chat_widget','site_connect','demo']).default('funnel'),
});

export const signupSchema = z.object({
  email:         emailSchema,
  password:      z.string().min(12).max(128),
  full_name:     z.string().min(1).max(100).transform(sanitize),
  business_name: z.string().min(1).max(200).transform(sanitize),
  plan:          z.enum(['launch','grow','scale']),
  prompt:        z.string().max(2000).transform(sanitize).optional(),
  funnel_slug:   slugSchema.optional(),
});
