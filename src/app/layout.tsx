import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Header, Footer } from "@/components/layout";
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

import Script from "next/script";

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
          <Header />
          <main className="flex-1 pt-16 lg:pt-20">
            {children}
          </main>
          <Footer />
        </Providers>
        <Script
          src="https://www.payhere.lk/lib/payhere.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
