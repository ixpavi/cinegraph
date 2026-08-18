import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAsync } from "../lib/useAsync";
import { MovieCard } from "../components/MovieCard";
import { GenreChip } from "../components/GenreChip";
import { LoadingState, EmptyState, ErrorState } from "../components/States";
import styles from "./HomePage.module.css";

const PAGE_SIZE = 24;

export function HomePage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => setPage(1), [search, genre]);

  const genres = useAsync(() => api.genres(), []);
  const catalogueTotal = useAsync(() => api.movies({ page: 1 }), []);
  const results = useAsync(() => api.movies({ search, genre, page }), [search, genre, page]);

  const totalPages = results.status === "success" ? Math.max(1, Math.ceil(results.data.total / PAGE_SIZE)) : 1;

  return (
    <div>
      <section className={styles.hero}>
        <p className={styles.kicker}>Graph-native film explorer</p>
        <h1 className={styles.heroTitle}>Every film, cast and connection — mapped, not tabled.</h1>
        <p className={styles.heroSubtitle}>
          Browse {catalogueTotal.status === "success" ? catalogueTotal.data.total : "dozens of"} films and trace
          how they share directors, actors and taste through the underlying graph.
        </p>
        <div className={styles.controls}>
          <label className={styles.searchRow}>
            <SearchIcon className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search titles…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search movies"
            />
          </label>
          {genres.status === "success" && genres.data.length > 0 && (
            <div className={styles.genreRow}>
              <GenreChip genre="All genres" active={genre === ""} onClick={() => setGenre("")} />
              {genres.data.map((g) => (
                <GenreChip key={g} genre={g} active={genre === g} onClick={() => setGenre(g)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {results.status === "loading" && <LoadingState label="Loading films…" />}

      {results.status === "error" && (
        <ErrorState subtitle={results.message} onRetry={results.reload} />
      )}

      {results.status === "success" && results.data.movies.length === 0 && (
        <EmptyState
          title="No films match that search"
          subtitle="Try a different title or clear the genre filter."
        />
      )}

      {results.status === "success" && results.data.movies.length > 0 && (
        <>
          <div className={styles.grid}>
            {results.data.movies.map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageButton}
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span className={styles.pageIndicator}>
                Page {page} of {totalPages}
              </span>
              <button
                className={styles.pageButton}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}
