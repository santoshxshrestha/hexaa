import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

import { FeedShell } from "./ui";

export default async function FeedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/");
  }
  if (!session.user.username) {
    redirect("/onboarding");
  }

  return <FeedShell viewerId={session.user.id} viewerUsername={session.user.username} />;
}
