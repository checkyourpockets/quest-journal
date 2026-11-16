import { Journal } from "./journal/Journal";
import { SignIn } from "./auth/SignIn";
import { useJournal } from "./data/store";
import "./journal/journal.css";

export default function App() {
  const journal = useJournal();
  if (journal.booting && journal.mode !== "fixture") {
    return (
      <div className="qj">
        <div className="top" style={{ paddingBottom: 28 }}><div className="brand">Quest Journal</div></div>
        <div className="wrap"><p className="sub" style={{ textAlign: "center" }}>Opening the journal…</p></div>
      </div>
    );
  }
  if (!journal.view) {
    if (journal.session || journal.mode === "fixture") {
      return (
        <div className="qj">
          <div className="top" style={{ paddingBottom: 28 }}><div className="brand">Quest Journal</div></div>
          <div className="wrap"><p className={journal.loadError ? "err" : "sub"} style={{ textAlign: "center" }}>{journal.loadError || "Loading your pages…"}</p></div>
        </div>
      );
    }
    return (
      <SignIn
        onSubmit={journal.sendLink}
        sent={journal.linkSent}
        error={journal.authError}
        onFixture={import.meta.env.DEV ? journal.enterFixture : undefined}
      />
    );
  }
  return <Journal view={journal.view} actions={journal.actions} />;
}
