import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { authClient } from "#/lib/auth-client";
import { hexFor } from "#/lib/board-backgrounds";
import { AppShell } from "#/features/app/AppShell";
import { CreateBoardModal } from "#/features/app/CreateBoardModal";
import { Icon } from "#/features/app/Icon";
import { Avatar, AvatarStack } from "#/features/app/primitives";
import { ACTIVITIES, PEOPLE } from "#/features/app/demo-data";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";

export const Route = createFileRoute("/boards/")({ component: BoardsPage });

function BoardsPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const isAuthed = !isPending && !!session?.user;

  useEffect(() => {
    if (!isPending && !session?.user) {
      navigate({ to: "/login" });
    }
  }, [isPending, session, navigate]);

  const boards = useQuery(api.boards.listMine, isAuthed ? {} : "skip");
  const workspaces = useQuery(api.workspaces.listMine, isAuthed ? {} : "skip");

  return (
    <AppShell
      active={{ route: "workspace" }}
      title="Tous les tableaux"
      crumbs={["Mon espace"]}
    >
      <WorkspaceContent
        boards={boards}
        workspaceCount={workspaces?.length ?? 0}
        userName={session?.user?.name ?? "Mon espace"}
      />
    </AppShell>
  );
}

type FilterId = "all" | "starred" | "shared" | "archived";

