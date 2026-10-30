import { ImageResponse } from "next/og";
import { COPY } from "@/lib/copy";

export const alt = "Anonymous Ping · Bhavya Verma";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0d0d0c",
          color: "#eeece6",
          padding: "64px 80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          border: "1px solid rgba(255, 255, 255, 0.14)",
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255, 255, 255, 0.18)",
            paddingBottom: "20px",
            fontSize: "14px",
            letterSpacing: "0.14em",
            color: "#a2a19b",
            fontFamily: "monospace",
          }}
        >
          <span style={{ color: "#eeece6", fontWeight: 600 }}>BEEBOMBSHELL</span>
          <span>BEEBOMBSHELL.COM/PING</span>
        </div>

        {/* Center Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: "72px",
              fontWeight: 400,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              color: "#eeece6",
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            <span>{COPY.ping.headlineLead}</span>
            <span style={{ color: "#ff8ad1", fontStyle: "italic" }}>
              {COPY.ping.headlineAccent}
            </span>
          </div>

          <div
            style={{
              fontSize: "28px",
              letterSpacing: "-0.02em",
              color: "#a2a19b",
              lineHeight: 1.35,
              maxWidth: "960px",
            }}
          >
            {COPY.ping.explainer}
          </div>
        </div>

        {/* Bottom Specs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255, 255, 255, 0.18)",
            paddingTop: "20px",
            fontSize: "14px",
            fontFamily: "monospace",
            color: "#a2a19b",
          }}
        >
          <div style={{ display: "flex", gap: "24px" }}>
            <span>ZERO IP STORED</span>
            <span>NO FINGERPRINT</span>
            <span>ANONYMOUS RECEIPT</span>
          </div>
          <span>BHAVYA VERMA</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
