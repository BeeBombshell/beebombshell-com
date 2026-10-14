import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { saveConfig } from "@/lib/admin-store";

export async function POST(request: NextRequest) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const saved = await saveConfig(body);
    return NextResponse.json({ success: true, config: saved });
  } catch (err: unknown) {
    console.error("Save config error:", err);
    const message = err instanceof Error ? err.message : "Invalid config data";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
