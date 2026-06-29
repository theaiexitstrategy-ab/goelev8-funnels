// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// A Family's Future Heating & Cooling × GoElev8.ai sales + scope-of-work
// page. Self-contained, no nav/footer chrome, dark premium theme (black +
// gold #F5B800 + red #C8102E, Bebas Neue display + Inter body). Mirrors
// the same structure and component patterns as /qsetup.

import AffsetupClient from './AffsetupClient';

export const metadata = {
  title: "A Family's Future × GoElev8.ai",
  description:
    "A 24/7 AI voice agent that answers every call, qualifies every customer, and books directly into Jobber — while Kevin's in the field.",
};

export default function AffsetupPage() {
  // ADMIN_PHONE is read server-side so we can render the support number
  // statically. Falls back to a neutral support address if unset.
  const adminPhone = formatPhone(process.env.ADMIN_PHONE ?? process.env.AARON_PHONE ?? '');
  return <AffsetupClient adminPhone={adminPhone} />;
}

function formatPhone(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    const d = digits.slice(1);
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw;
}
