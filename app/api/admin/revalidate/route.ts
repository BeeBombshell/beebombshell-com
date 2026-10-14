import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { triggerAllRevalidations } from "@/lib/admin-store";

export async function POST() {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await triggerAllRevalidations();
    return NextResponse.json({
      success: true,
      message: "Purged and revalidated all caches across posts, projects, config, and pages.",
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("Revalidation error:", err);
    return NextResponse.json(
      { error: "Failed to trigger revalidations" },
      { status: 500 }
    );
  }
}
