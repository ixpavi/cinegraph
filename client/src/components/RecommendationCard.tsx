import { Link } from "react-router-dom";
import type { Recommendation } from "../api/types";
import { Poster } from "./Poster";
import { GenreChip } from "./GenreChip";
import styles from "./MovieCard.module.css";

export function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <Link to={`/movies/${rec.id}`} className={styles.card}>
      <Poster
        id={rec.id}
        title={rec.title}
        posterUrl={rec.posterUrl}
        className={styles.poster}
        initialsClassName={styles.posterInitials}
      />
      <div className={styles.body}>
        <h3 className={styles.title}>{rec.title}</h3>
        <p className={styles.meta} style={{ color: "var(--teal)" }}>
          Liked by {rec.neighbourSupport} similar viewer{rec.neighbourSupport === 1 ? "" : "s"} · avg{" "}
          {rec.avgNeighbourScore.toFixed(1)}★
        </p>
        <div className={styles.genres}>
          {rec.genres.slice(0, 2).map((g) => (
            <GenreChip key={g} genre={g} />
          ))}
        </div>
      </div>
    </Link>
  );
}
