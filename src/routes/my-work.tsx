// ============ MY WORK : Inbox / Mon jour / Mes tâches / Vues ============
import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { AppShell } from "#/features/app/AppShell";
import { Icon } from "#/features/app/Icon";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/my-work")({
  component: MyWorkRoute,
  validateSearch: (s: Record<string, unknown>) => ({
    tab: typeof s.tab === "string" ? s.tab : "inbox",
  }),
});

function MyWorkRoute() {
  const { tab } = Route.useSearch();
  const titleMap: Record<string, string> = {
    inbox: "Inbox",
    today: "Mon jour",
    tasks: "Mes tâches",
    views: "Vues",
  };
  return (
    <AppShell active={{ route: "my-work", mwTab: tab }} title={titleMap[tab] ?? "Inbox"}>
      <MyWorkContent tab={tab} />
    </AppShell>
  );
}

// ============ TYPES ============

type ConvexCard = {
  _id: Id<"cards">;
  title: string;
  boardId: Id<"boards">;
  boardName: string;
  boardColor: string;
  listName: string;
  completed: boolean;
  dueDate: number | null;
  checklistDone: number;
  checklistTotal: number;
  labelCount: number;
};

type ConvexNotification = {
  _id: Id<"notifications">;
  _creationTime: number;
  userId: string;
  type: string;
  boardId?: Id<"boards">;
  cardId?: Id<"cards">;
  actorName: string;
  message: string;
  read: boolean;
  boardName?: string;
  cardTitle?: string;
};

type ConvexSavedView = {
  _id: Id<"savedViews">;
  name: string;
  icon: string;
  filterPriority?: string;
  filterDue?: string;
};

// ============ HELPERS ============

function fmtDueDate(ts: number | null): { label: string; tone: string } | null {
  if (!ts) return null;
  const now = Date.now();
  const diff = ts - now;
  const days = Math.floor(diff / 86400000);
  if (diff < 0) {
    const overdueDays = Math.abs(days);
    return {
      label: overdueDays === 0 ? "Aujourd'hui" : `${overdueDays}j de retard`,
      tone: "var(--red)",
    };
  }
  if (days === 0) return { label: "Aujourd'hui", tone: "var(--amber)" };
  if (days === 1) return { label: "Demain", tone: "var(--amber)" };
  if (days <= 7) return { label: `Dans ${days}j`, tone: "var(--text-subtle)" };
  const d = new Date(ts);
  return {
    label: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
    tone: "var(--text-subtle)",
  };
}

// ============ MAIN CONTENT ============

