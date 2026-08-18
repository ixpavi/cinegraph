import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import type { PersonSummary } from "../api/types";
import styles from "./PersonPicker.module.css";

export function PersonPicker({
  placeholder,
  onSelect,
  initialLabel,
}: {
  placeholder: string;
  onSelect: (person: PersonSummary) => void;
  initialLabel?: string;
}) {
  const [query, setQuery] = useState(initialLabel ?? "");
  const [options, setOptions] = useState<PersonSummary[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(initialLabel ?? ""), [initialLabel]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      try {
        const results = await api.people(query);
        setOptions(results);
      } catch {
        setOptions([]);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query, open]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <input
        className={styles.input}
        placeholder={placeholder}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        aria-label={placeholder}
      />
      {open && (
        <div className={styles.dropdown}>
          {options.length === 0 && <div className={styles.empty}>No people found</div>}
          {options.map((p) => (
            <button
              key={p.id}
              type="button"
              className={styles.option}
              onClick={() => {
                setQuery(p.name);
                setOpen(false);
                onSelect(p);
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
