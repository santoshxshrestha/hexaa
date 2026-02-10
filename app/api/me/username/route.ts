import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as unknown;
  if (!isRecord(body) || typeof body.username !== "string") {
    return NextResponse.json(
      { ok: false, error: "Invalid body" },
      { status: 400 },
    );
  }

  const username = normalizeUsername(body.username);
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return NextResponse.json(
      { ok: false, error: "Username must be 3-20 chars (a-z, 0-9, _)." },
      { status: 400 },
    );
  }

  try {
    const existing = await prisma.user.findFirst({
      where: { username },
      select: { id: true },
    });
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json(
        { ok: false, error: "Username already taken." },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { username },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, username });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to set username." },
      { status: 500 },
    );
  }
}
