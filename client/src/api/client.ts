import type {
  MovieDetail,
  MovieSummary,
  SimilarMovie,
  PersonDetail,
  PersonSummary,
  PathResult,
  DemoUser,
  RatedMovie,
  Recommendation,
  HealthStatus,
} from "./types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`);
  } catch {
    throw new ApiError(
      "Can't reach the CineGraph API. Is the server running and is VITE_API_URL set correctly?",
      0
    );
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || body.error || detail;
    } catch {
      /* body wasn't JSON */
    }
    throw new ApiError(detail, res.status);
  }
  return res.json();
}

export const api = {
  health: () => request<HealthStatus>("/api/health"),

  genres: () => request<string[]>("/api/movies/genres"),

  movies: (params: { search?: string; genre?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.genre) qs.set("genre", params.genre);
    if (params.page) qs.set("page", String(params.page));
    return request<{ movies: MovieSummary[]; total: number; page: number; pageSize: number }>(
      `/api/movies?${qs.toString()}`
    );
  },

  movie: (id: string) => request<MovieDetail>(`/api/movies/${encodeURIComponent(id)}`),

  similarMovies: (id: string) => request<SimilarMovie[]>(`/api/movies/${encodeURIComponent(id)}/similar`),

  people: (search: string) =>
    request<PersonSummary[]>(`/api/people?search=${encodeURIComponent(search)}`),

  person: (id: string) => request<PersonDetail>(`/api/people/${encodeURIComponent(id)}`),

  path: (from: string, to: string) =>
    request<PathResult>(`/api/people/path?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),

  demoUsers: () => request<DemoUser[]>("/api/recommendations/users"),

  userRatings: (id: string) => request<RatedMovie[]>(`/api/recommendations/users/${encodeURIComponent(id)}/ratings`),

  recommendations: (id: string) => request<Recommendation[]>(`/api/recommendations/users/${encodeURIComponent(id)}`),
};
