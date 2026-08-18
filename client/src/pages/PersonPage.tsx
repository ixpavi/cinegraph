import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAsync } from "../lib/useAsync";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import { Poster } from "../components/Poster";
import styles from "./PersonPage.module.css";

export function PersonPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const person = useAsync(() => api.person(id), [id]);

  if (person.status === "loading") return <LoadingState label="Loading filmography…" />;
  if (person.status === "error") return <ErrorState subtitle={person.message} onRetry={person.reload} />;

  const p = person.data;
  const hasFilmography = p.actedIn.length > 0 || p.directed.length > 0;

  return (
    <div>
      <Link to="/" className={styles.backLink}>
        ← Back to browse
      </Link>
      <div className={styles.header}>
        <Poster
          id={p.id}
          title={p.name}
          posterUrl={p.photoUrl ?? null}
          className={styles.avatar}
          initialsClassName={styles.avatarInitials}
        />
        <div>
          <h1 className={styles.name}>{p.name}</h1>
          <p className={styles.subline}>
            {p.directed.length > 0 ? `${p.directed.length} film${p.directed.length === 1 ? "" : "s"} directed · ` : ""}
            {p.actedIn.length} role{p.actedIn.length === 1 ? "" : "s"}
          </p>
          <button className={styles.traceButton} onClick={() => navigate(`/connections?from=${p.id}`)}>
            Trace connection from here →
          </button>
        </div>
      </div>

      {!hasFilmography && (
        <EmptyState title="No credits on file yet" subtitle="This person isn't linked to any films in the current catalogue." />
      )}

      {p.directed.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Directed</h2>
          <div className={styles.filmGrid}>
            {p.directed.map((f) => (
              <Link key={f.id} to={`/movies/${f.id}`} className={styles.filmCard}>
                <Poster
                  id={f.id}
                  title={f.title}
                  posterUrl={f.posterUrl}
                  className={styles.filmPoster}
                  initialsClassName={styles.filmPosterInitials}
                />
                <span>
                  <div className={styles.filmTitle}>{f.title}</div>
                  <div className={styles.filmMeta}>{f.year}</div>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {p.actedIn.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Acted in</h2>
          <div className={styles.filmGrid}>
            {p.actedIn.map((f) => (
              <Link key={f.id} to={`/movies/${f.id}`} className={styles.filmCard}>
                <Poster
                  id={f.id}
                  title={f.title}
                  posterUrl={f.posterUrl}
                  className={styles.filmPoster}
                  initialsClassName={styles.filmPosterInitials}
                />
                <span>
                  <div className={styles.filmTitle}>{f.title}</div>
                  <div className={styles.filmMeta}>
                    {f.year} · {f.role}
                  </div>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {p.collaborators.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Frequent collaborators</h2>
          <div className={styles.collabList}>
            {p.collaborators.map((c) => (
              <Link key={c.person.id} to={`/people/${c.person.id}`} className={styles.collabCard}>
                <Poster
                  id={c.person.id}
                  title={c.person.name}
                  posterUrl={c.person.photoUrl ?? null}
                  className={styles.collabAvatar}
                  initialsClassName={styles.collabAvatarInitials}
                />
                {c.person.name}
                <span className={styles.collabCount}>×{c.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
