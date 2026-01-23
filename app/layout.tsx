import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
    <title>Guess The Splash</title>
    <body>{children}</body>

    </html>
  );
}