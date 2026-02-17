import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const res = await fetch(
      `${BACKEND_URL}/v1/documents/${encodeURIComponent(params.filename)}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { detail: "Backend unreachable" },
      { status: 502 }
    );
  }
}
