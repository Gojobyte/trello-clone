import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useState } from "react";
import { authClient } from "#/lib/auth-client";
import { hexFor } from "#/lib/board-backgrounds";
import { api } from "../../../convex/_generated/api";
import { LABELS, PEOPLE } from "./demo-data";
import { Icon } from "./Icon";
import { Avatar } from "./primitives";

// Onglets de l'espace personnel — inspirés de Linear / Asana / Height.
const PERSONAL_NAV = [
  { id: "inbox", label: "Inbox", icon: "inbox", tab: "inbox", badge: "6", accent: true },
  { id: "today", label: "Mon jour", icon: "spark", tab: "today", badge: "3", accent: false },
  { id: "tasks", label: "Mes tâches", icon: "check", tab: "tasks", badge: "8", accent: false },
  { id: "views", label: "Vues", icon: "eye", tab: "views", badge: "4", accent: false },
] as const;

// Outils de gestion de projet.
const TOOL_NAV = [
  { id: "goals", label: "Objectifs", icon: "pin", to: "/goals", badge: "Q2", pro: false },
  { id: "docs", label: "Docs", icon: "docs", to: "/docs", badge: "24", pro: false },
  { id: "sprints", label: "Sprints", icon: "bolt", to: "/sprints", badge: "S-23", pro: false },
  { id: "workload", label: "Charge équipe", icon: "team", to: "/workload", badge: "", pro: false },
  { id: "templates", label: "Templates", icon: "table", to: "/templates", badge: "", pro: false },
  { id: "automations", label: "Automatisations", icon: "spark", to: "/automations", badge: "7", pro: true },
] as const;

const BOARD_SUBS = [
  { id: "board", label: "Board", icon: "board", pro: false },
  { id: "calendar", label: "Calendrier", icon: "calendar", pro: false },
  { id: "timeline", label: "Timeline", icon: "timeline", pro: true },
  { id: "dashboard", label: "Dashboard", icon: "dashboard", pro: true },
] as const;

export type SidebarActive = {
  route: string;
  mwTab?: string;
  boardId?: string;
  boardView?: string;
};

function SbSection({
  title,
  k,
  collapsed,
  onToggle,
  count,
  actions,
  children,
}: {
  title: string;
  k: string;
  collapsed: boolean;
  onToggle: (k: string) => void;
  count?: number;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="sb-sect">
      <div className="sb-sect-h" onClick={() => onToggle(k)}>
        <Icon
          name="chevdown"
          size={11}
          stroke={2}
          style={{
            transform: `rotate(${collapsed ? -90 : 0}deg)`,
            transition: "transform 0.15s",
            color: "var(--text-subtle)",
          }}
        />
        <span>{title}</span>
        {count !== undefined && <span className="sb-sect-count">{count}</span>}
        <span className="spacer" />
        {actions}
      </div>
      {!collapsed && <div className="sb-sect-body">{children}</div>}
    </div>
  );
}

