import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { savePost, deletePost } from "@/lib/admin-store";

export async function POST(request: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const saved = await savePost(body);
    return NextResponse.json({ success: true, post: saved });
  } catch (err: unknown) {
    console.error("Save post error:", err);
    const message = err instanceof Error ? err.message : "Invalid post data";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    await deletePost(slug);
    return NextResponse.json({ success: true, slug });
  } catch (err) {
    console.error("Delete post error:", err);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
