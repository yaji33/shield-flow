import { NextRequest, NextResponse } from "next/server";

const upstreamRpc =
  process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL ??
  "https://ethereum-sepolia-rpc.publicnode.com";

export async function POST(request: NextRequest) {
  const body = await request.text();

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
