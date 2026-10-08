"use client";

import { useEffect, useRef, useState } from "react";
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

  function go(patch: Partial<Current>) {
    const next = { ...current, q, ...patch };
    const params = new URLSearchParams(Object.entries(next).filter(([, v]) => v && v !== "all"));
    router.replace(params.size ? `/?${params}` : "/", { scroll: false });
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className="filters" role="toolbar" aria-label="Filters">
      {["all", ...apps].map((a) => (
        <button key={a} className="chip" aria-pressed={current.app === a} onClick={() => go({ app: a })}>
          {a === "all" ? "All apps" : a}
        </button>
      ))}
      <select aria-label="Platform" value={current.platform} onChange={(e) => go({ platform: e.target.value })}>
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
    </div>
  );
}
