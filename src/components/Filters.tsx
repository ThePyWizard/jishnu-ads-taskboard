"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PLATFORMS } from "@/lib/constants";

interface Current {
  app: string;
  platform: string;
  q: string;
}

export function Filters({ apps, current }: { apps: string[]; current: Current }) {
  const router = useRouter();
  const [q, setQ] = useState(current.q);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [pending, startTransition] = useTransition();
  // Show the clicked filter as selected straight away, while the server loads the results.
  const [shown, setShown] = useOptimistic(current);

  function go(patch: Partial<Current>) {
    const next = { ...current, q, ...patch };
    const params = new URLSearchParams(Object.entries(next).filter(([, v]) => v && v !== "all"));
    startTransition(() => {
      setShown(next);
      router.replace(params.size ? `/?${params}` : "/", { scroll: false });
    });
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className="filters" role="toolbar" aria-label="Filters" aria-busy={pending}>
      {["all", ...apps].map((a) => (
        <button key={a} className="chip" aria-pressed={shown.app === a} onClick={() => go({ app: a })}>
          {a === "all" ? "All apps" : a}
        </button>
      ))}
      <select aria-label="Platform" value={shown.platform} onChange={(e) => go({ platform: e.target.value })}>
        <option value="all">All platforms</option>
        {PLATFORMS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
      <input
        type="search"
        placeholder="Search campaign, reason…"
        aria-label="Search"
        value={q}
        onChange={(e) => {
          const value = e.target.value;
          setQ(value);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => go({ q: value }), 350);
        }}
      />
      {pending && <span className="loading">Loading…</span>}
    </div>
  );
}
