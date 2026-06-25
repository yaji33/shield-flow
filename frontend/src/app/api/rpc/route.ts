import { NextRequest, NextResponse } from "next/server";

function getUpstreamRpc(): string {
  const raw =
    process.env.ALCHEMY_RPC_URL ??
    process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL ??
    "https://ethereum-sepolia-rpc.publicnode.com";

  const url = raw.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    throw new Error(
      "RPC URL must be a full HTTPS URL (e.g. https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY)",
    );
  }
  return url;
}

export async function POST(request: NextRequest) {
  const body = await request.text();

  let upstreamRpc: string;
  try {
    upstreamRpc = getUpstreamRpc();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid RPC configuration";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const upstream = await fetch(upstreamRpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    cache: "no-store",
  });

  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
