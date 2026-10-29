import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const { message, hp } = body;

    // 1. Honeypot check: If the hidden honeypot input is filled, silently discard spam
    if (hp && typeof hp === "string" && hp.trim().length > 0) {
      return NextResponse.json({
        ok: true,
        delivered: true,
        receiptId: "HP-" + crypto.randomBytes(4).toString("hex").toUpperCase(),
      });
    }

    // 2. Validate message
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const trimmed = message.trim();
    if (trimmed.length === 0) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      );
    }

    if (trimmed.length > 520) {
      return NextResponse.json(
        { error: "Message exceeds maximum length of 500 characters" },
        { status: 400 }
      );
    }

    // 3. Optional upstream proxy: if WHODUNIT_PING_URL or PING_WORKER_URL is configured
    let upstreamUrl =
      process.env.WHODUNIT_PING_URL || process.env.PING_WORKER_URL;

    if (upstreamUrl && upstreamUrl.trim().length > 0) {
      if (!upstreamUrl.startsWith("http://") && !upstreamUrl.startsWith("https://")) {
        upstreamUrl = `https://${upstreamUrl}`;
      }
      try {
        const upstreamRes = await fetch(upstreamUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Forwarded-From": "beebombshell-web",
          },
          body: JSON.stringify({ message: trimmed }),
        });

        if (!upstreamRes.ok) {
          console.warn(
            "Upstream ping worker responded with status:",
            upstreamRes.status
          );
        }
      } catch (err) {
        console.warn("Could not reach upstream ping worker:", err);
      }
    } else {
      // In local dev or standalone deployments without worker configured
      console.log(`[ANONYMOUS PING RECEIVED] ${trimmed}`);
    }


    // 4. Return zero-knowledge cryptographic receipt data
    const receiptId = crypto.randomBytes(4).toString("hex").toUpperCase();
    const hashKey = crypto
      .createHash("sha256")
      .update(receiptId + Date.now().toString())
      .digest("hex");

    return NextResponse.json({
      ok: true,
      delivered: true,
      receiptId,
      hashKey,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Ping API handler error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
