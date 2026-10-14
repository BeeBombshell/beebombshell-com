import { NextResponse } from "next/server";
import fallbackData from "@/content/seed/github-contributions.json";

export async function GET() {
  try {
    const res = await fetch(
      "https://github-contributions-api.jogruber.de/v4/BeeBombshell",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) {
      return NextResponse.json(fallbackData);
    }
    const json = await res.json();
    const sorted = (json.contributions || [])
      .slice()
      .sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date));
    
    // Last 308 items (44 weeks)
    const recent = sorted.slice(-308);
    if (recent.length < 308) {
      return NextResponse.json(fallbackData);
    }

    const weeks: { date: string; count: number; level: number }[][] = [];
    for (let c = 0; c < 44; c++) {
      const col = [];
      for (let r = 0; r < 7; r++) {
        const item = recent[c * 7 + r];
        col.push({
          date: item.date,
          count: item.count,
          level: item.level,
        });
      }
      weeks.push(col);
    }

    const total = recent.reduce((sum: number, x: { count: number }) => sum + x.count, 0);

    return NextResponse.json({
      username: "BeeBombshell",
      totalContributions: total,
      startDate: recent[0].date,
      endDate: recent[recent.length - 1].date,
      weeks,
    });
  } catch {
    return NextResponse.json(fallbackData);
  }
}
