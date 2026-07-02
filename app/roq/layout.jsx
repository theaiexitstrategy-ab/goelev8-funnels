// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Server-component layout for /roq. Owns the metadata export because
// page.jsx is a client component ("use client" and metadata are mutually
// exclusive in the same file).

export const metadata = {
  title: 'ROQ Body Academy | St. Louis Fitness',
  description:
    "STL's premier fitness ecosystem. Personal training, online programs, supplements, apparel, and custom meal prep — all under one brand.",
};

export default function RoqLayout({ children }) {
  return children;
}
