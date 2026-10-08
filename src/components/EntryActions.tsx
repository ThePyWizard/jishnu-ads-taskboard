"use client";

import { useState, useTransition } from "react";
import { deleteChange, setWhy } from "@/app/actions";

/** Owner-only controls on a change: edit its reason or delete it. */
export function EntryActions({ id, why }: { id: string; why: string | null }) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(why ?? "");
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState("");

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      setError("");
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
      }
    });

  return (
    <>
      {editing ? (
        <form
          className="why-form"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await setWhy(id, draft);
              setEditing(false);
            });
          }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Why was this changed? e.g. CPI held at $1.10 for 3 days"
            maxLength={600}
            autoFocus
            aria-label="Why"
          />
          <div className="row-end">
            <button type="button" className="link" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button className="btn small" disabled={pending}>
              Save
            </button>
          </div>
        </form>
      ) : why ? (
        <p className="why">{why}</p>
      ) : null}

      <div className="e-foot">
        <span className="spacer" />
        {!editing && (
          <button className="link" onClick={() => setEditing(true)}>
            {why ? "Edit why" : "Add why"}
          </button>
        )}
        <button
          className="link danger"
          disabled={pending}
          onBlur={() => setArmed(false)}
          onClick={() => (armed ? run(() => deleteChange(id)) : setArmed(true))}
        >
          {armed ? "Confirm delete" : "Delete"}
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </>
  );
}