export function AppSidebar({ active }: { active: SidebarActive }) {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const isAuthed = !!session?.user;
  const boards = useQuery(api.boards.listMine, isAuthed ? {} : "skip") ?? [];

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("gp_sidebar_collapsed") || "{}");
    } catch {
      return {};
    }
  });
  const toggle = (k: string) => {
    const next = { ...collapsed, [k]: !collapsed[k] };
    setCollapsed(next);
    try {
      localStorage.setItem("gp_sidebar_collapsed", JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };
  const isOpen = (k: string, def = true) =>
    collapsed[k] === undefined ? def : !collapsed[k];

  const userName = session?.user?.name || "Mon espace";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <aside className="sidebar">
      {/* Sélecteur d'espace de travail */}
      <button
        className="ws-switcher"
        type="button"
        onClick={() => navigate({ to: "/boards" })}
      >
        <span className="workspace-switcher-mark">{userInitial}</span>
        <span style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
          <span
            style={{
              display: "block",
              fontWeight: 500,
              fontSize: 13,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {userName}
          </span>
          <span style={{ display: "block", fontSize: 11, color: "var(--text-subtle)" }}>
            Plan Premium · {boards.length} tableaux
          </span>
        </span>
        <Icon name="chevdown" size={13} stroke={1.8} style={{ color: "var(--text-subtle)" }} />
      </button>

      <div className="sb-scroll">
        {/* Espace personnel */}
        {PERSONAL_NAV.map((n) => (
          <Link
            key={n.id}
            to="/my-work"
            search={{ tab: n.tab }}
            className={`sidebar-item ${
              active.route === "my-work" && active.mwTab === n.tab ? "active" : ""
            }`}
          >
            <Icon name={n.icon} size={15} className="sidebar-item-icon" />
            {n.label}
            <span
              className="sidebar-item-badge"
              style={
                n.accent
                  ? {
                      background: "var(--accent)",
                      color: "white",
                      padding: "0 5px",
                      borderRadius: 8,
                      fontSize: 10,
                      fontFamily: "var(--font-sans)",
                      fontWeight: 600,
                    }
                  : undefined
              }
            >
              {n.badge}
            </span>
          </Link>
        ))}

        {/* Outils */}
        <SbSection title="Outils" k="tools" collapsed={!isOpen("tools")} onToggle={toggle}>
          {TOOL_NAV.map((n) => (
            <Link
              key={n.id}
              to={n.to}
              className={`sidebar-item ${active.route === n.id ? "active" : ""}`}
            >
              <Icon name={n.icon} size={15} className="sidebar-item-icon" />
              {n.label}
              {n.badge && <span className="sidebar-item-badge">{n.badge}</span>}
              {n.pro && <span className="sidebar-pill">PRO</span>}
            </Link>
          ))}
        </SbSection>

        {/* Boards — tableaux réels de l'utilisateur */}
        <SbSection
          title="Boards"
          k="boards"
          count={boards.length}
          collapsed={!isOpen("boards")}
          onToggle={toggle}
          actions={
            <Link
              to="/boards"
              title="Tous les tableaux"
              className="sb-icon-btn"
              onClick={(e) => e.stopPropagation()}
            >
              <Icon name="plus" size={12} stroke={1.8} />
            </Link>
          }
        >
          <Link
            to="/boards"
            className={`sidebar-item ${active.route === "workspace" ? "active" : ""}`}
          >
            <Icon name="folder" size={14} className="sidebar-item-icon" />
            Tous les boards
            <span className="sidebar-item-badge">{boards.length}</span>
          </Link>
          {boards.slice(0, 8).map((b) => {
            const isActive = active.boardId === b._id;
            return (
              <div key={b._id}>
                <Link
                  to="/boards/$boardId"
                  params={{ boardId: b._id }}
                  className={`sidebar-item sb-board ${isActive ? "active" : ""}`}
                >
                  <span
                    className="sb-board-mark"
                    style={{ background: hexFor(b.color) }}
                  >
                    {b.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="sb-board-name">{b.name}</span>
                  {b.starred && (
                    <Icon
                      name="star"
                      size={11}
                      stroke={1.8}
                      style={{ color: "var(--text-subtle)" }}
                    />
                  )}
                </Link>
                {isActive && (
                  <div className="sb-board-subs">
                    {BOARD_SUBS.map((s) => (
                      <Link
                        key={s.id}
                        to="/boards/$boardId"
                        params={{ boardId: b._id }}
                        search={{ view: s.id }}
                        className={`sidebar-item ${
                          (active.boardView || "board") === s.id ? "active" : ""
                        }`}
                        style={{ paddingLeft: 38, fontSize: 12.5 }}
                      >
                        <Icon name={s.icon} size={12} className="sidebar-item-icon" />
                        {s.label}
                        {s.pro && <span className="sidebar-pill">PRO</span>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </SbSection>

        {/* Équipe */}
        <SbSection
          title="Équipe"
          k="team"
          count={PEOPLE.length}
          collapsed={!isOpen("team", false)}
          onToggle={toggle}
        >
          {PEOPLE.slice(0, 5).map((p, i) => {
            const online = i < 3;
            return (
              <button key={p.id} className="sidebar-item sb-member" type="button">
                <span style={{ position: "relative", flex: "none" }}>
                  <Avatar user={p.id} size="sm" />
                  <span
                    className="sb-status"
                    style={{ background: online ? "var(--green)" : "var(--text-subtle)" }}
                  />
                </span>
                <span className="sb-member-name">{p.name.split(" ")[0]}</span>
                <span className="text-subtle text-xs">
                  {online ? "En ligne" : i === 3 ? "2h" : "hier"}
                </span>
              </button>
            );
          })}
        </SbSection>

        {/* Étiquettes */}
        <SbSection
          title="Étiquettes"
          k="labels"
          collapsed={!isOpen("labels", false)}
          onToggle={toggle}
        >
          {Object.entries(LABELS).map(([id, l]) => (
            <button key={id} className="sidebar-item" type="button">
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  flex: "none",
                  background: l.fg,
                }}
              />
              {l.name}
            </button>
          ))}
        </SbSection>
      </div>

      {/* Dock bas */}
      <div className="sb-dock">
        <div className="sb-storage">
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
              Stockage
            </span>
            <span
              style={{
                fontSize: 10.5,
                color: "var(--text-subtle)",
                fontFamily: "var(--font-mono)",
              }}
            >
              2.4 / 10 Go
            </span>
          </div>
          <div className="sb-storage-bar">
            <div
              style={{ width: "24%", background: "var(--accent)", height: "100%", borderRadius: 2 }}
            />
          </div>
        </div>

        <Link to="/pricing" className="sidebar-item">
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              flex: "none",
              background: "linear-gradient(135deg, var(--accent), oklch(0.62 0.18 295))",
              display: "grid",
              placeItems: "center",
              color: "white",
              fontSize: 9,
              fontWeight: 600,
            }}
          >
            ✦
          </span>
          Passer à Premium
        </Link>
        <Link
          to="/settings"
          className={`sidebar-item ${active.route === "settings" ? "active" : ""}`}
        >
          <Icon name="settings" size={15} className="sidebar-item-icon" />
          Réglages
          <span className="kbd" style={{ marginLeft: "auto", fontSize: 10, padding: "0 4px" }}>
            ⌘,
          </span>
        </Link>
      </div>
    </aside>
  );
}