function MyWorkContent({ tab }: { tab: string }) {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  const cards = useQuery(
    api.myWork.myCards,
    session?.user ? {} : "skip"
  ) as ConvexCard[] | undefined;

  const notifications = useQuery(
    api.notifications.listMine,
    session?.user ? {} : "skip"
  ) as ConvexNotification[] | undefined;

  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const now = Date.now();

  const cardsWithDue = cards?.filter((c) => c.dueDate !== null) ?? [];
  const overdue = cardsWithDue.filter(
    (c) => !c.completed && c.dueDate! < now
  );
  const dueToday = cardsWithDue.filter((c) => {
    if (c.completed || c.dueDate! < now) return false;
    return c.dueDate! - now <= 86400000;
  });
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const tabs: Array<{ id: string; label: string; count: number; accent?: boolean }> = [
    { id: "inbox", label: "Inbox", count: unreadCount, accent: true },
    { id: "today", label: "Mon jour", count: overdue.length + dueToday.length },
    {
      id: "tasks",
      label: "Mes tâches",
      count: cards?.filter((c) => !c.completed).length ?? 0,
    },
    { id: "views", label: "Vues", count: 0 },
  ];

  const active = ["inbox", "today", "tasks", "views"].includes(tab) ? tab : "inbox";

  const headingH: Record<string, string> = {
    inbox: "Inbox",
    today: "Mon jour",
    tasks: "Mes tâches",
    views: "Vues sauvegardées",
  };
  const headingSub: Record<string, string> = {
    inbox:
      unreadCount > 0
        ? `${unreadCount} non lu${unreadCount > 1 ? "s" : ""} · mentions, assignations, échéances et activités groupés`
        : "Inbox vide · tout est à jour",
    today:
      `${overdue.length} en retard, ${dueToday.length} pour aujourd'hui`,
    tasks:
      cards === undefined
        ? "Chargement…"
        : `${cards.length} carte${cards.length !== 1 ? "s" : ""} assignée${cards.length !== 1 ? "s" : ""}`,
    views: "Filtres et requêtes croisées que vous avez épinglés",
  };

  return (
    <div
      className="view-inner"
      style={{ maxWidth: 980, margin: "0 auto", padding: "32px 32px 60px" }}
    >
      <div>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 500,
            letterSpacing: "-0.015em",
            margin: 0,
          }}
        >
          {headingH[active]}
        </h1>
        <p className="text-muted text-sm" style={{ margin: "4px 0 0" }}>
          {headingSub[active]}
        </p>
      </div>

      <div
        className="row"
        style={{
          marginTop: 24,
          gap: 4,
          borderBottom: "1px solid var(--border)",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => navigate({ to: "/my-work", search: { tab: t.id } })}
            style={{
              padding: "8px 4px",
              marginRight: 18,
              marginBottom: -1,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              color: active === t.id ? "var(--text)" : "var(--text-muted)",
              borderBottom:
                active === t.id
                  ? "2px solid var(--text)"
                  : "2px solid transparent",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  background:
                    t.accent && active !== t.id
                      ? "var(--accent)"
                      : active === t.id
                        ? "var(--text)"
                        : "var(--bg-soft)",
                  color:
                    (t.accent && active !== t.id) || active === t.id
                      ? "var(--bg)"
                      : "var(--text-muted)",
                  padding: "0 5px",
                  borderRadius: 3,
                  fontWeight: 600,
                }}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
        <span className="spacer" />
        {active === "inbox" && (
          <button
            className="btn btn--ghost btn--sm"
            style={{ marginBottom: 6 }}
            onClick={() => {
              markAllAsRead()
                .then(() => toast.success("Toutes les notifications marquées comme lues"))
                .catch(() => toast.error("Erreur lors de la mise à jour"));
            }}
          >
            <Icon name="check" size={12} /> Tout marquer comme lu
          </button>
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        {active === "inbox" && (
          <InboxView notifications={notifications} />
        )}
        {active === "today" && (
          <TodayView cards={cards} now={now} />
        )}
        {active === "tasks" && (
          <TasksView cards={cards} />
        )}
        {active === "views" && (
          <ViewsTab cards={cards} />
        )}
      </div>

      <style>{`
        .mw-section { margin-top: 28px; }
        .mw-section-head {
          display: flex; align-items: center; gap: 8px;
          font-size: 11.5px; font-weight: 500;
          color: var(--text-muted); text-transform: uppercase;
          letter-spacing: 0.05em; margin-bottom: 10px;
        }
        .mw-section-head .pill {
          font-family: var(--font-mono); font-size: 10.5px;
          background: var(--bg-soft); padding: 0 5px; border-radius: 3px;
          color: var(--text-muted); text-transform: none; letter-spacing: 0;
        }
        .mw-row {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          cursor: pointer; transition: border-color 0.12s, box-shadow 0.12s;
        }
        .mw-row + .mw-row { margin-top: 4px; }
        .mw-row:hover { border-color: var(--border-strong); box-shadow: var(--shadow-xs); }
        .mw-row-board {
          font-size: 11px; color: var(--text-subtle);
          font-family: var(--font-mono);
          padding: 2px 6px; background: var(--bg-soft);
          border-radius: 3px; flex: none;
        }
        .mw-row-title { flex: 1; font-size: 13.5px; min-width: 0; }
        .mw-row-title span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .mw-row-meta { display: flex; align-items: center; gap: 10px; flex: none; color: var(--text-subtle); font-size: 11.5px; }
      `}</style>
    </div>
  );
}

// ============ INBOX ============

const INBOX_KIND_META: Record<string, { icon: string; label: string; tone: string }> = {
  "mention.comment": { icon: "chat", label: "Mention", tone: "var(--accent)" },
  "card.assigned": { icon: "user", label: "Assignée", tone: "var(--blue)" },
  "card.unassigned": { icon: "user", label: "Désassignée", tone: "var(--text-subtle)" },
  "invitation.received": { icon: "team", label: "Invitation", tone: "var(--green)" },
  due: { icon: "clock", label: "Échéance", tone: "var(--amber)" },
  comment: { icon: "chat", label: "Commentaire", tone: "var(--text-subtle)" },
  done: { icon: "check", label: "Terminée", tone: "var(--green)" },
};

function kindMeta(type: string): { icon: string; label: string; tone: string } {
  return (
    INBOX_KIND_META[type] ?? {
      icon: "spark",
      label: type,
      tone: "var(--text-subtle)",
    }
  );
}

function fmtRelative(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "à l'instant";
  if (diff < 3600000) return `il y a ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `il y a ${Math.floor(diff / 3600000)}h`;
  const days = Math.floor(diff / 86400000);
  if (days === 1) return "hier";
  return `il y a ${days} j`;
}

function InboxView({ notifications }: { notifications: ConvexNotification[] | undefined }) {
  const [filter, setFilter] = useState("all");
  const markAsRead = useMutation(api.notifications.markAsRead);

  if (notifications === undefined) {
    return <p className="text-muted text-sm">Chargement…</p>;
  }

  if (notifications.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px 0",
          color: "var(--text-muted)",
        }}
      >
        <Icon name="check" size={32} stroke={1.2} />
        <p style={{ marginTop: 12, fontSize: 14 }}>Inbox vide · tout est à jour</p>
      </div>
    );
  }

  const counts = {
    all: notifications.length,
    unread: notifications.filter((n) => !n.read).length,
    mention: notifications.filter((n) => n.type === "mention.comment").length,
    assigned: notifications.filter(
      (n) => n.type === "card.assigned" || n.type === "invitation.received"
    ).length,
    activity: notifications.filter(
      (n) => n.type === "done" || n.type === "comment"
    ).length,
  };

  const filters: Array<[string, string, number]> = [
    ["all", "Tout", counts.all],
    ["unread", "Non lus", counts.unread],
    ["mention", "Mentions", counts.mention],
    ["assigned", "Assignations", counts.assigned],
    ["activity", "Activité", counts.activity],
  ];

  const visible = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    if (filter === "mention") return n.type === "mention.comment";
    if (filter === "assigned")
      return n.type === "card.assigned" || n.type === "invitation.received";
    if (filter === "activity") return n.type === "done" || n.type === "comment";
    return true;
  });

  return (
    <>
      <div className="row" style={{ gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
        {filters.map(([id, label, count]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            style={{
              padding: "4px 10px",
              borderRadius: 100,
              border: "1px solid",
              background: filter === id ? "var(--text)" : "var(--surface)",
              color: filter === id ? "var(--bg)" : "var(--text-muted)",
              borderColor: filter === id ? "var(--text)" : "var(--border)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {label}
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                background:
                  filter === id ? "rgba(255,255,255,0.18)" : "var(--bg-soft)",
                color: filter === id ? "var(--bg)" : "var(--text-subtle)",
                padding: "0 5px",
                borderRadius: 3,
              }}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      <div className="col" style={{ gap: 1 }}>
        {visible.map((item) => {
          const k = kindMeta(item.type);
          return (
            <div
              key={item._id}
              className={`inbox-item ${item.read ? "" : "inbox-item--unread"}`}
              onClick={() => {
                if (!item.read) {
                  markAsRead({ notificationId: item._id }).catch(() =>
                    toast.error("Erreur lors de la mise à jour")
                  );
                }
              }}
            >
              <span
                className="inbox-dot"
                style={{ background: item.read ? "transparent" : k.tone }}
              />
              <span
                className="inbox-kind-icon"
                style={{ background: "var(--bg-soft)", color: k.tone }}
              >
                <Icon name={k.icon} size={13} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                  <span
                    className="inbox-kind"
                    style={{ color: k.tone, background: "var(--bg-soft)" }}
                  >
                    <Icon name={k.icon} size={10} stroke={1.8} /> {k.label}
                  </span>
                  {item.cardTitle && (
                    <span className="inbox-card">{item.cardTitle}</span>
                  )}
                  {item.boardName && (
                    <span className="mw-row-board">{item.boardName}</span>
                  )}
                  <span className="spacer" />
                  <span className="text-subtle text-xs">
                    {typeof item._creationTime === "number"
                      ? fmtRelative(item._creationTime)
                      : ""}
                  </span>
                </div>
                <p className="inbox-text">
                  {item.actorName && (
                    <span style={{ fontWeight: 500 }}>{item.actorName} </span>
                  )}
                  {item.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .inbox-item {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 12px 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-bottom-width: 0;
          cursor: pointer; transition: background 0.12s;
        }
        .inbox-item:first-child { border-top-left-radius: 10px; border-top-right-radius: 10px; }
        .inbox-item:last-child { border-bottom-width: 1px; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px; }
        .inbox-item:hover { background: var(--bg-soft); }
        .inbox-item--unread { background: var(--accent-soft); border-color: transparent; }
        .inbox-item--unread + .inbox-item--unread { border-top: 1px solid rgba(255,255,255,0.4); }
        .inbox-dot {
          width: 7px; height: 7px; border-radius: 50%;
          flex: none; margin-top: 8px;
        }
        .inbox-kind-icon {
          width: 24px; height: 24px; border-radius: 50%;
          display: grid; place-items: center; flex: none;
        }
        .inbox-kind {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 1px 7px; border-radius: 100px;
          font-size: 10.5px; font-weight: 500;
          text-transform: uppercase; letter-spacing: 0.03em;
        }
        .inbox-card {
          font-size: 13px; font-weight: 500;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 380px;
        }
        .inbox-text {
          margin: 6px 0 0; font-size: 13px;
          color: var(--text-muted); line-height: 1.5;
        }
      `}</style>
    </>
  );
}

