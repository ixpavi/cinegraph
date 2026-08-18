import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, ApiError } from "../api/client";
import type { PathResult, PersonSummary } from "../api/types";
import { PersonPicker } from "../components/PersonPicker";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import { posterStyle, initials } from "../lib/poster";
import styles from "./ConnectionsPage.module.css";

type Status = { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string } | { kind: "success"; data: PathResult };

export function ConnectionsPage() {
  const [params] = useSearchParams();
  const [from, setFrom] = useState<PersonSummary | null>(null);
  const [to, setTo] = useState<PersonSummary | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const prefillFromId = params.get("from") ?? undefined;

  useEffect(() => {
    if (!prefillFromId) return;
    api.person(prefillFromId).then((p) => setFrom({ id: p.id, name: p.name })).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillFromId]);

  async function runSearch(a: PersonSummary | null, b: PersonSummary | null) {
    if (!a || !b) return;
    if (a.id === b.id) {
      setStatus({ kind: "error", message: "Pick two different people to trace a path between them." });
      return;
    }
    setStatus({ kind: "loading" });
    try {
      const data = await api.path(a.id, b.id);
      setStatus({ kind: "success", data });
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof ApiError ? err.message : "Couldn't compute a path." });
    }
  }

  return (
    <div>
      <header className={styles.header}>
        <p className={styles.kicker}>Six degrees, for real</p>
        <h1 className={styles.title}>How is anyone connected to anyone else?</h1>
        <p className={styles.subtitle}>
          Pick two people and CineGraph finds the shortest chain of shared film credits between them —
          a variable-length graph traversal that a relational join table would struggle to express cleanly.
        </p>
      </header>

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(from, to);
        }}
      >
        <div className={styles.field}>
          <label className={styles.label}>From</label>
          <PersonPicker placeholder="Search a person…" onSelect={setFrom} initialLabel={from?.name} />
        </div>
        <button
          type="button"
          className={styles.swapButton}
          aria-label="Swap"
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
        >
          <SwapIcon />
        </button>
        <div className={styles.field}>
          <label className={styles.label}>To</label>
          <PersonPicker placeholder="Search a person…" onSelect={setTo} />
        </div>
        <button type="submit" className={styles.submitButton} disabled={!from || !to}>
          Trace connection
        </button>
      </form>

      <div className={styles.resultWrap}>
        {status.kind === "loading" && <LoadingState label="Walking the graph…" />}
        {status.kind === "error" && <ErrorState subtitle={status.message} />}
        {status.kind === "idle" && (
          <EmptyState
            title="Pick two people to trace a path"
            subtitle="Try someone from a Christopher Nolan film and someone from a Tarantino film — the catalogue is built for exactly this."
          />
        )}
        {status.kind === "success" && (
          <>
            <p className={styles.resultMeta}>
              Found a path of {status.data.hops} hop{status.data.hops === 1 ? "" : "s"}.
            </p>
            <div className={styles.chain}>
              {status.data.steps.map((step, i) => (
                <div key={`${step.kind}-${step.id}-${i}`} style={{ display: "flex", alignItems: "center" }}>
                  <Link
                    to={step.kind === "Person" ? `/people/${step.id}` : `/movies/${step.id}`}
                    className={styles.node}
                  >
                    <span
                      className={step.kind === "Movie" ? `${styles.nodeCircle} ${styles.nodeMovie}` : styles.nodeCircle}
                      style={posterStyle(step.id)}
                    >
                      {initials(step.name)}
                    </span>
                    <span className={styles.nodeLabel}>{step.name}</span>
                    <span className={styles.nodeKind}>{step.kind}</span>
                  </Link>
                  {i < status.data.steps.length - 1 && <div className={styles.connector} />}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SwapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 10 3 6l4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 6h13a4 4 0 0 1 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m17 14 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 18H8a4 4 0 0 1-4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
