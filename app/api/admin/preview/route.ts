import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { renderMarkdown } from "@/lib/markdown";

export async function POST(request: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { markdown } = await request.json();
    if (typeof markdown !== "string") {
      return NextResponse.json({ error: "Markdown string is required" }, { status: 400 });
    }

    const result = await renderMarkdown(markdown);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Preview render error:", err);
    return NextResponse.json(
      { error: "Failed to render preview" },
      { status: 500 }
    );
  }
}
