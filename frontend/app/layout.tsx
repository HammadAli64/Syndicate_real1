import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Syndicate Auth",
  description: "Login and signup experience cloned in Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
