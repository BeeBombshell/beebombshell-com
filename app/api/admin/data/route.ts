import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { getAllAdminData } from "@/lib/admin-store";

export async function GET() {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getAllAdminData();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to fetch admin data:", err);
    return NextResponse.json(
      { error: "Failed to fetch admin data" },
      { status: 500 }
    );
  }
}
