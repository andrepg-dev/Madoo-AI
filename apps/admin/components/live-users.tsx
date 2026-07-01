"use client";

import type { AdminLive } from "@madoo/shared";
import { useEffect, useState } from "react";

const POLL_MS = 10_000;

export function LiveUsers() {
  const [data, setData] = useState<AdminLive | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/live", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as AdminLive;
        if (alive) setData(json);
      } catch {
        // ignore transient network errors; keep the last value
      }
    };
    void load();
    const id = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const online = data?.online ?? 0;

  return (
    <div
      className="flex items-center gap-2 rounded-full bg-madoo-paper px-3 py-1.5 shadow-[0_0_0_0.5px_rgb(17_24_39/0.1)]"
      title={
        data
          ? `${online} active in the last 5 min · ${data.active15m} in 15 min · ${data.active60m} in 1 h`
          : "Live users"
      }
    >
      <span className="relative flex h-2.5 w-2.5">
        {online > 0 ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-madoo-green opacity-60" />
        ) : null}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
            online > 0 ? "bg-madoo-green" : "bg-madoo-faint"
          }`}
        />
      </span>
      <span className="text-sm font-semibold tabular-nums text-madoo-text">
        {online}
      </span>
      <span className="text-sm text-madoo-muted">online now</span>
    </div>
  );
}
