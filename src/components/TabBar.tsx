import type { Dictionary } from "../i18n/translations";

export type View = "home" | "trainer" | "openings" | "map" | "settings" | "my";

/** The views with a tab of their own. My openings is reached from Home, so
 *  it simply leaves every tab inactive. */
type TabId = Exclude<View, "my">;

interface TabBarProps {
  view: View;
  t: Dictionary;
  onChange: (view: View) => void;
}

// Phone-only bottom tab bar (the top view-switcher stays for wide screens;
// CSS decides which one shows). Monochrome line glyphs tinted by state,
// the way a native tab bar reads — the gold artwork stays on the home
// cards and page heroes where there's room for it.
const ICONS: Record<TabId, React.ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  trainer: (
    <>
      <circle cx="12" cy="6" r="2.5" />
      <path d="M9.5 13.5c0-2.2 1-3.6 2.5-4.5 1.5.9 2.5 2.3 2.5 4.5" />
      <path d="M6 20h12M8 20l1.5-6.5h5L16 20" />
    </>
  ),
  openings: (
    <>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </>
  ),
  map: (
    <>
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
      <path d="M9 3v15M15 6v15" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.8-1.4-1.9-3.2-2.1.8a7.6 7.6 0 0 0-2.6-1.5L14.2 3H9.8l-.4 2.2a7.6 7.6 0 0 0-2.6 1.5l-2.1-.8-1.9 3.2 1.8 1.4a7.6 7.6 0 0 0 0 3l-1.8 1.4 1.9 3.2 2.1-.8a7.6 7.6 0 0 0 2.6 1.5l.4 2.2h4.4l.4-2.2a7.6 7.6 0 0 0 2.6-1.5l2.1.8 1.9-3.2z" />
    </>
  ),
};

export function TabBar({ view, t, onChange }: TabBarProps) {
  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "home", label: t.home.navLabel },
    { id: "trainer", label: t.map.trainerNavLabel },
    { id: "openings", label: t.map.openingsNavLabel },
    { id: "map", label: t.map.navLabel },
    { id: "settings", label: t.settings.navLabel },
  ];

  return (
    <nav className="tab-bar" aria-label="Main">
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          className={"tab-bar-item" + (view === id ? " tab-bar-item-active" : "")}
          aria-current={view === id ? "page" : undefined}
          onClick={() => onChange(id)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {ICONS[id]}
          </svg>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