function WorkspaceContent({
  boards,
  workspaceCount,
  userName,
}: {
  boards: Array<Doc<"boards"> & { _isMember?: boolean }> | undefined;
  workspaceCount: number;
  userName: string;
}) {
  const [filter, setFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const list = boards ?? [];
  const starred = list.filter((b) => b.starred);
  const filtered = list.filter((b) => {
    if (filter === "starred" && !b.starred) return false;
    if (filter === "shared" && !b._isMember) return false;
    if (filter === "archived") return false;
    if (query && !b.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const stats = [
    { label: "Tableaux", value: list.length, trend: "actifs", tone: "neutral" },
    { label: "Favoris", value: starred.length, trend: "épinglés", tone: "good" },
    { label: "Espaces", value: workspaceCount, tone: "neutral", trend: "de travail" },
    { label: "Équipe", value: PEOPLE.length, trend: "membres", tone: "good" },
  ];

  return (
    <div className="view-inner">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 500,
              letterSpacing: "-0.015em",
              margin: 0,
            }}
          >
            {userName}
          </h1>
          <p className="text-muted text-sm" style={{ margin: "4px 0 0" }}>
            {list.length} tableau{list.length > 1 ? "x" : ""} · {PEOPLE.length} membres ·
            plan Premium
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <AvatarStack users={PEOPLE.map((p) => p.id)} max={5} />
          <button type="button" className="btn btn--outline btn--sm">
            <Icon name="plus" size={12} /> Inviter
          </button>
          <span
            style={{ width: 1, height: 20, background: "var(--border-c)", margin: "0 4px" }}
          />
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setCreateOpen(true)}
          >
            <Icon name="plus" size={13} />
            Nouveau tableau
          </button>
        </div>
      </div>

      {/* Bande de statistiques */}
      <div className="ws-stats">
        {stats.map((s) => (
          <div key={s.label} className="ws-stat">
            <span className="ws-stat-label">{s.label}</span>
            <span className="row" style={{ gap: 8, alignItems: "baseline" }}>
              <span className="ws-stat-value">{s.value}</span>
              <span
                className="ws-stat-trend"
                style={{
                  color:
                    s.tone === "good"
                      ? "var(--green)"
                      : s.tone === "bad"
                        ? "var(--red)"
                        : "var(--text-subtle)",
                }}
              >
                {s.trend}
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="ws-grid">
        <div>
          <div className="row" style={{ marginTop: 24, marginBottom: 16, gap: 8 }}>
            <div
              className="row"
              style={{
                flex: 1,
                maxWidth: 320,
                padding: "5px 10px",
                background: "var(--surface)",
                border: "1px solid var(--border-strong)",
                borderRadius: 6,
                gap: 6,
              }}
            >
              <Icon
                name="search"
                size={14}
                stroke={1.6}
                style={{ color: "var(--text-subtle)" }}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un tableau…"
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: 13,
                }}
              />
            </div>
            <div
              className="row"
              style={{ padding: 2, background: "var(--bg-soft)", borderRadius: 6, gap: 0 }}
            >
              {(
                [
                  { id: "all", label: "Tous" },
                  { id: "starred", label: "Favoris" },
                  { id: "shared", label: "Partagés" },
                  { id: "archived", label: "Archivés" },
                ] as Array<{ id: FilterId; label: string }>
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFilter(t.id)}
                  style={{
                    padding: "3px 10px",
                    border: "none",
                    borderRadius: 4,
                    background: filter === t.id ? "var(--surface)" : "transparent",
                    boxShadow: filter === t.id ? "var(--shadow-xs)" : "none",
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: filter === t.id ? "var(--text)" : "var(--text-muted)",
                    cursor: "pointer",
                    transition: "all 0.12s",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Templates */}
          <div style={{ marginTop: 8, marginBottom: 32 }}>
            <div
              className="row"
              style={{ justifyContent: "space-between", marginBottom: 12 }}
            >
              <span
                className="text-subtle text-xs"
                style={{
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight: 500,
                }}
              >
                Démarrer depuis un modèle
              </span>
              <Link
                to="/templates"
                className="text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                Voir tout →
              </Link>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
              }}
            >
              {[
                { n: "Roadmap produit", e: "◆", d: "4 colonnes · pondérée RICE" },
                { n: "Sprint agile", e: "◇", d: "Sprint hebdo · vélocité" },
                { n: "Recrutement", e: "◈", d: "Pipeline candidats" },
                { n: "Vide", e: "+", d: "Partir d'une page blanche" },
              ].map((t) => (
                <button
                  key={t.n}
                  type="button"
                  className="template-card"
                  onClick={() => setCreateOpen(true)}
                >
                  <div className="template-card-mark">
                    <span style={{ fontSize: 14 }}>{t.e}</span>
                  </div>
                  <div className="col" style={{ gap: 2, alignItems: "flex-start" }}>
                    <span style={{ fontWeight: 500, fontSize: 13 }}>{t.n}</span>
                    <span className="text-subtle text-xs">{t.d}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <span
            className="text-subtle text-xs"
            style={{
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 500,
            }}
          >
            Vos tableaux
          </span>

          {boards === undefined ? (
            <div
              className="text-subtle text-sm"
              style={{ padding: "40px 0", textAlign: "center" }}
            >
              Chargement des tableaux…
            </div>
          ) : filtered.length === 0 ? (
            <EmptyBoards onCreate={() => setCreateOpen(true)} hasBoards={list.length > 0} />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
                marginTop: 12,
              }}
            >
              {filtered.map((b) => (
                <Link
                  key={b._id}
                  to="/boards/$boardId"
                  params={{ boardId: b._id }}
                  className="board-card"
                >
                  <div
                    className="board-card-cover"
                    style={{
                      background: `linear-gradient(135deg, ${hexFor(b.color)}, ${hexFor(
                        b.color,
                      )}aa)`,
                    }}
                  >
                    <span style={{ fontSize: 18, color: "white", fontWeight: 600 }}>
                      {b.name.charAt(0).toUpperCase()}
                    </span>
                    {b.starred && (
                      <Icon
                        name="star"
                        size={14}
                        stroke={2}
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          color: "rgba(255,255,255,0.85)",
                        }}
                      />
                    )}
                  </div>
                  <div className="board-card-body">
                    <div
                      style={{
                        fontWeight: 500,
                        fontSize: 14,
                        letterSpacing: "-0.005em",
                      }}
                    >
                      {b.name}
                    </div>
                    <div
                      className="row text-subtle text-xs"
                      style={{ marginTop: 8, gap: 12 }}
                    >
                      <span className="row" style={{ gap: 4 }}>
                        <Icon name="board" size={11} stroke={1.6} />
                        {b._isMember ? "Partagé" : "Tableau"}
                      </span>
                      <span className="spacer" />
                      <span>
                        {formatDistanceToNow(b._creationTime, {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Panneau latéral */}
        <aside className="ws-side">
          <div className="ws-panel">
            <div className="ws-panel-head">
              <span>Activité récente</span>
            </div>
            <div className="col" style={{ gap: 12 }}>
              {ACTIVITIES.slice(0, 5).map((a) => {
                const u = PEOPLE.find((p) => p.id === a.who);
                return (
                  <div
                    key={a.card + a.when}
                    className="row"
                    style={{ gap: 8, alignItems: "flex-start" }}
                  >
                    <Avatar user={a.who} size="sm" />
                    <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.45, minWidth: 0 }}>
                      <span style={{ fontWeight: 500 }}>
                        {u?.name.split(" ")[0]}
                      </span>
                      <span className="text-muted"> {a.action} </span>
                      <span>«&nbsp;{a.card}&nbsp;»</span>
                      <div
                        className="text-subtle text-xs"
                        style={{ marginTop: 2 }}
                      >
                        {a.when}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="ws-panel">
            <div className="ws-panel-head">
              <span>Membres</span>
            </div>
            <div className="col" style={{ gap: 8 }}>
              {PEOPLE.slice(0, 5).map((p, i) => (
                <div key={p.id} className="row" style={{ gap: 10 }}>
                  <Avatar user={p.id} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                    <div className="text-subtle text-xs">{p.role}</div>
                  </div>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: i < 3 ? "var(--green)" : "var(--text-subtle)",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="ws-panel ws-panel--accent">
            <div className="row" style={{ gap: 6, marginBottom: 6 }}>
              <Icon name="spark" size={13} style={{ color: "var(--accent)" }} />
              <span style={{ fontWeight: 500, fontSize: 13 }}>Suggestion</span>
            </div>
            <p
              className="text-muted text-xs"
              style={{ margin: "0 0 10px", lineHeight: 1.5 }}
            >
              Regroupe tes tableaux par espace de travail pour t'y retrouver plus vite
              quand l'équipe grandit.
            </p>
            <Link
              to="/templates"
              className="btn btn--outline btn--sm"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Explorer les modèles
            </Link>
          </div>
        </aside>
      </div>

      {createOpen && <CreateBoardModal onClose={() => setCreateOpen(false)} />}

      <style>{`
        .ws-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 1px; background: var(--border-c);
          border: 1px solid var(--border-c); border-radius: 10px;
          overflow: hidden; margin-top: 20px;
        }
        .ws-stat {
          background: var(--surface); padding: 14px 18px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .ws-stat-label {
          font-size: 11px; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500;
        }
        .ws-stat-value {
          font-size: 24px; font-weight: 500;
          letter-spacing: -0.015em; font-family: var(--font-mono);
        }
        .ws-stat-trend { font-size: 11.5px; font-weight: 500; }
        .ws-grid {
          display: grid; grid-template-columns: 1fr 280px;
          gap: 32px; margin-top: 0;
        }
        @media (max-width: 1100px) {
          .ws-grid { grid-template-columns: 1fr; }
          .ws-side { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        }
        .ws-side {
          display: flex; flex-direction: column; gap: 12px; padding-top: 24px;
        }
        .ws-panel {
          background: var(--surface); border: 1px solid var(--border-c);
          border-radius: 10px; padding: 14px 16px;
        }
        .ws-panel--accent { background: var(--accent-soft); border-color: transparent; }
        .ws-panel-head {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 11.5px; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: 0.05em;
          font-weight: 500; margin-bottom: 14px;
        }
        .template-card {
          display: flex; align-items: center; gap: 12px; padding: 12px 14px;
          background: var(--surface); border: 1px solid var(--border-c);
          border-radius: 10px; text-align: left; cursor: pointer;
          transition: border-color 0.12s, box-shadow 0.12s;
        }
        .template-card:hover { border-color: var(--border-strong); box-shadow: var(--shadow-sm); }
        .template-card-mark {
          width: 32px; height: 32px; border-radius: 6px;
          background: var(--bg-soft); display: grid; place-items: center;
          color: var(--text); flex: none;
        }
        .board-card {
          background: var(--surface); border: 1px solid var(--border-c);
          border-radius: 12px; overflow: hidden; cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
          text-align: left; padding: 0; display: block;
        }
        .board-card:hover {
          border-color: var(--border-strong);
          box-shadow: var(--shadow-md); transform: translateY(-1px);
        }
        .board-card-cover {
          height: 80px; position: relative;
          display: flex; align-items: flex-end; padding: 14px;
        }
        .board-card-body { padding: 14px 16px; }
      `}</style>
    </div>
  );
}

function EmptyBoards({
  onCreate,
  hasBoards,
}: {
  onCreate: () => void;
  hasBoards: boolean;
}) {
  return (
    <div
      style={{
        marginTop: 12,
        border: "1px dashed var(--border-strong)",
        borderRadius: 12,
        padding: "48px 24px",
        textAlign: "center",
        background: "var(--surface)",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: "var(--accent-soft)",
          color: "var(--accent-text)",
          display: "grid",
          placeItems: "center",
          margin: "0 auto 14px",
        }}
      >
        <Icon name="board" size={20} />
      </div>
      <div style={{ fontWeight: 500, fontSize: 15 }}>
        {hasBoards ? "Aucun tableau dans ce filtre" : "Crée ton premier tableau"}
      </div>
      <p
        className="text-muted text-sm"
        style={{ margin: "6px auto 16px", maxWidth: 320 }}
      >
        {hasBoards
          ? "Essaie un autre filtre ou crée un nouveau tableau."
          : "Un tableau organise ton travail en colonnes et en cartes. Commence ici."}
      </p>
      <button type="button" className="btn btn--accent" onClick={onCreate}>
        <Icon name="plus" size={13} /> Nouveau tableau
      </button>
    </div>
  );
}
