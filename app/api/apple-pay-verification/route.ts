// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'public', '.well-known', 'apple-developer-merchantid-domain-association');
    const content = readFileSync(filePath, 'utf-8');
    return new Response(content, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch {
    return new Response('Verification file not found', { status: 404 });
  }
}
