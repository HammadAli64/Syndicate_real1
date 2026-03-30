import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "The Syndicate — Dashboard",
  description: "Gold HUD cyber dashboard (Tailwind + GSAP)."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${jetbrainsMono.variable} min-h-screen bg-black text-white antialiased`}>{children}</body>
    </html>
  );
}

