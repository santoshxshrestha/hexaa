import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

import { OnboardingForm } from "./ui";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/");
  }

  if (session.user.username) {
    redirect("/feed");
  }

  return <OnboardingForm userId={session.user.id} />;
}
