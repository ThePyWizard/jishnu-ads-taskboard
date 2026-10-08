"use client";

import { startTransition, useActionState, useEffect, useRef, useState, useTransition } from "react";
import { addTask, deleteTask, setTaskDone } from "@/app/actions";
import { fmtDay } from "@/lib/dates";
import type { Task } from "@/lib/types";

/** The owner's daily task list. Not shown to viewers. */
export function TaskPanel({ tasks, apps, today }: { tasks: Task[]; apps: string[]; today: string }) {
  const [state, action, adding] = useActionState(addTask, null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [armed, setArmed] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (state?.ok && inputRef.current) inputRef.current.value = "";
  }, [state]);

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      setError("");
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
      }
    });

  const sorted = [...tasks].sort((a, b) => Number(a.done) - Number(b.done));
  const done = tasks.filter((t) => t.done).length;

  return (
    <>
      <div className="card-head">
        <h2>Today&apos;s tasks</h2>
        {tasks.length > 0 && (
          <small>
            {done} of {tasks.length} done
          </small>
        )}
      </div>
      <form
        className="form task-form"
        autoComplete="off"
        onSubmit={(e) => {
          // Submit manually so React doesn't clear the input when saving fails.
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(() => action(fd));
        }}
      >
        <input
          ref={inputRef}
          name="text"
          placeholder="Test 3 new hooks for MarineRadar"
          maxLength={200}
          required
          aria-label="Task"
        />
        <select name="app" aria-label="App for task" defaultValue="">
          <option value="">Any app</option>
          {apps.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <button className="btn ghost" disabled={adding}>
          Add
        </button>
      </form>
      {state && !state.ok && <p className="form-error">{state.message}</p>}
      {error && <p className="form-error">{error}</p>}

      <ul className="tasks">
        {sorted.length === 0 && <li className="muted">Nothing planned yet. Add what you&apos;ll work on today.</li>}
        {sorted.map((t) => (
          <li key={t.id} className={t.done ? "done" : ""}>
            <input
              type="checkbox"
              checked={t.done}
              disabled={pending}
              onChange={(e) => run(() => setTaskDone(t.id, e.target.checked))}
              aria-label={`Done: ${t.text}`}
            />
            <div>
              <span className="t-text">{t.text}</span>
              {(t.app || t.day !== today) && (
                <span className="t-meta">
                  {t.app}
                  {t.app && t.day !== today && " · "}
                  {t.day !== today && <span className="carry">from {fmtDay(t.day, today)}</span>}
                </span>
              )}
            </div>
            <button
              className="link danger"
              aria-label="Delete task"
              disabled={pending}
              onBlur={() => setArmed(null)}
              onClick={() => (armed === t.id ? run(() => deleteTask(t.id)) : setArmed(t.id))}
            >
              {armed === t.id ? "Confirm" : "×"}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
