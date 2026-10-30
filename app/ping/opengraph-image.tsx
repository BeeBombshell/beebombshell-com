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
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ color: "#eeece6" }}>№ 002</span>
            <span>FIG 0.2 · {COPY.ping.eyebrow}</span>
          </div>
          <span>BEEBOMBSHELL.COM/PING</span>
        </div>

        {/* Center Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: "16px",
              fontFamily: "monospace",
              letterSpacing: "0.15em",
              color: "#a2a19b",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#ff8ad1",
              }}
            />
            <span>ZERO LOGS · ZERO PERSONAL DATA</span>
          </div>

          <div
            style={{
              fontSize: "68px",
              fontWeight: 400,
              letterSpacing: "-0.04em",
              lineHeight: 1.06,
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
              fontSize: "26px",
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
            <span>NO IP STORED</span>
            <span>NO FINGERPRINT</span>
            <span>ANONYMOUS RECEIPT</span>
          </div>
          <span>POWERED BY WHODUNIT</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
