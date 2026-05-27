import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { authClient } from "#/lib/auth-client";
import { AppSidebar, type SidebarActive } from "./AppSidebar";
import { AppTopbar, type BoardViewId } from "./AppTopbar";
import { CommandPalette } from "./CommandPalette";
import { ShortcutsHelp } from "./ShortcutsHelp";

// Destinations du préfixe « g » (style Linear).
const GO_TARGETS: Record<string, { to: string; search?: Record<string, string> }> = {
  b: { to: "/boards" },
  i: { to: "/my-work", search: { tab: "inbox" } },
  t: { to: "/my-work", search: { tab: "tasks" } },
  o: { to: "/goals" },
  d: { to: "/docs" },
  s: { to: "/sprints" },
  ",": { to: "/settings" },
};

// Shell de l'application : sidebar (optionnelle) + topbar + zone de vue.
// Reprend la structure du design gestion-pro.
export function AppShell({
  active,
  title,
  crumbs,
  noSidebar = false,
  boardView,
  onSwitchView,
  onBack,
  boardEmoji,
  boardAccent,
  actions,
  children,
}: {
  active: SidebarActive;
  title: string;
  crumbs?: string[];
  noSidebar?: boolean;
  boardView?: BoardViewId;
  onSwitchView?: (v: BoardViewId) => void;
  onBack?: () => void;
  boardEmoji?: string;
  boardAccent?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [cmdOpen, setCmdOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  // Mémorise un « g » récent pour les raccourcis de navigation à deux touches.
  const goPendingRef = useRef(false);

  // Garde d'authentification : toute page applicative redirige vers /login.
  useEffect(() => {
    if (!isPending && !session?.user) {
      navigate({ to: "/login" });
    }
  }, [isPending, session, navigate]);

  useEffect(() => {
    let goTimer: ReturnType<typeof setTimeout> | undefined;

    const h = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K : palette de commandes.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen(true);
        return;
      }
      // Ignore les raccourcis quand on tape dans un champ.
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // « ? » : panneau d'aide des raccourcis.
      if (e.key === "?") {
        e.preventDefault();
        setHelpOpen((v) => !v);
        return;
      }
      // Séquence « g » puis une touche de destination.
      if (goPendingRef.current) {
        goPendingRef.current = false;
        if (goTimer) clearTimeout(goTimer);
        const target = GO_TARGETS[e.key.toLowerCase()];
        if (target) {
          e.preventDefault();
          navigate(target as never);
        }
        return;
      }
      if (e.key.toLowerCase() === "g") {
        goPendingRef.current = true;
        if (goTimer) clearTimeout(goTimer);
        goTimer = setTimeout(() => {
          goPendingRef.current = false;
        }, 1200);
      }
    };

    window.addEventListener("keydown", h);
    return () => {
      window.removeEventListener("keydown", h);
      if (goTimer) clearTimeout(goTimer);
    };
  }, [navigate]);

  return (
    <div className="gp-app">
      {/* Header en pleine largeur, tout en haut */}
      <AppTopbar
        title={title}
        crumbs={crumbs}
        boardView={boardView}
        onSwitchView={onSwitchView}
        onBack={onBack}
        boardEmoji={boardEmoji}
        boardAccent={boardAccent}
        actions={actions}
        noSidebar={noSidebar}
      />
      {/* Sous le header : sidebar + zone de contenu */}
      <div className="gp-body">
        {!noSidebar && <AppSidebar active={active} />}
        <main className="gp-main">
          <div
            className="gp-view view-enter"
            key={active.route + (active.mwTab || "")}
          >
            {children}
          </div>
        </main>
      </div>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      {helpOpen && <ShortcutsHelp onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
