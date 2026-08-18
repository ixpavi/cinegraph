import type { ReactNode } from "react";
import styles from "./States.module.css";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <p className={styles.subtitle}>{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}) {
  return (
    <div className={styles.wrap}>
      {icon ?? <ReelIcon className={styles.icon} />}
      <p className={styles.title}>{title}</p>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}

export function ErrorState({
  title = "Something went sideways",
  subtitle,
  onRetry,
}: {
  title?: string;
  subtitle?: string;
  onRetry?: () => void;
}) {
  return (
    <div className={styles.errorWrap}>
      <WarnIcon className={styles.errorIcon} />
      <p className={styles.title}>{title}</p>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      {onRetry && (
        <button className={styles.retryButton} onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

function ReelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="6" r="1.6" />
      <circle cx="17" cy="9.5" r="1.6" />
      <circle cx="17" cy="14.5" r="1.6" />
      <circle cx="12" cy="18" r="1.6" />
      <circle cx="7" cy="14.5" r="1.6" />
      <circle cx="7" cy="9.5" r="1.6" />
    </svg>
  );
}

function WarnIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 3 2 21h20L12 3Z" strokeLinejoin="round" />
      <path d="M12 10v5" strokeLinecap="round" />
      <circle cx="12" cy="18" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
