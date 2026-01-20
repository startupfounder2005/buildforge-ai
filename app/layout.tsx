import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Obsidian Enterprise",
  description: "Advanced AI Construction Management",
  icons: {
    icon: "/obsidian-logo.png",
    shortcut: "/obsidian-logo.png",
    apple: "/obsidian-logo.png",
  },
};

import { CursorFixer } from "@/components/ui/cursor-fixer";
import { InactivityListener } from "@/components/auth/InactivityListener";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CursorFixer />
        <InactivityListener />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
