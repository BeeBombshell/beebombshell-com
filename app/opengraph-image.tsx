import { ImageResponse } from "next/og";


export const alt = "BeeBombshell · Bhavya Verma - Product Engineer & Builder";
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
          <div style={{ display: "flex", gap: "16px" }}>
            <span style={{ color: "#eeece6" }}>№ 001</span>
            <span>FIG 0.1 · CORE SPECIMEN</span>
          </div>
          <span>BEEBOMBSHELL.COM</span>
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
            }}
          >
            product engineer, developer experience
          </div>
          <div
            style={{
              fontSize: "72px",
              fontWeight: 400,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              color: "#eeece6",
            }}
          >
            Bhavya Verma
          </div>
          <div
            style={{
              fontSize: "30px",
              letterSpacing: "-0.02em",
              color: "#a2a19b",
              lineHeight: 1.25,
            }}
          >
            Shipping features and memes in equal measure.
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
            <span>CANVAS 2D PHYSICS</span>
            <span>SPRING DYNAMICS</span>
            <span>LLMS.TXT ENABLED</span>
          </div>
          <span>LAT: 28.6139° N</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
