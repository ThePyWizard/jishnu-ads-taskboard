"use client";

import { startTransition, useActionState, useEffect, useRef, useState, useTransition } from "react";
import { addApp, logChange } from "@/app/actions";
import { KINDS, PLATFORMS } from "@/lib/constants";

export function LogChangeForm({ apps, today }: { apps: string[]; today: string }) {
  const [state, action, pending] = useActionState(logChange, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [addingApp, setAddingApp] = useState(false);
  const [newApp, setNewApp] = useState("");
  const [appError, setAppError] = useState("");
  const [savingApp, startApp] = useTransition();

  useEffect(() => {
    if (!state?.ok || !formRef.current) return;
    for (const name of ["entity", "before", "after", "why"]) {
      const el = formRef.current.elements.namedItem(name) as HTMLInputElement | null;
      if (el) el.value = "";
    }
  }, [state]);

  function saveApp() {
    startApp(async () => {
      setAppError("");
      try {
        await addApp(newApp);
        setNewApp("");
        setAddingApp(false);
      } catch (e) {
        setAppError(e instanceof Error ? e.message : "Couldn't add the app.");
      }
    });
  }

  return (
    <form
      ref={formRef}
      className="form"
      autoComplete="off"
      onSubmit={(e) => {
        // Submit manually so React doesn't reset the form when saving fails.
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <div className="field">
        <label htmlFor="cApp">App</label>
        <div className="row">
          <select id="cApp" name="app" required>
            {apps.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <button type="button" className="btn ghost" onClick={() => setAddingApp((v) => !v)}>
            + App
          </button>
        </div>
        {addingApp && (
          <div className="row">
            <input
              value={newApp}
              onChange={(e) => setNewApp(e.target.value)}
              placeholder="New app name"
              maxLength={40}
              aria-label="New app name"
            />
            <button type="button" className="btn ghost" onClick={saveApp} disabled={savingApp || !newApp.trim()}>
              Add
            </button>
          </div>
        )}
        {appError && <p className="form-error">{appError}</p>}
      </div>

      <fieldset className="field">
        <legend className="label">Platform</legend>
        <div className="seg">
          {PLATFORMS.map((p, i) => (
            <label key={p.id}>
              <input type="radio" name="platform" value={p.id} defaultChecked={i === 0} />
              <span>{p.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="two">
        <div className="field">
          <label htmlFor="cKind">What changed</label>
          <select id="cKind" name="kind">
            {KINDS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="cDate">Date</label>
          <input id="cDate" name="day" type="date" defaultValue={today} max={today} required />
        </div>
      </div>

      <div className="field">
        <label htmlFor="cEntity">Campaign / ad set / ad</label>
        <input id="cEntity" name="entity" className="mono" placeholder="TA_iOS_US_tCPI_v3" maxLength={140} />
      </div>
      <div className="two">
        <div className="field">
          <label htmlFor="cBefore">Before</label>
          <input id="cBefore" name="before" placeholder="$50/day" maxLength={60} />
        </div>
        <div className="field">
          <label htmlFor="cAfter">After</label>
          <input id="cAfter" name="after" placeholder="$80/day" maxLength={60} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="cWhy">Why</label>
        <textarea id="cWhy" name="why" placeholder="CPI held at $1.10 for 3 days, scaling budget 60%" maxLength={600} />
      </div>

      <button className="btn" disabled={pending}>
        {pending ? "Saving…" : "Log change"}
      </button>
      {state && <p className={state.ok ? "form-ok" : "form-error"}>{state.message}</p>}
    </form>
  );
}
