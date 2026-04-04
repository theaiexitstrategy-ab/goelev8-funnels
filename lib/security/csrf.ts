// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

export function validateCSRF(req: Request): void {
  const origin = req.headers.get('origin');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (appUrl && origin && !origin.startsWith(appUrl)) {
    throw new Error('CSRF validation failed');
  }
}
