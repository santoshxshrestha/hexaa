import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as unknown;
  if (
    !isRecord(body) ||
    typeof body.userId !== "string" ||
    typeof body.follow !== "boolean"
  ) {
    return NextResponse.json(
      { ok: false, error: "Invalid body" },
      { status: 400 },
    );
  }

  if (body.userId === session.user.id) {
    return NextResponse.json(
      { ok: false, error: "You cannot follow yourself." },
      { status: 400 },
    );
  }

  try {
    if (body.follow) {
      await prisma.follow.upsert({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: body.userId,
          },
        },
        create: {
          followerId: session.user.id,
          followingId: body.userId,
        },
        update: {},
        select: { id: true },
      });
    } else {
      await prisma.follow.deleteMany({
        where: {
          followerId: session.user.id,
          followingId: body.userId,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to update follow." },
      { status: 500 },
    );
  }
}
