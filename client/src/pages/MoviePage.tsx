import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAsync } from "../lib/useAsync";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import { GenreChip } from "../components/GenreChip";
import { MovieCard } from "../components/MovieCard";
import { Poster } from "../components/Poster";
import { posterStyle, initials } from "../lib/poster";
import styles from "./MoviePage.module.css";

export function MoviePage() {
  const { id = "" } = useParams();
  const movie = useAsync(() => api.movie(id), [id]);
  const similar = useAsync(() => api.similarMovies(id), [id]);

  if (movie.status === "loading") return <LoadingState label="Loading film…" />;
  if (movie.status === "error")
    return <ErrorState subtitle={movie.message} onRetry={movie.reload} />;

  const m = movie.data;

  return (
    <div>
      <Link to="/" className={styles.backLink}>
        ← Back to browse
      </Link>
      <div className={styles.hero}>
        <Poster
          id={m.id}
          title={m.title}
          posterUrl={m.posterUrl}
          className={styles.poster}
          initialsClassName={styles.posterInitials}
        />
        <div className={styles.info}>
          <h1 className={styles.title}>{m.title}</h1>
          <div className={styles.metaRow}>
            <span>{m.year}</span>
            <span>·</span>
            <span>{m.runtime} min</span>
            {m.studio && (
              <>
                <span>·</span>
                <span>{m.studio}</span>
              </>
            )}
            {m.avgRating != null && (
              <span className={styles.rating}>
                <StarIcon /> {m.avgRating.toFixed(1)} ({m.ratingCount} ratings)
              </span>
            )}
          </div>
          <div className={styles.genreRow}>
            {m.genres.map((g) => (
              <GenreChip key={g} genre={g} />
            ))}
          </div>
          <p className={styles.plot}>{m.plot}</p>
          {m.directors.length > 0 && (
            <p className={styles.directors}>
              Directed by{" "}
              {m.directors.map((d, i) => (
                <span key={d.id}>
                  <Link to={`/people/${d.id}`}>{d.name}</Link>
                  {i < m.directors.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>

      {m.cast.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Cast</h2>
          <div className={styles.castGrid}>
            {m.cast.map((c) => (
              <Link key={c.id} to={`/people/${c.id}`} className={styles.castCard}>
                <span className={styles.avatar} style={posterStyle(c.id)}>
                  {initials(c.name)}
                </span>
                <span>
                  <div className={styles.castName}>{c.name}</div>
                  <div className={styles.castRole}>{c.role}</div>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>More like this</h2>
        {similar.status === "loading" && <LoadingState label="Finding similar films…" />}
        {similar.status === "error" && <ErrorState subtitle={similar.message} onRetry={similar.reload} />}
        {similar.status === "success" && similar.data.length === 0 && (
          <EmptyState title="No close matches yet" subtitle="This film doesn't share cast or genres with others in the catalogue." />
        )}
        {similar.status === "success" && similar.data.length > 0 && (
          <div className={styles.similarGrid}>
            {similar.data.map((s) => (
              <MovieCard key={s.id} movie={s} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5 15 9l7 .9-5.1 4.8L18.2 21 12 17.4 5.8 21l1.3-6.3L2 9.9 9 9z" />
    </svg>
  );
}
