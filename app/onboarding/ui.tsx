"use client";

import { useMemo, useState } from "react";

type Props = {
  userId: string;
};

export function OnboardingForm({ userId }: Props) {
  const [username, setUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggested = useMemo(() => {
    const base = (userId.split(":")[0] ?? "user").toLowerCase();
    return `${base}_${userId.slice(-4)}`.replace(/[^a-z0-9_]/g, "");
  }, [userId]);

  async function submit() {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/me/username", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: username || suggested }),
      });

      const json = (await res.json()) as
        | { ok: true; username: string }
        | { ok: false; error: string };

      if (!res.ok || !json.ok) {
        setError("error" in json ? json.error : "Failed to set username.");
        return;
      }

      window.location.href = "/feed";
    } catch {
      setError("Network error.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-16">
      <div className="rounded-2xl border border-black/[.08] bg-white p-6 shadow-sm dark:border-white/[.145] dark:bg-black">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Pick your username
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Your username is public and becomes your unique handle.
        </p>

        <div className="mt-6">
          <label
            htmlFor="username"
            className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            Username
          </label>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1">
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={suggested}
                autoCapitalize="none"
                autoCorrect="off"
                className="h-11 w-full rounded-xl border border-black/[.08] bg-transparent px-4 text-sm text-black outline-none ring-0 placeholder:text-zinc-400 focus:border-black/30 dark:border-white/[.145] dark:text-zinc-50 dark:placeholder:text-zinc-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setUsername(suggested)}
              className="h-11 rounded-xl border border-black/[.08] px-4 text-sm font-medium text-black transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
            >
              Use suggested
            </button>
          </div>

          {error ? (
            <div className="mt-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={submit}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
          >
            {isSaving ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
