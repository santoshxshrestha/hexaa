import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

type UserRow = {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
  followers: { followerId: string }[];
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ users: [] }, { status: 200 });
  }

  const viewerId = session.user.id;
  const users = (await prisma.user.findMany({
    orderBy: [{ username: "asc" }, { id: "asc" }],
    take: 200,
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      followers: {
        where: { followerId: viewerId },
        select: { followerId: true },
      },
    },
  })) as unknown as UserRow[];

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      username: u.username ?? undefined,
      name: u.name,
      image: u.image,
      isFollowing: u.followers.length > 0,
    })),
  });
}
