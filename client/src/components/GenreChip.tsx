import styles from "./GenreChip.module.css";

export function GenreChip({
  genre,
  active,
  onClick,
}: {
  genre: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      className={active ? `${styles.chip} ${styles.chipActive}` : styles.chip}
      onClick={onClick}
      type={onClick ? "button" : undefined}
    >
      {genre}
    </Tag>
  );
}
