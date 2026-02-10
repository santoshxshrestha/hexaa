"use client";

import { getProviders, signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function AuthButtons() {
  const { data, status } = useSession();
  const [available, setAvailable] = useState<Record<string, { id: string }> | null>(null);

  useEffect(() => {
    let isMounted = true;
    void getProviders().then((p) => {
      if (isMounted) setAvailable(p as Record<string, { id: string }> | null);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="text-sm text-zinc-600 dark:text-zinc-400">Loading...</div>
    );
  }

  if (!data?.user) {
    const hasGithub = Boolean(available?.github);
    const hasGoogle = Boolean(available?.google);

    return (
      <div className="flex flex-wrap items-center gap-3">
        {hasGithub ? (
          <button
            type="button"
            onClick={() => signIn("github")}
            className="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Sign in with GitHub
          </button>
        ) : null}
        {hasGoogle ? (
          <button
            type="button"
            onClick={() => signIn("google")}
            className="inline-flex h-10 items-center justify-center rounded-full border border-solid border-black/[.08] px-5 text-sm font-medium transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          >
            Sign in with Google
          </button>
        ) : null}

        {available && !hasGithub && !hasGoogle ? (
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            No auth providers configured.
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="text-sm text-zinc-600 dark:text-zinc-400">
        Signed in as <span className="font-medium">{data.user.email ?? data.user.name}</span>
      </div>
      <button
        type="button"
        onClick={() => signOut()}
        className="inline-flex h-10 items-center justify-center rounded-full border border-solid border-black/[.08] px-5 text-sm font-medium transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
      >
        Sign out
      </button>
    </div>
  );
}