// ============ TODAY ============

function TodayView({
  cards,
  now,
}: {
  cards: ConvexCard[] | undefined;
  now: number;
}) {
  if (cards === undefined) {
    return <p className="text-muted text-sm">Chargement…</p>;
  }

  const overdue = cards.filter(
    (c) => !c.completed && c.dueDate !== null && c.dueDate < now
  );
  const dueToday = cards.filter((c) => {
    if (c.completed || c.dueDate === null || c.dueDate < now) return false;
    return c.dueDate - now <= 86400000;
  });
  const dueWeek = cards.filter((c) => {
    if (c.completed || c.dueDate === null || c.dueDate < now) return false;
    const diff = c.dueDate - now;
    return diff > 86400000 && diff <= 7 * 86400000;
  });
  const done = cards.filter((c) => c.completed);

  return (
    <>
      <div className="today-hero">
        <div>
          <div
            className="text-subtle text-xs"
            style={{
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontWeight: 500,
            }}
          >
            Focus du jour
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              marginTop: 6,
            }}
          >
            {overdue.length + dueToday.length}
            <span className="text-subtle"> cartes à traiter</span>
          </div>
          <p className="text-muted" style={{ margin: "6px 0 0", fontSize: 13 }}>
            Sortez les bloquants en priorité, puis les échéances. Le reste peut attendre demain.
          </p>
        </div>
        <div className="today-hero-stats">
          <div>
            <span className="today-hero-stat-v" style={{ color: "var(--red)" }}>
              {overdue.length}
            </span>
            <span className="text-subtle text-xs">en retard</span>
          </div>
          <div>
            <span className="today-hero-stat-v">{dueToday.length}</span>
            <span className="text-subtle text-xs">aujourd'hui</span>
          </div>
          <div>
            <span className="today-hero-stat-v">{dueWeek.length}</span>
            <span className="text-subtle text-xs">cette semaine</span>
          </div>
        </div>
      </div>

      {overdue.length > 0 && (
        <Section title="En retard" tone="red" count={overdue.length}>
          {overdue.map((c) => (
            <ConvexCardRow key={c._id} card={c} />
          ))}
        </Section>
      )}
      {dueToday.length > 0 && (
        <Section title="Aujourd'hui" count={dueToday.length}>
          {dueToday.map((c) => (
            <ConvexCardRow key={c._id} card={c} />
          ))}
        </Section>
      )}
      {dueWeek.length > 0 && (
        <Section title="Cette semaine" count={dueWeek.length}>
          {dueWeek.map((c) => (
            <ConvexCardRow key={c._id} card={c} />
          ))}
        </Section>
      )}
      {done.length > 0 && (
        <Section title="Terminées" count={done.length}>
          {done.map((c) => (
            <ConvexCardRow key={c._id} card={c} />
          ))}
        </Section>
      )}
      {overdue.length === 0 && dueToday.length === 0 && dueWeek.length === 0 && done.length === 0 && (
        <p className="text-muted text-sm" style={{ marginTop: 24 }}>
          Aucune carte avec échéance.
        </p>
      )}

      <style>{`
        .today-hero {
          display: flex; gap: 24px; align-items: center;
          padding: 20px 24px; margin-bottom: 24px;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px;
        }
        .today-hero > div:first-child { flex: 1; }
        .today-hero-stats {
          display: flex; gap: 28px;
          padding-left: 24px;
          border-left: 1px solid var(--border);
        }
        .today-hero-stats > div {
          display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
        }
        .today-hero-stat-v {
          font-family: var(--font-mono); font-size: 22px;
          font-weight: 500; line-height: 1;
        }
      `}</style>
    </>
  );
}

