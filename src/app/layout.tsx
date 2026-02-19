import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { ConditionalShell } from "@/components/layout/conditional-shell";
import Script from "next/script";
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
  title: "MediPharm B2B - Healthcare E-Commerce Platform",
  description: "Your trusted B2B partner for quality medicines and healthcare products. Serving doctors, clinics, and healthcare facilities.",
  keywords: ["medicine", "healthcare", "B2B", "wholesale", "pharmacy", "doctors"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <Providers>
          <ConditionalShell>
            {children}
          </ConditionalShell>
        </Providers>
        <Script
          src="https://sandbox.payhere.lk/lib/payhere.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
