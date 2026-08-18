import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAsync } from "../lib/useAsync";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import { GenreChip } from "../components/GenreChip";
import { posterStyle, initials } from "../lib/poster";
import styles from "./RecommendationsPage.module.css";

export function RecommendationsPage() {
  const users = useAsync(() => api.demoUsers(), []);
  const [selected, setSelected] = useState<string | null>(null);

  const ratings = useAsync(() => (selected ? api.userRatings(selected) : Promise.resolve([])), [selected]);
  const recs = useAsync(() => (selected ? api.recommendations(selected) : Promise.resolve([])), [selected]);

  return (
    <div>
      <header className={styles.header}>
        <p className={styles.kicker}>Graph-powered recommendations</p>
        <h1 className={styles.title}>Recommendations built from taste-neighbours, not a lookup table</h1>
        <p className={styles.subtitle}>
          Pick a demo viewer below. CineGraph walks out from their highly-rated films to the other viewers
          who also loved them, then surfaces what those taste-neighbours loved next — three hops of graph
          traversal that would mean a multi-way self-join in SQL.
        </p>
      </header>

      {users.status === "loading" && <LoadingState label="Loading demo viewers…" />}
      {users.status === "error" && <ErrorState subtitle={users.message} onRetry={users.reload} />}

      {users.status === "success" && (
        <div className={styles.userGrid}>
          {users.data.map((u) => (
            <button
              key={u.id}
              className={selected === u.id ? `${styles.userCard} ${styles.userCardActive}` : styles.userCard}
              onClick={() => setSelected(u.id)}
            >
              <span className={styles.userAvatar} style={posterStyle(u.id)}>
                {initials(u.name)}
              </span>
              <span>
                <div className={styles.userName}>{u.name}</div>
                <div className={styles.userSub}>{u.ratingCount} ratings</div>
              </span>
            </button>
          ))}
        </div>
      )}

      {!selected && (
        <div style={{ marginTop: "var(--space-7)" }}>
          <EmptyState title="Pick a viewer to see their recommendations" />
        </div>
      )}

      {selected && (
        <div className={styles.columns}>
          <section>
            <h2 className={styles.sectionTitle}>What they've rated</h2>
            {ratings.status === "loading" && <LoadingState label="Loading ratings…" />}
            {ratings.status === "error" && <ErrorState subtitle={ratings.message} />}
            {ratings.status === "success" && (
              <div className={styles.ratedList}>
                {ratings.data.map((r) => (
                  <Link key={r.id} to={`/movies/${r.id}`} className={styles.ratedRow}>
                    <span className={styles.ratedTitle}>
                      {r.title} <span className={styles.ratedYear}>{r.year}</span>
                    </span>
                    <span className={styles.score}>{r.score.toFixed(1)}★</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Recommended for them</h2>
            {recs.status === "loading" && <LoadingState label="Walking the taste graph…" />}
            {recs.status === "error" && <ErrorState subtitle={recs.message} />}
            {recs.status === "success" && recs.data.length === 0 && (
              <EmptyState
                title="No recommendations yet"
                subtitle="This viewer's taste-neighbours haven't rated anything they haven't already seen."
              />
            )}
            {recs.status === "success" && recs.data.length > 0 && (
              <div className={styles.recGrid}>
                {recs.data.map((rec) => (
                  <Link key={rec.id} to={`/movies/${rec.id}`} style={{ display: "block" }}>
                    <div
                      style={{
                        borderRadius: "var(--radius-md)",
                        overflow: "hidden",
                        border: "1px solid var(--surface-border)",
                        background: "var(--surface-1)",
                      }}
                    >
                      <div
                        style={{
                          aspectRatio: "2 / 3",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "var(--font-display)",
                          fontSize: "2rem",
                          fontWeight: 600,
                          color: "rgba(244,237,225,0.92)",
                          ...posterStyle(rec.id),
                        }}
                      >
                        {initials(rec.title)}
                      </div>
                      <div style={{ padding: "12px 14px 14px" }}>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>{rec.title}</div>
                        <div className={styles.recWhy}>
                          Liked by {rec.neighbourSupport} similar viewer{rec.neighbourSupport === 1 ? "" : "s"} ·
                          avg {rec.avgNeighbourScore.toFixed(1)}★
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                          {rec.genres.slice(0, 2).map((g) => (
                            <GenreChip key={g} genre={g} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
