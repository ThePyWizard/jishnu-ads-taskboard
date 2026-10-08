"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { KINDS, PLATFORMS } from "@/lib/constants";
import { TZ, dayKey, zonedToUtcMs } from "@/lib/dates";
import { createClient, describeError } from "@/lib/supabase/server";

export interface FormState {
  ok: boolean;
  message: string;
  at: number;
}

const str = (fd: FormData, key: string, max = 600) => String(fd.get(key) ?? "").trim().slice(0, max);

function fail(message: string): FormState {
  return { ok: false, message, at: Date.now() };
}

const VIEW_ONLY = "You have view-only access. Only the owner can make changes.";

/**
 * Writes go straight to the database, whose rules let only the owner write: one round trip
 * instead of checking the role first. A refused insert returns code 42501; a refused update
 * or delete matches no rows, so those ask for the affected ids and treat none as refused.
 */
function writeError(error: { code?: string; message: string }): string {
  return error.code === "42501" ? VIEW_ONLY : describeError(error);
}

function checkAffected(result: { data: unknown[] | null; error: { code?: string; message: string } | null }) {
  if (result.error) throw new Error(writeError(result.error));
  if (!result.data?.length) throw new Error(`${VIEW_ONLY} If you are the owner, reload the page: it may have been deleted.`);
}

export async function logChange(_prev: FormState | null, fd: FormData): Promise<FormState> {
  const platform = str(fd, "platform");
  const kind = str(fd, "kind");
  const app = str(fd, "app", 60);
  const day = str(fd, "day", 10);
  if (!PLATFORMS.some((p) => p.id === platform)) return fail("Pick a platform.");
  if (!KINDS.includes(kind)) return fail("Pick what changed.");
  if (!app) return fail("Pick an app.");

  const today = dayKey(Date.now());
  const happenedAt =
    !/^\d{4}-\d{2}-\d{2}$/.test(day) || day >= today ? new Date() : new Date(zonedToUtcMs(`${day} 12:00:00`, TZ));

  const supabase = await createClient();
  const { error } = await supabase.from("changes").insert({
    happened_at: happenedAt.toISOString(),
    app,
    platform,
    kind,
    entity: str(fd, "entity", 140) || null,
    before_value: str(fd, "before", 60) || null,
    after_value: str(fd, "after", 60) || null,
    why: str(fd, "why") || null,
  });
  if (error) return fail(`Couldn't save the change. ${writeError(error)}`);
  refresh();
  return { ok: true, message: `Logged: ${app} · ${kind}`, at: Date.now() };
}

export async function setWhy(id: string, why: string) {
  const supabase = await createClient();
  checkAffected(
    await supabase
      .from("changes")
      .update({ why: why.trim().slice(0, 600) || null })
      .eq("id", id)
      .select("id"),
  );
  refresh();
}

export async function deleteChange(id: string) {
  const supabase = await createClient();
  checkAffected(await supabase.from("changes").delete().eq("id", id).select("id"));
  refresh();
}

export async function addTask(_prev: FormState | null, fd: FormData): Promise<FormState> {
  const text = str(fd, "text", 200);
  if (!text) return fail("Write the task first.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .insert({ text, app: str(fd, "app", 60) || null, day: dayKey(Date.now()) });
  if (error) return fail(`Couldn't add the task. ${writeError(error)}`);
  refresh();
  return { ok: true, message: "Task added", at: Date.now() };
}

export async function setTaskDone(id: string, done: boolean) {
  const supabase = await createClient();
  checkAffected(
    await supabase
      .from("tasks")
      .update({ done, done_on: done ? dayKey(Date.now()) : null })
      .eq("id", id)
      .select("id"),
  );
  refresh();
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  checkAffected(await supabase.from("tasks").delete().eq("id", id).select("id"));
  refresh();
}

export async function addApp(name: string) {
  const clean = name.trim().slice(0, 40);
  if (!clean) return;
  const supabase = await createClient();
  const { error } = await supabase.from("apps").insert({ name: clean, sort: 100 });
  if (error) throw new Error(error.code === "23505" ? `${clean} is already in the list.` : writeError(error));
  refresh();
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