function Section({
  title,
  count,
  tone,
  children,
}: {
  title: string;
  count: number;
  tone?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mw-section">
      <div className="mw-section-head">
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: tone === "red" ? "var(--red)" : "var(--text-subtle)",
          }}
        />
        {title}
        <span className="pill">{count}</span>
      </div>
      {children}
    </div>
  );
}

function ConvexCardRow({ card }: { card: ConvexCard }) {
  const navigate = useNavigate();
  const due = fmtDueDate(card.dueDate);
  return (
    <div
      className="mw-row"
      onClick={() =>
        navigate({
          to: "/boards/$boardId",
          params: { boardId: card.boardId },
        })
      }
    >
      <span className="mw-row-board">{card.boardName}</span>
      <div className="mw-row-title">
        <span
          style={{
            textDecoration: card.completed ? "line-through" : "none",
            color: card.completed ? "var(--text-muted)" : undefined,
          }}
        >
          {card.title}
        </span>
      </div>
      <div className="mw-row-meta">
        <span className="text-subtle text-xs">{card.listName}</span>
        {card.checklistTotal > 0 && (
          <span className="row" style={{ gap: 3 }}>
            <Icon name="check" size={11} stroke={1.8} /> {card.checklistDone}/
            {card.checklistTotal}
          </span>
        )}
        {due && (
          <span className="row" style={{ gap: 3, color: due.tone }}>
            <Icon name="clock" size={11} stroke={1.6} /> {due.label}
          </span>
        )}
      </div>
    </div>
  );
}

