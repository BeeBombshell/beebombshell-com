import type { Metadata } from "next";
import { PingPageContent } from "@/components/ping/ping-page-content";

export const metadata: Metadata = {
  title: "Ping · Anonymous Message",
  description:
    "Send an anonymous message, question, confession, or feedback to Bhavya Verma. Zero IP or personal data stored.",
  alternates: {
    canonical: "/ping",
  },
  openGraph: {
    title: "Anonymous Ping · Bhavya Verma",
    description:
      "Send me a ping. I won't know it was you. Zero logs, zero personal data stored.",
    url: "https://beebombshell.com/ping",
    siteName: "BeeBombshell",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://beebombshell.com/og-ping.png",
        width: 1200,
        height: 630,
        alt: "Anonymous Ping · Bhavya Verma",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Anonymous Ping · Bhavya Verma",
    description:
      "Send me a ping. I won't know it was you. Zero logs, zero personal data stored.",
    creator: "@beebombshell",
    site: "@beebombshell",
    images: ["https://beebombshell.com/og-ping.png"],
  },
};

export default function PingPage() {
  return <PingPageContent />;
}
