import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

type PostRow = {
  id: string;
  title: string;
  content: string;
  imageDataUrl: string | null;
  createdAt: Date;
  author: {
    id: string;
    username: string | null;
    name: string | null;
    image: string | null;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

export async function GET() {
  const posts = (await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      content: true,
      imageDataUrl: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
        },
      },
    },
  })) as unknown as PostRow[];

  return NextResponse.json({
    posts: posts.map((p) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      imageDataUrl: p.imageDataUrl ?? undefined,
      createdAt: p.createdAt.getTime(),
      author: {
        id: p.author.id,
        username: p.author.username ?? undefined,
        name: p.author.name,
        image: p.author.image,
      },
    })),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as unknown;
  if (!isRecord(body) || typeof body.title !== "string" || typeof body.content !== "string") {
    return NextResponse.json(
      { ok: false, error: "Invalid body" },
      { status: 400 },
    );
  }

  const imageDataUrl =
    typeof body.imageDataUrl === "string" ? body.imageDataUrl : undefined;

  if (body.title.trim().length < 1 || body.title.trim().length > 140) {
    return NextResponse.json(
      { ok: false, error: "Title must be 1-140 characters." },
      { status: 400 },
    );
  }
  if (body.content.trim().length > 2000) {
    return NextResponse.json(
      { ok: false, error: "Content too long (max 2000 characters)." },
      { status: 400 },
    );
  }
  if (imageDataUrl && imageDataUrl.length > 4_000_000) {
    return NextResponse.json(
      { ok: false, error: "Image too large." },
      { status: 400 },
    );
  }

  try {
    const post = await prisma.post.create({
      data: {
        authorId: session.user.id,
        title: body.title.trim(),
        content: body.content,
        imageDataUrl,
      },
      select: {
        id: true,
        title: true,
        content: true,
        imageDataUrl: true,
        createdAt: true,
        author: {
          select: { id: true, username: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        imageDataUrl: post.imageDataUrl ?? undefined,
        createdAt: post.createdAt.getTime(),
        author: {
          id: post.author.id,
          username: post.author.username ?? undefined,
          name: post.author.name,
          image: post.author.image,
        },
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to create post." },
      { status: 500 },
    );
  }
}
