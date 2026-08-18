export interface MovieSummary {
  id: string;
  title: string;
  year: number;
  runtime: number;
  plot: string;
  posterUrl: string | null;
  genres: string[];
  avgRating: number | null;
  ratingCount: number;
}

export interface SimilarMovie extends MovieSummary {
  sharedConnections: number;
}

export interface CastMember {
  id: string;
  name: string;
  role: string;
}

export interface Director {
  id: string;
  name: string;
}

export interface MovieDetail extends MovieSummary {
  directors: Director[];
  cast: CastMember[];
  studio: string | null;
}

export interface PersonSummary {
  id: string;
  name: string;
}

export interface FilmCredit {
  id: string;
  title: string;
  year: number;
  posterUrl: string | null;
  role?: string;
}

export interface Collaborator {
  person: PersonSummary;
  count: number;
}

export interface PersonDetail extends PersonSummary {
  actedIn: FilmCredit[];
  directed: FilmCredit[];
  collaborators: Collaborator[];
}

export interface PathStep {
  kind: "Person" | "Movie";
  id: string;
  name: string;
}

export interface PathResult {
  steps: PathStep[];
  hops: number;
}

export interface DemoUser {
  id: string;
  name: string;
  ratingCount: number;
}

export interface RatedMovie {
  id: string;
  title: string;
  year: number;
  posterUrl: string | null;
  score: number;
}

export interface Recommendation extends MovieSummary {
  neighbourSupport: number;
  avgNeighbourScore: number;
}

export interface HealthStatus {
  connected: boolean;
  error: string | null;
}
