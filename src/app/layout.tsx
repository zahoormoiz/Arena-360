import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./globals.css";
import BottomNav from '@/components/BottomNav';
import BackgroundPattern from '@/components/BackgroundPattern';
import ConditionalShell from '@/components/ConditionalShell';
import { BookingProvider } from "@/context/BookingContext";
import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/Header';
import { Analytics } from '@vercel/analytics/react';

// OPTIMIZED: Reduced font weights for faster loading
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["600", "800"], // Only bold weights for headings
  display: "swap", // Prevent invisible text during load
  preload: true,
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "600"], // Only essential weights for body
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Arena360 | Premium Indoor Sports Arena",
  description: "Lahore's Premier Indoor Arena for Cricket, Futsal, Padel, Badminton & Volleyball. Book your slot 24/7.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Prevents auto-zoom on inputs
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${outfit.variable} ${jakarta.variable} antialiased min-h-screen font-sans bg-background text-foreground selection:bg-primary/30 pb-24 relative`}>
        <BackgroundPattern />
        <AuthProvider>
          <BookingProvider>
            <ConditionalShell><Header /></ConditionalShell>
            {children}
            <ConditionalShell><BottomNav /></ConditionalShell>
          </BookingProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
