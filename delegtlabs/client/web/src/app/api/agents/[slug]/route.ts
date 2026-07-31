import { NextResponse } from "next/server";

import { getAgentBySlug } from "@/server/agents/repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);

  if (!agent) {
    return NextResponse.json({ message: "Agent not found." }, { status: 404 });
  }

  return NextResponse.json(agent, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
