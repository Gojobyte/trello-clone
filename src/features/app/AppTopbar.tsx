import { Link } from "@tanstack/react-router";
import { authClient } from "#/lib/auth-client";
import { GlobalSearch } from "#/features/shared/GlobalSearch";
import { BrandMark } from "./MarketingShell";
import { Icon } from "./Icon";

export type BoardViewId = "board" | "calendar" | "timeline" | "dashboard";

const BOARD_VIEWS: Array<{ id: BoardViewId; icon: string; label: string }> = [
  { id: "board", icon: "board", label: "Board" },
  { id: "calendar", icon: "calendar", label: "Calendrier" },
  { id: "timeline", icon: "timeline", label: "Timeline" },
  { id: "dashboard", icon: "dashboard", label: "Dashboard" },
];

export function AppTopbar({
  title,
  crumbs = [],
  boardView,
  onSwitchView,
  onBack,
  boardEmoji,
  boardAccent,
  actions,
  noSidebar = false,
}: {
  title: string;
  crumbs?: string[];
  boardView?: BoardViewId;
  onSwitchView?: (v: BoardViewId) => void;
  onBack?: () => void;
  boardEmoji?: string;
  boardAccent?: string;
  actions?: React.ReactNode;
  noSidebar?: boolean;
}) {
  const { data: session } = authClient.useSession();
  const initial = (session?.user?.name || session?.user?.email || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <header className="topbar">
      {/* Marque, à gauche — alignée sur la sidebar */}
      <Link
        to="/boards"
        className={`topbar-brand${noSidebar ? " topbar-brand--full" : ""}`}
      >
        <BrandMark />
        <span>Flowboard</span>
      </Link>

      <div className="topbar-main">
        {/* Zone gauche : retour, titre, switcher de vues */}
        <div className="row" style={{ gap: 8, flex: "none", minWidth: 0 }}>
          {onBack && (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={onBack}
              style={{ padding: "4px 6px" }}
              title="Retour aux tableaux"
            >
              <Icon
                name="chevron"
                size={14}
                style={{ transform: "rotate(180deg)" }}
              />
            </button>
          )}
          {boardEmoji && (
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                flex: "none",
                background: boardAccent || "var(--text)",
                display: "grid",
                placeItems: "center",
                color: "white",
                fontSize: 10,
              }}
            >
              {boardEmoji}
            </span>
          )}
          <div className="topbar-title" style={{ minWidth: 0 }}>
            {crumbs.map((c) => (
              <span key={c} className="row" style={{ gap: 8 }}>
                <span className="topbar-crumb">{c}</span>
                <span className="topbar-crumb" style={{ opacity: 0.5 }}>
                  /
                </span>
              </span>
            ))}
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </span>
          </div>

          {boardView && onSwitchView && (
            <div
              className="row"
              style={{
                marginLeft: 4,
                padding: 2,
                background: "var(--bg-soft)",
                borderRadius: 6,
                gap: 0,
              }}
            >
              {BOARD_VIEWS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onSwitchView(v.id)}
                  className="row"
                  style={{
                    gap: 5,
                    padding: "3px 8px",
                    border: "none",
                    borderRadius: 4,
                    background:
                      boardView === v.id ? "var(--surface)" : "transparent",
                    boxShadow:
                      boardView === v.id ? "var(--shadow-xs)" : "none",
                    fontSize: 12.5,
                    fontWeight: 500,
                    color:
                      boardView === v.id
                        ? "var(--text)"
                        : "var(--text-muted)",
                    cursor: "pointer",
                    transition: "all 0.12s",
                  }}
                >
                  <Icon name={v.icon} size={13} />
                  {v.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Zone centrale : vraie barre de recherche live */}
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            minWidth: 0,
            padding: "0 12px",
          }}
        >
          <div style={{ width: "100%", maxWidth: 560 }}>
            <GlobalSearch variant="light" />
          </div>
        </div>

        {/* Zone droite : notifications, actions, avatar */}
        <div className="row" style={{ gap: 6, flex: "none" }}>
          <button
            type="button"
            className="btn btn--ghost btn--icon"
            title="Notifications"
          >
            <Icon name="bell" size={15} />
          </button>
          {actions}
          <span
            style={{
              width: 1,
              height: 20,
              background: "var(--border-c)",
              margin: "0 4px",
            }}
          />
          <Link
            to="/settings"
            className="avatar"
            style={{ background: "var(--accent)", textDecoration: "none" }}
            title="Compte"
          >
            {initial}
          </Link>
        </div>
      </div>
    </header>
  );
}
