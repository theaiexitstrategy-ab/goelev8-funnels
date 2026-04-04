// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

export const metadata = {
  title: 'GoElev8.ai',
  description: 'AI-powered lead capture funnels',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
