import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { REVALIDATE_TAGS, type RevalidateTag } from "@/lib/revalidate";

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let secret = searchParams.get("secret");
    let tag = searchParams.get("tag");
    let path = searchParams.get("path");

    // Also check JSON body if not provided in URL query
    if (!secret || (!tag && !path)) {
      try {
        const body = await request.json();
        secret = secret || body?.secret;
        tag = tag || body?.tag;
        path = path || body?.path;
      } catch {
        // Body may be empty or not JSON, ignore parse error
      }
    }

    const expectedSecret =
      process.env.REVALIDATION_SECRET ||
      process.env.REVALIDATE_SECRET ||
      process.env.ADMIN_SECRET;

    // Validate secret
    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing revalidation secret" },
        { status: 401 }
      );
    }

    const revalidatedTags: string[] = [];

    if (tag) {
      if (tag === "all") {
        for (const t of Object.values(REVALIDATE_TAGS)) {
          revalidateTag(t, "max");
          revalidatedTags.push(t);
        }
      } else if (Object.values(REVALIDATE_TAGS).includes(tag as RevalidateTag)) {
        revalidateTag(tag, "max");
        revalidatedTags.push(tag);
      } else {
        return NextResponse.json(
          {
            error: `Invalid tag: ${tag}. Allowed tags: ${Object.values(REVALIDATE_TAGS).join(", ")}, all`,
          },
          { status: 400 }
        );
      }
    }

    if (path) {
      revalidatePath(path);
    }

    // Default revalidate all if neither tag nor path was specified
    if (!tag && !path) {
      for (const t of Object.values(REVALIDATE_TAGS)) {
        revalidateTag(t, "max");
        revalidatedTags.push(t);
      }
      revalidatePath("/");
    }

    return NextResponse.json({
      revalidated: true,
      tags: revalidatedTags,
      path: path ?? null,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { error: "Failed to revalidate cache" },
      { status: 500 }
    );
  }
}
