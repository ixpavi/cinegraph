import { useState, type ReactNode } from "react";
import { posterStyle, initials } from "../lib/poster";

/**
 * Renders a real poster image when one is available, falling back to the
 * generated gradient placeholder if there's no posterUrl or the image
 * fails to load (broken hotlink, offline, etc.) — never a broken-image icon.
 */
export function Poster({
  id,
  title,
  posterUrl,
  className,
  initialsClassName,
  children,
}: {
  id: string;
  title: string;
  posterUrl: string | null;
  className?: string;
  initialsClassName?: string;
  children?: ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  if (posterUrl && !failed) {
    return (
      <div className={className}>
        <img
          src={posterUrl}
          alt={`${title} poster`}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {children}
      </div>
    );
  }

  return (
    <div className={className} style={posterStyle(id)}>
      <span className={initialsClassName}>{initials(title)}</span>
      {children}
    </div>
  );
}
