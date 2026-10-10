import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { SmoothScroll } from "@/components/scroll/smooth-scroll";
import { NotchNav } from "@/components/notch/notch-nav";
import { ParticleCanvas } from "@/components/particles/particle-canvas";
import { LlmsModal } from "@/components/llms/llms-modal";
import { JsonLd } from "@/components/seo/json-ld";
import { getConfig, getProfile } from "@/lib/queries";
import { COPY } from "@/lib/copy";
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
    "Bhavya Verma is a product engineer focused on developer experience. Dev tools, open source, writing, and views nobody asked for.",
  keywords: [
    "Bhavya Verma",
    "BeeBombshell",
    "Product Engineer",
    "Developer Experience",
    "DX",
    "Frontend Physics",
    "Verlet Integration",
    "Canvas 2D",
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
    title: "Bhavya Verma · I make dev tools feel like someone cared",
    description: "Product engineer, developer experience. Open source, writing, and a lanyard that swings.",
    siteName: "BeeBombshell",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bhavya Verma · I make dev tools feel like someone cared",
    description: "Product engineer, developer experience. Open source, writing, and a lanyard that swings.",
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
    description:
      "Product engineer focused on developer experience, open source contributor and mentor.",
    sameAs: profile.socials.map((s) => s.url),
    knowsAbout: [
      "Product Engineering",
      "Developer Experience",
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
        {/* Skip to content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--fg)] focus:text-[var(--bg)] focus:rounded-md focus:font-mono focus:text-xs"
        >
          Skip to content
        </a>

        {/* DevTools HTML comment easter egg */}
        <div
          dangerouslySetInnerHTML={{
            __html: `<!-- ${COPY.egg.htmlComment} -->`,
          }}
        />

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
              enableSpotify={config.featureFlags?.spotifyNowPlaying !== false}
            />

            {/* Main page content area */}
            <main id="main-content" className="pt-14 sm:pt-16 min-h-screen flex flex-col relative z-10">
              {children}
            </main>
          </SmoothScroll>

          {/* Global Styled Plain-Text LLMS.TXT Modal */}
          <LlmsModal />
        </ThemeProvider>
      </body>
    </html>
  );
}

