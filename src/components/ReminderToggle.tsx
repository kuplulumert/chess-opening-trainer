interface ReminderToggleProps {
  enabled: boolean;
  label: string;
  onToggle: () => void;
}

// Deliberately the same small, label-less corner control as ThemeToggle —
// a review reminder is a set-once preference, not something that deserves
// its own labeled row competing with the actual actions on Home.
export function ReminderToggle({ enabled, label, onToggle }: ReminderToggleProps) {
  return (
    <button
      type="button"
      className={"icon-toggle" + (enabled ? " icon-toggle-active" : "")}
      onClick={onToggle}
      aria-label={label}
      aria-pressed={enabled}
      title={label}
    >
      {enabled ? (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8.5a6 6 0 0 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5Z" />
            <path d="M13.7 19.5a2 2 0 0 1-3.4 0" />
          </g>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13.7 19.5a2 2 0 0 1-3.4 0" />
            <path d="M17.9 13.4A15.4 15.4 0 0 1 18 8.5" />
            <path d="M7 6.6a6 6 0 0 0-1 1.9c0 6-2.5 7.5-2.5 7.5h13" />
            <path d="M9.2 4.3A6 6 0 0 1 18 8.5" />
            <line x1="3.5" y1="3.5" x2="20.5" y2="20.5" />
          </g>
        </svg>
      )}
    </button>
  );
}