// ============ TASKS (tableau) ============

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 14px",
  fontSize: 11.5,
  fontWeight: 500,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};
const tdStyle: React.CSSProperties = {
  padding: "10px 14px",
  verticalAlign: "middle",
};

function TasksView({ cards }: { cards: ConvexCard[] | undefined }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("open");

  if (cards === undefined) {
    return <p className="text-muted text-sm">Chargement…</p>;
  }

  const filtered = cards.filter((c) => {
    if (filter === "all") return true;
    if (filter === "open") return !c.completed;
    if (filter === "done") return c.completed;
    return true;
  });

  return (
    <>
      <div className="row" style={{ gap: 4, marginBottom: 16 }}>
        {(
          [
            ["open", "À faire"],
            ["done", "Terminé"],
            ["all", "Toutes"],
          ] as [string, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            style={{
              padding: "4px 10px",
              borderRadius: 100,
              border: "1px solid",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 500,
              borderColor: filter === id ? "var(--text)" : "var(--border)",
              background: filter === id ? "var(--text)" : "var(--surface)",
              color: filter === id ? "var(--bg)" : "var(--text-muted)",
            }}
          >
            {label}
          </button>
        ))}
        <span className="spacer" />
        <span className="text-subtle text-xs">{filtered.length} cartes</span>
      </div>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--bg-soft)" }}>
              <th style={thStyle}>Carte</th>
              <th style={{ ...thStyle, width: 140 }}>Tableau</th>
              <th style={{ ...thStyle, width: 130 }}>Liste</th>
              <th style={{ ...thStyle, width: 110 }}>Avancement</th>
              <th style={{ ...thStyle, width: 120 }}>Échéance</th>
              <th style={{ ...thStyle, width: 90 }}>État</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => {
              const due = fmtDueDate(c.dueDate);
              const pct =
                c.checklistTotal > 0
                  ? Math.round((c.checklistDone / c.checklistTotal) * 100)
                  : c.completed
                    ? 100
                    : 0;
              return (
                <tr
                  key={c._id}
                  onClick={() =>
                    navigate({
                      to: "/boards/$boardId",
                      params: { boardId: c.boardId },
                    })
                  }
                  style={{
                    borderTop: i > 0 ? "1px solid var(--border)" : "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLTableRowElement).style.background =
                      "var(--bg-soft)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLTableRowElement).style.background = "")
                  }
                >
                  <td style={tdStyle}>
                    <div className="row" style={{ gap: 8 }}>
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: c.completed ? "var(--green)" : "var(--accent)",
                          flex: "none",
                        }}
                      />
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          textDecoration: c.completed ? "line-through" : "none",
                          color: c.completed ? "var(--text-muted)" : undefined,
                        }}
                      >
                        {c.title}
                      </span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span className="mw-row-board">{c.boardName}</span>
                  </td>
                  <td style={{ ...tdStyle, color: "var(--text-muted)", fontSize: 12 }}>
                    {c.listName}
                  </td>
                  <td style={tdStyle}>
                    <div className="row" style={{ gap: 8 }}>
                      <div
                        style={{
                          flex: 1,
                          height: 4,
                          background: "var(--bg-soft)",
                          borderRadius: 2,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: c.completed ? "var(--green)" : "var(--accent)",
                          }}
                        />
                      </div>
                      <span className="text-subtle text-xs font-mono">
                        {c.checklistTotal > 0
                          ? `${c.checklistDone}/${c.checklistTotal}`
                          : `${pct}%`}
                      </span>
                    </div>
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      color: due ? due.tone : "var(--text-subtle)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                    }}
                  >
                    {due ? due.label : "—"}
                  </td>
                  <td style={tdStyle}>
                    <span
                      className="badge"
                      style={{
                        background: c.completed ? "var(--green-soft)" : "var(--bg-soft)",
                        color: c.completed ? "var(--green)" : "var(--text-muted)",
                      }}
                    >
                      {c.completed ? "Terminée" : "À faire"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{ ...tdStyle, textAlign: "center", color: "var(--text-muted)" }}
                >
                  Aucune carte.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ============ VIEWS (vues sauvegardées) ============

