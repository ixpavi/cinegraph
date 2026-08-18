import { Link } from "react-router-dom";
import type { MovieSummary } from "../api/types";
import { Poster } from "./Poster";
import { GenreChip } from "./GenreChip";
import styles from "./MovieCard.module.css";

export function MovieCard({ movie }: { movie: MovieSummary }) {
  return (
    <Link to={`/movies/${movie.id}`} className={styles.card}>
      <Poster
        id={movie.id}
        title={movie.title}
        posterUrl={movie.posterUrl}
        className={styles.poster}
        initialsClassName={styles.posterInitials}
      >
        <span className={styles.posterYear}>{movie.year}</span>
      </Poster>
      <div className={styles.body}>
        <h3 className={styles.title}>{movie.title}</h3>
        <div className={styles.meta}>
          <span>{movie.runtime} min</span>
          {movie.avgRating != null && (
            <span className={styles.rating}>
              <StarIcon /> {movie.avgRating.toFixed(1)}
              <span style={{ color: "var(--paper-faint)", fontWeight: 400 }}>
                &nbsp;({movie.ratingCount})
              </span>
            </span>
          )}
        </div>
        <div className={styles.genres}>
          {movie.genres.slice(0, 3).map((g) => (
            <GenreChip key={g} genre={g} />
          ))}
        </div>
      </div>
    </Link>
  );
}

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5 15 9l7 .9-5.1 4.8L18.2 21 12 17.4 5.8 21l1.3-6.3L2 9.9 9 9z" />
    </svg>
  );
}
