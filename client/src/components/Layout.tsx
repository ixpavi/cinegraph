import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./Layout.module.css";
import { api } from "../api/client";

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink;
}

export function Layout() {
  const [dbUp, setDbUp] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const status = await api.health();
        if (!cancelled) setDbUp(status.connected);
      } catch {
        if (!cancelled) setDbUp(false);
      }
    }
    poll();
    const interval = setInterval(poll, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <NavLink to="/" className={styles.brand}>
          <svg className={styles.brandMark} viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="32" fill="#1e1a15" />
            <circle cx="32" cy="32" r="20" fill="none" stroke="#e2ac54" strokeWidth="3" />
            <circle cx="32" cy="32" r="5" fill="#e2ac54" />
            <circle cx="32" cy="12" r="4.5" fill="#e2ac54" />
            <circle cx="49.3" cy="22" r="4.5" fill="#e2ac54" />
            <circle cx="49.3" cy="42" r="4.5" fill="#e2ac54" />
            <circle cx="32" cy="52" r="4.5" fill="#e2ac54" />
            <circle cx="14.7" cy="42" r="4.5" fill="#e2ac54" />
            <circle cx="14.7" cy="22" r="4.5" fill="#e2ac54" />
          </svg>
          CineGraph
          <span className={styles.brandTag}>a graph-native film explorer</span>
        </NavLink>
        <nav className={styles.nav}>
          <NavLink to="/" end className={navClass}>
            Browse
          </NavLink>
          <NavLink to="/connections" className={navClass}>
            Connections
          </NavLink>
          <NavLink to="/recommendations" className={navClass}>
            For You
          </NavLink>
        </nav>
        <span className={styles.statusBadge} title={dbUp === false ? "Database unreachable" : "Database connected"}>
          <span
            className={`${styles.statusDot} ${dbUp ? styles.statusUp : styles.statusDown}`}
            aria-hidden="true"
          />
          {dbUp === null ? "Checking…" : dbUp ? "Live" : "Offline"}
        </span>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        CineGraph — built on a graph database for the Wexa AI take-home assignment.
      </footer>
    </div>
  );
}
