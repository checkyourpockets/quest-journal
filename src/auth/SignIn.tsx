import { useState, type FormEvent } from "react";

export function SignIn({
  onSubmit,
  sent,
  error,
  onFixture,
}: {
  onSubmit: (email: string) => Promise<void>;
  sent: boolean;
  error: string;
  onFixture?: () => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [fixtureError, setFixtureError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setBusy(true);
    try { await onSubmit(email); }
    finally { setBusy(false); }
  };

  return (
    <div className="qj">
      <div className="top" style={{ paddingBottom: 28 }}>
        <div className="brand">Matt's Quest Journal</div>
        <div className="date">A field journal for the long work</div>
      </div>
      <div className="wrap">
        <div className="pn" style={{ maxWidth: 480 }}>
          <div className="ph">
            <h3>Sign in</h3>
            <p>We'll email you a magic link. Open it on this device. The session stays until you sign out.</p>
          </div>
          <form onSubmit={(e) => void submit(e)} style={{ display: "grid", gap: 10 }}>
            <input type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={(ev) => setEmail(ev.target.value)} aria-label="Email" />
            <button type="submit" className="btn primary" disabled={busy || !email.includes("@")}>{busy ? "Sending…" : "Email me a link"}</button>
          </form>
          {sent ? <p className="ok" style={{ textAlign: "center" }}>Check your inbox, then open the link here.</p> : null}
          {error ? <p className="err" role="alert">{error}</p> : null}
          {onFixture ? (
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <button type="button" className="btn sm" onClick={() => void onFixture().catch((err: unknown) => setFixtureError(err instanceof Error ? err.message : "Fixture failed"))}>Use local fixture</button>
              {fixtureError ? <p className="err">{fixtureError}</p> : null}
              <p className="note">Dev only. Reads gitignored files on this machine and does not talk to Supabase.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
