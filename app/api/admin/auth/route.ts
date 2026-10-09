import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminSession,
  setAdminSession,
  clearAdminSession,
  validatePassword,
} from "@/lib/admin-auth";

export async function GET() {
  const isAuth = await verifyAdminSession();
  return NextResponse.json({ authenticated: isAuth });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!validatePassword(password)) {
      return NextResponse.json(
        { error: "Invalid admin passphrase" },
        { status: 401 }
      );
    }

    await setAdminSession();
    return NextResponse.json({ success: true, message: "Authenticated successfully" });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to authenticate" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  await clearAdminSession();
  return NextResponse.json({ success: true, message: "Logged out" });
}
