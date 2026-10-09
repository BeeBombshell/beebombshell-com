import { ImageResponse } from "next/og";
import { getPost } from "@/lib/queries";
import { calculateReadingTime } from "@/lib/reading-time";

export const alt = "BeeBombshell Article";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  const title = post?.title || "Writing · BeeBombshell";
  const excerpt = post?.excerpt || "Essays and technical notes by Bhavya Verma.";
  const publishedDate = post
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";
  const readingTime = post ? calculateReadingTime(post.body).text : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: "#09090b",
          color: "#ededef",
          fontFamily: "system-ui, -apple-system, sans-serif",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          position: "relative",
        }}
      >
        {/* Subtle grid accent background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.05) 2%, transparent 0%)",
            backgroundSize: "36px 36px",
            opacity: 0.6,
          }}
        />

        {/* Top Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
            paddingBottom: "24px",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontFamily: "monospace",
              fontSize: "16px",
              letterSpacing: "0.15em",
              color: "rgba(237, 237, 239, 0.6)",
              textTransform: "uppercase",
            }}
          >
            <span>BEEBOMBSHELL</span>
            <span>·</span>
            <span>DISPATCH</span>
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "14px",
              color: "rgba(237, 237, 239, 0.4)",
              letterSpacing: "0.1em",
            }}
          >
            SPEC·003
          </div>
        </div>

        {/* Middle: Title & Excerpt */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            zIndex: 1,
            maxWidth: "1000px",
          }}
        >
          <div
            style={{
              fontSize: "52px",
              fontWeight: 500,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              color: "#ffffff",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "24px",
              lineHeight: 1.4,
              color: "rgba(237, 237, 239, 0.65)",
            }}
          >
            {excerpt}
          </div>
        </div>

        {/* Bottom Footer: Author & Metadata */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255, 255, 255, 0.12)",
            paddingTop: "24px",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "#ffffff",
                color: "#09090b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "18px",
                fontFamily: "monospace",
              }}
            >
              B
            </div>
            <div
              style={{
                fontSize: "20px",
                color: "#ffffff",
                fontWeight: 500,
              }}
            >
              Bhavya Verma
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              fontFamily: "monospace",
              fontSize: "15px",
              color: "rgba(237, 237, 239, 0.55)",
            }}
          >
            {publishedDate && <span>{publishedDate}</span>}
            {readingTime && <span>·</span>}
            {readingTime && <span>{readingTime}</span>}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