function ViewsTab({ cards }: { cards: ConvexCard[] | undefined }) {
  const { data: session } = authClient.useSession();

  const savedViews = useQuery(
    api.savedViews.list,
    session?.user ? {} : "skip"
  ) as ConvexSavedView[] | undefined;

  const createView = useMutation(api.savedViews.create);
  const removeView = useMutation(api.savedViews.remove);

  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDue, setNewDue] = useState("any");
  const [creating, setCreating] = useState(false);

  // Cartes filtrées par la vue active
  const activeView = savedViews?.find((v) => v._id === activeViewId);
  const filteredCards = cards?.filter((c) => {
    if (!activeView) return false;
    const now = Date.now();
    if (activeView.filterDue === "overdue") {
      return !c.completed && c.dueDate !== null && c.dueDate < now;
    }
    if (activeView.filterDue === "today") {
      return c.dueDate !== null && c.dueDate >= now && c.dueDate - now <= 86400000;
    }
    if (activeView.filterDue === "week") {
      return c.dueDate !== null && c.dueDate >= now && c.dueDate - now <= 7 * 86400000;
    }
    return true;
  });

  function handleCreateView() {
    if (!newName.trim()) return;
    setCreating(true);
    createView({
      name: newName.trim(),
      icon: "spark",
      filterDue: newDue !== "any" ? newDue : undefined,
    })
      .then(() => {
        toast.success("Vue créée");
        setShowModal(false);
        setNewName("");
        setNewDue("any");
      })
      .catch(() => toast.error("Erreur lors de la création"))
      .finally(() => setCreating(false));
  }

  function handleRemove(viewId: Id<"savedViews">, e: React.MouseEvent) {
    e.stopPropagation();
    removeView({ viewId })
      .then(() => {
        toast.success("Vue supprimée");
        if (activeViewId === viewId) setActiveViewId(null);
      })
      .catch(() => toast.error("Erreur lors de la suppression"));
  }

  return (
    <>
      <div className="row" style={{ marginBottom: 12 }}>
        <span className="text-subtle text-sm">
          {savedViews === undefined
            ? "Chargement…"
            : `${savedViews.length} vue${savedViews.length !== 1 ? "s" : ""} sauvegardée${savedViews.length !== 1 ? "s" : ""}`}
        </span>
        <span className="spacer" />
        <button
          className="btn btn--primary btn--sm"
          onClick={() => setShowModal(true)}
        >
          <Icon name="plus" size={12} /> Nouvelle vue
        </button>
      </div>

      {savedViews !== undefined && savedViews.length === 0 && (
        <p className="text-muted text-sm">Aucune vue sauvegardée.</p>
      )}

      <div className="col" style={{ gap: 8 }}>
        {savedViews?.map((v) => (
          <div
            key={v._id}
            className="view-card"
            style={{
              borderColor: activeViewId === v._id ? "var(--accent)" : undefined,
            }}
            onClick={() =>
              setActiveViewId(activeViewId === v._id ? null : v._id)
            }
          >
            <span
              className="view-card-icon"
              style={{ background: "var(--bg-soft)", color: "var(--accent)" }}
            >
              <Icon name={v.icon} size={14} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row" style={{ gap: 8 }}>
                <span style={{ fontWeight: 500, fontSize: 14 }}>{v.name}</span>
              </div>
              <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {v.filterDue && (
                  <span
                    className="badge"
                    style={{ fontFamily: "var(--font-mono)", fontSize: 10.5 }}
                  >
                    Échéance : {v.filterDue}
                  </span>
                )}
                {v.filterPriority && (
                  <span
                    className="badge"
                    style={{ fontFamily: "var(--font-mono)", fontSize: 10.5 }}
                  >
                    Priorité : {v.filterPriority}
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: "right", flex: "none", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              {activeViewId === v._id && cards !== undefined && (
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 500 }}>
                  {filteredCards?.length ?? 0}
                  <span className="text-subtle text-xs" style={{ fontFamily: "inherit", fontSize: 11 }}>
                    {" "}cartes
                  </span>
                </div>
              )}
              <button
                className="btn btn--ghost btn--sm"
                style={{ color: "var(--red)", fontSize: 11 }}
                onClick={(e) => handleRemove(v._id, e)}
              >
                <Icon name="trash" size={11} /> Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Résultat de la vue active */}
      {activeView && filteredCards !== undefined && (
        <div style={{ marginTop: 24 }}>
          <div className="mw-section-head">
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--accent)",
              }}
            />
            Résultats — {activeView.name}
            <span className="pill">{filteredCards.length}</span>
          </div>
          {filteredCards.length === 0 ? (
            <p className="text-muted text-sm">Aucune carte correspondante.</p>
          ) : (
            filteredCards.map((c) => (
              <ConvexCardRow key={c._id} card={c} />
            ))
          )}
        </div>
      )}

      {/* Bouton créer via filtre */}
      <button
        className="btn btn--outline"
        style={{
          marginTop: 16,
          padding: "14px",
          justifyContent: "center",
          border: "1px dashed var(--border-strong)",
          width: "100%",
        }}
        onClick={() => setShowModal(true)}
      >
        <Icon name="plus" size={13} /> Créer une vue à partir d'un filtre
      </button>

      {/* Modale nouvelle vue */}
      {showModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>
                Nouvelle vue
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label
                  style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}
                >
                  Nom
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="Ex : Mes cartes urgentes"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ width: "100%" }}
                  autoFocus
                />
              </div>
              <div>
                <label
                  style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}
                >
                  Filtre d'échéance
                </label>
                <select
                  className="input"
                  value={newDue}
                  onChange={(e) => setNewDue(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <option value="any">Toutes les cartes</option>
                  <option value="overdue">En retard</option>
                  <option value="today">Aujourd'hui</option>
                  <option value="week">Cette semaine</option>
                </select>
              </div>
            </div>
            <div className="row" style={{ gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
              <button
                className="btn btn--ghost"
                onClick={() => setShowModal(false)}
              >
                Annuler
              </button>
              <button
                className="btn btn--primary"
                onClick={handleCreateView}
                disabled={creating || !newName.trim()}
              >
                {creating ? "Création…" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .view-card {
          display: flex; gap: 14px; align-items: flex-start;
          padding: 16px 18px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          cursor: pointer; transition: border-color 0.12s, box-shadow 0.12s;
        }
        .view-card:hover { border-color: var(--border-strong); box-shadow: var(--shadow-xs); }
        .view-card-icon {
          width: 32px; height: 32px; border-radius: 8px;
          display: grid; place-items: center; flex: none;
        }
      `}</style>
    </>
  );
}
