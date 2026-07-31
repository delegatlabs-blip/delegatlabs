import { NextResponse } from "next/server";

import { listAgents } from "@/server/agents/repository";

function parseNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const page = parseNumber(params.get("page"));
  const pageSize = parseNumber(params.get("pageSize"));
  if (params.get("page") !== null && page === undefined) {
    return NextResponse.json({ message: "`page` must be a number." }, { status: 400 });
  }
  if (params.get("pageSize") !== null && pageSize === undefined) {
    return NextResponse.json({ message: "`pageSize` must be a number." }, { status: 400 });
  }

  const featuredParam = params.get("featured");

  const result = await listAgents({
    page,
    pageSize,
    q: params.get("q") ?? undefined,
    featured: featuredParam === null ? undefined : featuredParam === "true",
  });

  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
