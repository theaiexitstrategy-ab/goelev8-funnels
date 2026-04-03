// app/api/auth/csrf/route.ts
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { setCSRFCookie } from '@/lib/security/csrf';
import { publicArcjet, applyRateLimit } from '@/lib/security/rate-limit';

export async function GET(req: Request) {
  const limited = await applyRateLimit(publicArcjet, req);
  if (limited) return limited;

  const token = setCSRFCookie();
  return Response.json({ token });
}
