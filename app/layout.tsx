import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { SmoothScroll } from "@/components/scroll/smooth-scroll";
import { NotchNav } from "@/components/notch/notch-nav";
import { ParticleCanvas } from "@/components/particles/particle-canvas";
import { LlmsModal } from "@/components/llms/llms-modal";
import { JsonLd } from "@/components/seo/json-ld";
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
  metadataBase: new URL("https://beebombshell.com"),
  title: {
    default: "BeeBombshell · Bhavya Verma",
    template: "%s · BeeBombshell",
  },
  description:
    "Product engineer & builder crafting visceral interfaces, distributed systems, and creative computation. Shipping features and memes in equal measure.",
  keywords: [
    "Bhavya Verma",
    "BeeBombshell",
    "Product Engineer",
    "Full-Stack Engineer",
    "Frontend Physics",
    "Verlet Integration",
    "Canvas 2D",
    "Creative Technologist",
    "Next.js",
    "TypeScript",
  ],
  authors: [{ name: "Bhavya Verma", url: "https://beebombshell.com" }],
  creator: "Bhavya Verma",
  alternates: {
    canonical: "https://beebombshell.com",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://beebombshell.com",
    title: "BeeBombshell · Bhavya Verma",
    description: "Shipping features and memes in equal measure.",
    siteName: "BeeBombshell",
  },
  twitter: {
    card: "summary_large_image",
    title: "BeeBombshell · Bhavya Verma",
    description: "Shipping features and memes in equal measure.",
    creator: "@beebombshell",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [config, profile] = await Promise.all([getConfig(), getProfile()]);

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.role,
    url: "https://beebombshell.com",
    description: profile.bio,
    address: {
      "@type": "PostalAddress",
      addressCountry: profile.location,
    },
    sameAs: profile.socials.map((s) => s.url),
    knowsAbout: [
      "Product Engineering",
      "Interactive Canvas Physics",
      "Spring Dynamics",
      "Distributed Systems",
      "TypeScript",
      "Next.js",
    ],
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BeeBombshell",
    url: "https://beebombshell.com",
    description: "Personal specimen & portfolio of Bhavya Verma.",
    author: {
      "@type": "Person",
      name: profile.name,
    },
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <JsonLd data={personJsonLd} />
        <JsonLd data={websiteJsonLd} />
      </head>
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

          {/* Global Styled Plain-Text LLMS.TXT Modal */}
          <LlmsModal />
        </ThemeProvider>
      </body>
    </html>
  );
}
