import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { signOut } from "@/app/actions";
import { percentChange, platformLabel } from "@/lib/constants";
import { addDays, dayKey, fmtDay, fmtTime, todayKey, weekdayMon0, zonedToUtcMs } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { AppRow, Change, Task } from "@/lib/types";
import { EntryActions } from "./EntryActions";
import { Filters } from "./Filters";
import { LogChangeForm } from "./LogChangeForm";
import { TaskPanel } from "./TaskPanel";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function Dashboard({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  // getClaims verifies the login token locally (ES256 signing keys), so it needs no network call.
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth) redirect("/login");
  const me = String(auth.claims.email ?? "");

  const sp = await searchParams;
  const param = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const filter = {
    app: param("app") || "all",
    platform: param("platform") || "all",
    q: param("q"),
  };
  const limit = Math.min(Math.max(Number(param("limit")) || 150, 50), 2000);

  // "Today" depends on the clock, so this must never be prerendered or prefetched ahead of time.
  await connection();
  const today = todayKey();
  const statsSince = new Date(zonedToUtcMs(`${addDays(today, -90)} 00:00:00`)).toISOString();

  let timelineQuery = supabase
    .from("changes")
    .select("*")
    .order("happened_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit + 1);
  if (filter.app !== "all") timelineQuery = timelineQuery.eq("app", filter.app);
  if (filter.platform !== "all") timelineQuery = timelineQuery.eq("platform", filter.platform);
  const q = filter.q.replace(/[,()%*\\]/g, " ").trim();
  if (q) {
    timelineQuery = timelineQuery.or(
      ["entity", "why", "kind", "before_value", "after_value"].map((c) => `${c}.ilike.%${q}%`).join(","),
    );
  }

  // One round trip: the role lookup runs alongside the data queries. Non-members get empty
  // results from the database rules, so nothing leaks before the membership check below.
  const [memberRes, appsRes, timelineRes, statsRes, tasksRes, doneRes] = await Promise.all([
    supabase.from("members").select("role").ilike("email", me).maybeSingle(),
    supabase.from("apps").select("name").order("sort").order("name"),
    timelineQuery,
    supabase
      .from("changes")
      .select("happened_at, app")
      .gte("happened_at", statsSince)
      .order("happened_at", { ascending: false })
      .limit(5000),
    supabase.from("tasks").select("*").or(`done.eq.false,day.eq.${today}`).order("created_at"),
    supabase.from("tasks").select("done_on").gte("done_on", addDays(today, -90)),
  ]);

  const member = memberRes.data as { role: string } | null;
  if (!member) {
    return (
      <div className="empty">
        <b>You&apos;re not on the members list yet</b>
        Ask the owner to add <span className="mono">{me}</span> to the <span className="mono">members</span> table in
        Supabase, then reload.
        <form action={signOut} style={{ marginTop: 16 }}>
          <button className="btn ghost">Sign out</button>
        </form>
      </div>
    );
  }
  const isOwner = member.role === "owner";

  const apps = ((appsRes.data ?? []) as AppRow[]).map((a) => a.name);
  const rows = (timelineRes.data ?? []) as Change[];
  const hasMore = rows.length > limit;
  const timeline = rows.slice(0, limit);
  const stats = (statsRes.data ?? []) as Pick<Change, "happened_at" | "app">[];
  const tasks = (tasksRes.data ?? []) as Task[];

  // Streak: consecutive days with a logged change or a finished task.
  const activeDays = new Set<string>(stats.map((c) => dayKey(c.happened_at)));
  (doneRes.data ?? []).forEach((t: { done_on: string | null }) => t.done_on && activeDays.add(t.done_on));
  let streak = 0;
  let cursor = activeDays.has(today) ? today : addDays(today, -1);
  while (activeDays.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }

  const weekStart = addDays(today, -6);
  const perDay = new Map<string, number>();
  const perApp = new Map<string, number>(apps.map((a) => [a, 0]));
  let weekCount = 0;
  for (const c of stats) {
    const k = dayKey(c.happened_at);
    perDay.set(k, (perDay.get(k) ?? 0) + 1);
    if (k >= weekStart) {
      weekCount++;
      perApp.set(c.app, (perApp.get(c.app) ?? 0) + 1);
    }
  }
  const heatStart = addDays(today, -weekdayMon0(today) - 77);
  const heat = Array.from({ length: 84 }, (_, i) => {
    const k = addDays(heatStart, i);
    const n = perDay.get(k) ?? 0;
    return { k, n, level: n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 6 ? 3 : 4, future: k > today };
  });
  const bars = [...perApp.entries()].sort((a, b) => b[1] - a[1]);
  const barMax = Math.max(1, ...bars.map((b) => b[1]));

  const groups: { k: string; items: Change[] }[] = [];
  for (const c of timeline) {
    const k = dayKey(c.happened_at);
    const last = groups[groups.length - 1];
    if (last && last.k === k) last.items.push(c);
    else groups.push({ k, items: [c] });
  }

  const moreParams = new URLSearchParams(
    Object.entries({ ...filter, limit: String(limit + 150) }).filter(([, v]) => v && v !== "all"),
  );

  return (
    <>
      <header className="top">
        <div className="brand">
          <h1>
            Ad Ledger<span>.</span>
          </h1>
          <p>Every change to Lascade&apos;s app campaigns on Meta, Google and the rest, logged the day it happens.</p>
        </div>
        <div className="kpis">
          <div className="kpi streak">
            <b>{streak}</b>
            <small>day streak</small>
          </div>
          <div className="kpi">
            <b>{weekCount}</b>
            <small>changes, 7 days</small>
          </div>
          {isOwner && (
            <div className="kpi">
              <b>{tasks.filter((t) => !t.done).length}</b>
              <small>open tasks</small>
            </div>
          )}
        </div>
      </header>

      <div className="grid">
        <main>
          <section className="card pulse" aria-label="Activity">
            <div className="heat-wrap">
              <div className="label">Last 12 weeks</div>
              <div className="heat" role="img" aria-label="Changes per day over the last 12 weeks">
                {heat.map((h) => (
                  <i
                    key={h.k}
                    className={`l${h.level}${h.k === today ? " today" : ""}${h.future ? " future" : ""}`}
                    title={`${fmtDay(h.k, today)}: ${h.n} change${h.n === 1 ? "" : "s"}`}
                  />
                ))}
              </div>
              <div className="legend">
                Less <i className="l0" />
                <i className="l1" />
                <i className="l2" />
                <i className="l3" />
                <i className="l4" /> More
              </div>
            </div>
            <div className="bars">
              <div className="label">Changes by app, last 7 days</div>
              {bars.map(([app, n]) => (
                <div className="bar-row" key={app}>
                  <span title={app}>{app}</span>
                  <div className="bar">
                    <i style={{ width: `${(n / barMax) * 100}%` }} />
                  </div>
                  <b>{n}</b>
                </div>
              ))}
            </div>
          </section>

          <Filters apps={apps} current={filter} />

          {groups.length === 0 ? (
            <div className="empty">
              {filter.app !== "all" || filter.platform !== "all" || filter.q ? (
                <>
                  <b>No changes match</b>Try another app, platform or search term.
                </>
              ) : (
                <>
                  <b>No changes logged yet</b>
                  {isOwner
                    ? "Use “Log a change” to record your first edit: a budget bump, a paused ad set, a new creative."
                    : "Changes will appear here, newest first, as soon as the owner logs them."}
                </>
              )}
            </div>
          ) : (
            groups.map((g) => (
              <section className="day" key={g.k}>
                <div className="day-head">
                  <h3>{fmtDay(g.k, today)}</h3>
                  <span>
                    {g.items.length} change{g.items.length === 1 ? "" : "s"}
                  </span>
                </div>
                {g.items.map((c) => (
                  <Entry key={c.id} c={c} isOwner={isOwner} />
                ))}
              </section>
            ))
          )}
          {hasMore && (
            <Link className="btn ghost more" href={`/?${moreParams}`} scroll={false}>
              Show older changes
            </Link>
          )}
        </main>

        <aside>
          {isOwner && (
            <>
              <section className="card">
                <div className="card-head">
                  <h2>Log a change</h2>
                </div>
                <LogChangeForm apps={apps} today={today} />
              </section>

              <section className="card">
                <TaskPanel tasks={tasks} apps={apps} today={today} />
              </section>
            </>
          )}

          <form action={signOut} className="signout">
            <span className="muted small">
              {me}
              {!isOwner && <span className="role">View only</span>}
            </span>
            <button className="link">Sign out</button>
          </form>
        </aside>
      </div>
    </>
  );
}

function Entry({ c, isOwner }: { c: Change; isOwner: boolean }) {
  const pct = percentChange(c.before_value, c.after_value);
  return (
    <article className="entry" data-platform={c.platform}>
      <div className="e-rail">
        <span className={`plat plat-${c.platform}`}>{platformLabel(c.platform)}</span>
        <time dateTime={c.happened_at}>{fmtTime(c.happened_at)}</time>
      </div>
      <div className="e-body">
        <div className="e-head">
          <span className="app">{c.app}</span>
          <span className="kind">{c.kind}</span>
        </div>
        {c.entity && <div className="entity mono">{c.entity}</div>}
        {(c.before_value || c.after_value) && (
          <div className="diff mono">
            {c.before_value && <span className="was">{c.before_value}</span>}
            {c.before_value && c.after_value && <span aria-hidden="true">→</span>}
            {c.after_value && <span className="now">{c.after_value}</span>}
            {pct !== null && (
              <span className={`delta ${pct > 0 ? "up" : "down"}`}>
                {pct > 0 ? `▲ +${pct}` : `▼ ${pct}`}%
              </span>
            )}
          </div>
        )}
        {isOwner ? <EntryActions id={c.id} why={c.why} /> : c.why && <p className="why">{c.why}</p>}
      </div>
    </article>
  );
}
