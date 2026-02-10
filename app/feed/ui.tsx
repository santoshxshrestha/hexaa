"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";

type Props = {
  viewerId: string;
  viewerUsername: string;
};

type ApiUser = {
  id: string;
  username?: string;
  name: string | null;
  image: string | null;
  isFollowing: boolean;
};

type ApiPost = {
  id: string;
  title: string;
  content: string;
  imageDataUrl?: string;
  createdAt: number;
  author: {
    id: string;
    username?: string;
    name: string | null;
    image: string | null;
  };
};

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function FeedShell({ viewerId, viewerUsername }: Props) {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [posts, setPosts] = useState<ApiPost[]>([]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const canPost = useMemo(() => {
    const t = title.trim();
    const c = content.trim();
    return Boolean(t) && (Boolean(c) || Boolean(imageDataUrl));
  }, [title, content, imageDataUrl]);

  async function load() {
    const [u, p] = await Promise.all([
      fetch("/api/users").then((r) => r.json() as Promise<{ users: ApiUser[] }>),
      fetch("/api/posts").then((r) => r.json() as Promise<{ posts: ApiPost[] }>),
    ]);
    setUsers(u.users);
    setPosts(p.posts);
  }

  useEffect(() => {
    void load();
  }, []);

  async function onPickFile(file: File | null) {
    setError(null);
    if (!file) {
      setImageDataUrl(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Please pick an image file.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("Image too large (max 3MB).");
      return;
    }

    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onerror = () => reject(new Error("read"));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
    setImageDataUrl(dataUrl);
  }

  async function submitPost() {
    setIsPosting(true);
    setError(null);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          imageDataUrl: imageDataUrl ?? undefined,
        }),
      });
      const json = (await res.json()) as
        | { ok: true; post: ApiPost }
        | { ok: false; error: string };

      if (!res.ok || !json.ok) {
        setError("error" in json ? json.error : "Failed to post.");
        return;
      }

      setTitle("");
      setContent("");
      setImageDataUrl(null);
      await load();
    } catch {
      setError("Network error.");
    } finally {
      setIsPosting(false);
    }
  }

  async function toggleFollow(user: ApiUser) {
    const res = await fetch("/api/follow", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: user.id, follow: !user.isFollowing }),
    });
    if (res.ok) {
      await load();
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-black dark:bg-black dark:text-zinc-50">
      <header className="sticky top-0 z-10 border-b border-black/[.08] bg-white/80 backdrop-blur dark:border-white/[.145] dark:bg-black/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-3">
            <div className="text-lg font-semibold tracking-tight">hexaa</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              @{viewerUsername}
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="h-10 rounded-full border border-black/[.08] px-4 text-sm font-medium transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[1fr_340px]">
        <section>
          <div className="rounded-2xl border border-black/[.08] bg-white p-6 shadow-sm dark:border-white/[.145] dark:bg-black">
            <h2 className="text-base font-semibold">Create a post</h2>
            <div className="mt-4 grid gap-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="h-11 w-full rounded-xl border border-black/[.08] bg-transparent px-4 text-sm outline-none placeholder:text-zinc-400 focus:border-black/30 dark:border-white/[.145] dark:placeholder:text-zinc-500"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write something..."
                rows={4}
                className="w-full resize-none rounded-xl border border-black/[.08] bg-transparent px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-black/30 dark:border-white/[.145] dark:placeholder:text-zinc-500"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <label className="inline-flex h-10 cursor-pointer items-center rounded-full border border-black/[.08] px-4 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
                    />
                    Add image
                  </label>
                  {imageDataUrl ? (
                    <button
                      type="button"
                      onClick={() => setImageDataUrl(null)}
                      className="h-10 rounded-full border border-black/[.08] px-4 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>

                <button
                  type="button"
                  disabled={!canPost || isPosting}
                  onClick={() => void submitPost()}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
                >
                  {isPosting ? "Posting..." : "Post"}
                </button>
              </div>

              {error ? (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              ) : null}

              {imageDataUrl ? (
                <div className="overflow-hidden rounded-2xl border border-black/[.08] dark:border-white/[.145]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageDataUrl}
                    alt="Selected upload"
                    className="h-[260px] w-full object-cover"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-8 grid gap-4">
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/[.18] bg-white p-10 text-center text-sm text-zinc-600 dark:border-white/[.22] dark:bg-black dark:text-zinc-400">
                No posts yet. Make the first one.
              </div>
            ) : null}

            {posts.map((post) => (
              <article
                key={post.id}
                className="rounded-2xl border border-black/[.08] bg-white p-6 shadow-sm dark:border-white/[.145] dark:bg-black"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                      {post.author.image ? (
                        <Image
                          src={post.author.image}
                          alt={post.author.username ?? post.author.name ?? "User"}
                          width={36}
                          height={36}
                        />
                      ) : null}
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {post.author.username ? `@${post.author.username}` : "(no username)"}
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400">
                        {timeAgo(post.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="mt-4 text-lg font-semibold leading-7 tracking-tight">
                  {post.title}
                </h3>
                {post.content ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                    {post.content}
                  </p>
                ) : null}

                {post.imageDataUrl ? (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-black/[.08] dark:border-white/[.145]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.imageDataUrl}
                      alt={post.title}
                      className="max-h-[520px] w-full object-cover"
                    />
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-black/[.08] bg-white p-6 shadow-sm dark:border-white/[.145] dark:bg-black">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">People</h2>
              <button
                type="button"
                onClick={() => void load()}
                className="text-sm font-medium text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white"
              >
                Refresh
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              {users
                .filter((u) => u.id !== viewerId)
                .map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-black/[.06] px-3 py-3 dark:border-white/[.10]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-9 w-9 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                        {u.image ? (
                          <Image
                            src={u.image}
                            alt={u.username ?? u.name ?? "User"}
                            width={36}
                            height={36}
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {u.username ? `@${u.username}` : "(no username)"}
                        </div>
                        <div className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                          {u.name ?? u.id}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void toggleFollow(u)}
                      className={
                        u.isFollowing
                          ? "h-9 rounded-full border border-black/[.08] px-4 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
                          : "h-9 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
                      }
                    >
                      {u.isFollowing ? "Following" : "Follow"}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
