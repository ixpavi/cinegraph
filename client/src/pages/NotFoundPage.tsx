import { Link } from "react-router-dom";
import { EmptyState } from "../components/States";

export function NotFoundPage() {
  return (
    <div style={{ padding: "var(--space-8) 0" }}>
      <EmptyState title="Nothing here" subtitle="This reel snapped. Head back to the catalogue." />
      <div style={{ textAlign: "center", marginTop: "var(--space-4)" }}>
        <Link to="/" style={{ color: "var(--gold)" }}>
          ← Back to browse
        </Link>
      </div>
    </div>
  );
}
