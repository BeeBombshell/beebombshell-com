import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { SmoothScroll } from "@/components/scroll/smooth-scroll";
import { NotchNav } from "@/components/notch/notch-nav";
import { ParticleCanvas } from "@/components/particles/particle-canvas";
import { getConfig, getProfile } from "@/lib/queries";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BeeBombshell · Bhavya Verma",
  description: "Shipping features and memes in equal measure.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [config, profile] = await Promise.all([getConfig(), getProfile()]);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen bg-[var(--bg)] text-[var(--fg)] font-sans antialiased selection:bg-[var(--fg)] selection:text-[var(--bg)]">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          {/* Fixed particle canvas — behind everything (z-index: 0) */}
          <ParticleCanvas />

          {/* Smooth Momentum Scroll with Lenis */}
          <SmoothScroll>
            {/* Top-docked Notch Navigation */}
            <NotchNav
              bookingUrl={config.bookingUrl}
              statusText={profile.statusText}
            />

            {/* Main page content area */}
            <div className="pt-14 sm:pt-16 min-h-screen flex flex-col relative z-10">
              {children}
            </div>
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
