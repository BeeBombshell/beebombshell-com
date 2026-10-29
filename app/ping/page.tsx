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
  },
  twitter: {
    card: "summary_large_image",
    title: "Anonymous Ping · Bhavya Verma",
    description:
      "Send me a ping. I won't know it was you. Zero logs, zero personal data stored.",
  },
};

export default function PingPage() {
  return <PingPageContent />;
}
