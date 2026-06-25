// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Outermost layout for the entire /onboard/* tree. The only thing this
// does is import the Tailwind stylesheet — Tailwind utilities are
// scoped to this route group so the existing CSS-Module homepage isn't
// affected by Tailwind's preflight reset.

import './styles/globals.css';

export default function OnboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
