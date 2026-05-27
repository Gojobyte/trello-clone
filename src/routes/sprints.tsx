import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Icon } from "#/features/app/Icon";
import { Avatar, LabelChip, PriorityDot } from "#/features/app/primitives";
import { PEOPLE } from "#/features/app/demo-data";
import { AppShell } from "#/features/app/AppShell";
import { authClient } from "#/lib/auth-client";
import { toast } from "sonner";

export const Route = createFileRoute("/sprints")({
  component: SprintsRoute,
});

function SprintsRoute() {
  return (
    <AppShell active={{ route: "sprints" }} title="Sprints" crumbs={["Atelier Marchand"]}>
      <SprintsContent />
    </AppShell>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

interface BacklogItem {
  id: string;
  title: string;
  pts: number;
  owner: string;
  priority: string;
  labels: string[];
}

interface BurndownPoint {
  day: number;
  ideal: number;
  actual: number | null;
}

// ── Données backlog (démo statique, pas encore en Convex) ─────────────────────

const SPRINT_BACKLOG: BacklogItem[] = [
  { id: "b1", title: "Refonte du Command palette (⌘K)",          pts: 5, owner: "u1", priority: "high",   labels: ["design"] },
  { id: "b2", title: "Crash au drag-and-drop sur Safari 17",     pts: 3, owner: "u4", priority: "urgent", labels: ["bug"] },
  { id: "b3", title: "Synchronisation temps-réel des cartes",    pts: 8, owner: "u4", priority: "urgent", labels: ["infra"] },
  { id: "b4", title: "Animation des transitions entre vues",     pts: 5, owner: "u1", priority: "high",   labels: ["design"] },
  { id: "b5", title: "Webhooks Slack & Linear",                  pts: 5, owner: "u6", priority: "med",    labels: ["growth"] },
  { id: "b6", title: "Rédiger les guidelines de tone of voice",  pts: 2, owner: "u3", priority: "med",    labels: ["copy"] },
  { id: "b7", title: "Schéma des permissions sur boards privés", pts: 3, owner: "u4", priority: "med",    labels: ["infra"] },
  { id: "b8", title: "Audit UX écrans onboarding mobile",        pts: 5, owner: "u2", priority: "med",    labels: ["research"] },
];

// ── Burndown SVG ─────────────────────────────────────────────────────────────

function Burndown({ data, max }: { data: BurndownPoint[]; max: number }) {
  const W = 700, H = 160, pad = 30;
  const x = (i: number) => pad + (i / (data.length - 1)) * (W - pad * 2);
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);
  const ideal = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.ideal)}`).join(" ");
  const actualPts = data.filter((d) => d.actual !== null) as (BurndownPoint & { actual: number })[];
  const actual = actualPts.map((d, i) => `${i === 0 ? "M" : "L"} ${x(d.day)} ${y(d.actual)}`).join(" ");
  const lastActual = actualPts[actualPts.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 160 }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((p) => (
        <line
          key={p}
          x1={pad} y1={pad + (H - pad * 2) * p}
          x2={W - pad} y2={pad + (H - pad * 2) * p}
          stroke="var(--border)" strokeWidth="0.5"
        />
      ))}
      {/* X labels */}
      {data.map((d, i) =>
        i % 2 === 0 ? (
          <text key={i} x={x(i)} y={H - 10} fontSize="9" fill="var(--text-subtle)" textAnchor="middle" fontFamily="var(--font-mono)">
            J{d.day}
          </text>
        ) : null
      )}
      {/* Ideal line (dashed) */}
      <path d={ideal} stroke="var(--border-strong)" strokeWidth="1.5" fill="none" strokeDasharray="4,4" />
      {/* Actual line */}
      {actual && <path d={actual} stroke="var(--accent)" strokeWidth="2" fill="none" />}
      {/* Actual area */}
      {lastActual && (
        <path
          d={`${actual} L ${x(lastActual.day)} ${H - pad} L ${x(0)} ${H - pad} Z`}
          fill="var(--accent)" opacity="0.06"
        />
      )}
      {/* Actual points */}
      {actualPts.map((d, i) => (
        <circle key={i} cx={x(d.day)} cy={y(d.actual)} r="3" fill="var(--accent)" />
      ))}
      {/* Today marker */}
      {data.length > 1 && (
        <>
          <line x1={x(Math.min(6, data.length - 1))} y1={pad} x2={x(Math.min(6, data.length - 1))} y2={H - pad} stroke="var(--text-subtle)" strokeWidth="0.5" strokeDasharray="2,2" />
          <text x={x(Math.min(6, data.length - 1))} y={pad - 6} fontSize="9" fill="var(--text-subtle)" textAnchor="middle" fontFamily="var(--font-mono)">
            Aujourd&apos;hui
          </text>
        </>
      )}
    </svg>
  );
}

// ── Modale de création de sprint ──────────────────────────────────────────────

interface NewSprintModalProps {
  onClose: () => void;
  onCreate: (args: { name: string; goal: string; startDate: number; endDate: number; committed: number; status: "active" | "planned" | "completed" }) => Promise<void>;
}

function NewSprintModal({ onClose, onCreate }: NewSprintModalProps) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [committed, setCommitted] = useState(20);
  const [status, setStatus] = useState<"active" | "planned" | "completed">("planned");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;

    setLoading(true);
    try {
      await onCreate({
        name: name.trim(),
        goal: goal.trim(),
        startDate: new Date(startDate).getTime(),
        endDate: new Date(endDate).getTime(),
        committed,
        status,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 500 }}>Nouveau sprint</h2>
          <button className="btn btn--ghost btn--sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-muted)" }}>Nom du sprint *</span>
            <input
              className="input"
              type="text"
              placeholder="ex. Sprint 24"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-muted)" }}>Objectif</span>
            <input
              className="input"
              type="text"
              placeholder="ex. Lancer les fonctionnalités premium"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-muted)" }}>Date de début *</span>
              <input
                className="input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-muted)" }}>Date de fin *</span>
              <input
                className="input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </label>
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-muted)" }}>Points engagés</span>
            <input
              className="input"
              type="number"
              min={0}
              value={committed}
              onChange={(e) => setCommitted(Number(e.target.value))}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-muted)" }}>Statut</span>
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value as "active" | "planned" | "completed")}
            >
              <option value="planned">Planifié</option>
              <option value="active">En cours</option>
              <option value="completed">Terminé</option>
            </select>
          </label>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
            <button type="button" className="btn btn--outline" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? "Création…" : "Créer le sprint"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

type TabId = "current" | "next" | "backlog" | "history";

function SprintsContent() {
  const [tab, setTab] = useState<TabId>("current");
  const [showNewModal, setShowNewModal] = useState(false);

  const { data: session } = authClient.useSession();
  const sprints = useQuery(api.sprints.list, session?.user ? {} : "skip");
  const createSprint = useMutation(api.sprints.create);
  const updateSprint = useMutation(api.sprints.update);
  const removeSprint = useMutation(api.sprints.remove);

  // ── Chargement ──
  if (sprints === undefined) {
    return (
      <div className="view-inner">
        <p className="text-muted text-sm" style={{ marginTop: 32, textAlign: "center" }}>
          Chargement…
        </p>
      </div>
    );
  }

  const current = sprints.find((s) => s.status === "active") ?? null;
  const nextSprint = sprints.find((s) => s.status === "planned") ?? null;
  const history = sprints.filter((s) => s.status === "completed");

  // ── Données burndown dérivées du sprint actif ──
  const sprintDays = current
    ? Math.max(1, Math.round((current.endDate - current.startDate) / (1000 * 60 * 60 * 24)))
    : 10;
  const daysPassed = current
    ? Math.min(sprintDays, Math.max(0, Math.round((Date.now() - current.startDate) / (1000 * 60 * 60 * 24))))
    : 0;
  const totalCommitted = current?.committed ?? 0;
  const totalCompleted = current?.completed ?? 0;
  const pct = totalCommitted > 0 ? Math.round((totalCompleted / totalCommitted) * 100) : 0;

  // La ligne idéale = committed → 0 sur sprintDays jours
  // La ligne réelle : on n'a qu'un seul point réel (aujourd'hui) = committed - completed
  const burndown: BurndownPoint[] = Array.from({ length: sprintDays + 1 }, (_, i) => ({
    day: i,
    ideal: totalCommitted - (totalCommitted / sprintDays) * i,
    actual: i === daysPassed ? totalCommitted - totalCompleted : i === 0 ? totalCommitted : null,
  }));

  // ── Vélocité : 5 derniers sprints (actif + terminés) ──
  const velocitySprints = [...sprints].slice(0, 5);
  const maxV = velocitySprints.length > 0 ? Math.max(...velocitySprints.map((s) => s.committed), 1) : 1;
  const avgVelocity = velocitySprints.length > 0
    ? Math.round(velocitySprints.reduce((a, s) => a + s.committed, 0) / velocitySprints.length)
    : 0;
  const engagementPct = velocitySprints.length > 0
    ? Math.round(
        (velocitySprints.reduce((a, s) => a + (s.committed > 0 ? s.completed / s.committed : 0), 0) /
          velocitySprints.length) *
          100
      )
    : 0;

  // ── Handlers ──
  const handleCreate = async (args: { name: string; goal: string; startDate: number; endDate: number; committed: number; status: "active" | "planned" | "completed" }) => {
    await createSprint(args);
    toast.success(`Sprint « ${args.name} » créé avec succès.`);
  };

  const handleDelete = async (sprintId: string, name: string) => {
    const confirmed = window.confirm(`Supprimer le sprint « ${name} » ? Cette action est irréversible.`);
    if (!confirmed) return;
    await removeSprint({ sprintId: sprintId as Parameters<typeof removeSprint>[0]["sprintId"] });
    toast.success("Sprint supprimé.");
  };

  const handleUpdateCurrent = async (field: "committed" | "completed" | "status", value: number | string) => {
    if (!current) return;
    await updateSprint({
      sprintId: current._id,
      [field]: value,
    });
  };

  return (
    <div className="view-inner">
      {/* En-tête */}
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.015em", margin: 0 }}>
            Sprints
          </h1>
          <p className="text-muted text-sm" style={{ margin: "4px 0 0" }}>
            {sprints.length === 0
              ? "Aucun sprint planifié pour le moment"
              : `${sprints.length} sprint${sprints.length > 1 ? "s" : ""} · cycle de 2 semaines`}
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn--outline">
            <Icon name="settings" size={13} /> Réglages
          </button>
          <button className="btn btn--primary" onClick={() => setShowNewModal(true)}>
            <Icon name="plus" size={13} /> Nouveau sprint
          </button>
        </div>
      </div>

      {/* Modale création */}
      {showNewModal && (
        <NewSprintModal onClose={() => setShowNewModal(false)} onCreate={handleCreate} />
      )}

      {/* ── État vide global ── */}
      {sprints.length === 0 ? (
        <div className="sp-empty" style={{ marginTop: 32 }}>
          <Icon name="calendar" size={32} stroke={1.5} style={{ color: "var(--text-subtle)" }} />
          <h3 style={{ fontSize: 16, fontWeight: 500, margin: "12px 0 6px" }}>
            Aucun sprint pour l&apos;instant
          </h3>
          <p className="text-muted" style={{ margin: "0 0 16px", fontSize: 13, maxWidth: 380 }}>
            Planifiez votre premier sprint pour commencer à suivre votre avancement.
          </p>
          <button className="btn btn--primary btn--sm" onClick={() => setShowNewModal(true)}>
            Planifier un sprint
          </button>
        </div>
      ) : (
        <>
          {/* Onglets */}
          <div className="row" style={{ marginTop: 24, gap: 4, borderBottom: "1px solid var(--border)" }}>
            {(
              [
                ["current", "Sprint en cours"],
                ["next",    "Prochain sprint"],
                ["backlog", "Backlog"],
                ["history", "Historique"],
              ] as [TabId, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  padding: "8px 4px", marginRight: 18, marginBottom: -1,
                  border: "none", background: "transparent", cursor: "pointer",
                  fontSize: 13, fontWeight: 500,
                  color: tab === id ? "var(--text)" : "var(--text-muted)",
                  borderBottom: tab === id ? "2px solid var(--text)" : "2px solid transparent",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Sprint en cours ── */}
          {tab === "current" && (
            <>
              {current === null ? (
                <div className="sp-empty" style={{ marginTop: 32 }}>
                  <Icon name="calendar" size={32} stroke={1.5} style={{ color: "var(--text-subtle)" }} />
                  <h3 style={{ fontSize: 16, fontWeight: 500, margin: "12px 0 6px" }}>
                    Aucun sprint actif
                  </h3>
                  <p className="text-muted" style={{ margin: "0 0 16px", fontSize: 13, maxWidth: 380 }}>
                    Démarrez un sprint planifié ou créez-en un nouveau.
                  </p>
                  <button className="btn btn--primary btn--sm" onClick={() => setShowNewModal(true)}>
                    Planifier un sprint
                  </button>
                </div>
              ) : (
                <>
                  {/* Carte sprint courant */}
                  <div className="sp-current">
                    <div>
                      <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                        <span
                          className="badge"
                          style={{
                            background: "var(--accent-soft)", color: "var(--accent-text)",
                            borderColor: "transparent", fontFamily: "var(--font-mono)",
                          }}
                        >
                          {current.name}
                        </span>
                        <span
                          className="badge"
                          style={{ background: "var(--green-soft)", color: "var(--green)", borderColor: "transparent" }}
                        >
                          En cours
                        </span>
                        <span className="text-subtle text-sm">· Jour {daysPassed} sur {sprintDays}</span>
                      </div>
                      <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.015em", margin: "0 0 8px" }}>
                        {current.goal || current.name}
                      </h2>
                      <p className="text-muted text-sm" style={{ margin: 0 }}>
                        Du {new Date(current.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} au{" "}
                        {new Date(current.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                      </p>

                      {/* Contrôles statut */}
                      <div className="row" style={{ gap: 8, marginTop: 14 }}>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Statut :</span>
                        <select
                          className="input"
                          style={{ padding: "3px 8px", fontSize: 12, height: "auto", width: "auto" }}
                          value={current.status}
                          onChange={(e) => handleUpdateCurrent("status", e.target.value)}
                        >
                          <option value="planned">Planifié</option>
                          <option value="active">En cours</option>
                          <option value="completed">Terminé</option>
                        </select>
                        <button
                          className="btn btn--ghost btn--sm"
                          style={{ color: "var(--red)", marginLeft: "auto" }}
                          onClick={() => handleDelete(current._id, current.name)}
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>

                    <div className="sp-current-stats">
                      {/* Engagés */}
                      <div>
                        <span className="text-subtle text-xs">Engagés</span>
                        <span className="sp-current-v">{totalCommitted}</span>
                        <div className="row" style={{ gap: 4, marginTop: 4 }}>
                          <button
                            className="btn btn--ghost btn--sm"
                            style={{ padding: "1px 6px", fontSize: 16 }}
                            onClick={() => handleUpdateCurrent("committed", Math.max(0, totalCommitted - 1))}
                          >−</button>
                          <input
                            type="number"
                            min={0}
                            value={totalCommitted}
                            onChange={(e) => handleUpdateCurrent("committed", Number(e.target.value))}
                            style={{ width: 52, textAlign: "center", fontSize: 12, padding: "2px 4px" }}
                            className="input"
                          />
                          <button
                            className="btn btn--ghost btn--sm"
                            style={{ padding: "1px 6px", fontSize: 16 }}
                            onClick={() => handleUpdateCurrent("committed", totalCommitted + 1)}
                          >+</button>
                        </div>
                      </div>

                      {/* Terminés */}
                      <div>
                        <span className="text-subtle text-xs">Terminés</span>
                        <span className="sp-current-v">{totalCompleted}</span>
                        <div className="row" style={{ gap: 4, marginTop: 4 }}>
                          <button
                            className="btn btn--ghost btn--sm"
                            style={{ padding: "1px 6px", fontSize: 16 }}
                            onClick={() => handleUpdateCurrent("completed", Math.max(0, totalCompleted - 1))}
                          >−</button>
                          <input
                            type="number"
                            min={0}
                            value={totalCompleted}
                            onChange={(e) => handleUpdateCurrent("completed", Number(e.target.value))}
                            style={{ width: 52, textAlign: "center", fontSize: 12, padding: "2px 4px" }}
                            className="input"
                          />
                          <button
                            className="btn btn--ghost btn--sm"
                            style={{ padding: "1px 6px", fontSize: 16 }}
                            onClick={() => handleUpdateCurrent("completed", Math.min(totalCommitted, totalCompleted + 1))}
                          >+</button>
                        </div>
                      </div>

                      {/* Restants */}
                      <div>
                        <span className="text-subtle text-xs">Restants</span>
                        <span className="sp-current-v">{totalCommitted - totalCompleted}</span>
                        <span className="text-subtle text-xs" style={{ color: "var(--amber)" }}>
                          {sprintDays - daysPassed} jours
                        </span>
                        {totalCommitted > 0 && (
                          <span className="text-subtle text-xs" style={{ marginTop: 2 }}>
                            {pct}% terminé
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Burndown */}
                  <div className="sp-panel">
                    <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
                      <div>
                        <h3 className="sp-panel-h">Burndown</h3>
                        <p className="text-subtle text-xs" style={{ margin: "4px 0 0" }}>
                          Points restants par jour · idéal vs réalisé
                        </p>
                      </div>
                      <div className="row" style={{ gap: 14, fontSize: 12 }}>
                        <span className="row" style={{ gap: 5 }}>
                          <span style={{ width: 12, height: 2, background: "var(--border-strong)", borderRadius: 1 }} />
                          Idéal
                        </span>
                        <span className="row" style={{ gap: 5 }}>
                          <span style={{ width: 12, height: 2, background: "var(--accent)", borderRadius: 1 }} />
                          Réalisé
                        </span>
                      </div>
                    </div>
                    <Burndown data={burndown} max={Math.max(totalCommitted, 1)} />
                  </div>

                  {/* Colonnes sprint (dérivées de committed/completed) */}
                  <div className="sp-cols">
                    {[
                      { id: "todo",   label: "À faire",  pts: Math.max(0, totalCommitted - totalCompleted), n: "-", color: "var(--blue)" },
                      { id: "done",   label: "Terminé",  pts: totalCompleted, n: "-", color: "var(--green)" },
                    ].map((col) => (
                      <div key={col.id} className="sp-col">
                        <div className="row" style={{ gap: 6 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: col.color }} />
                          <span style={{ fontWeight: 500, fontSize: 13 }}>{col.label}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 500 }}>{col.pts}</span>
                          <span className="text-subtle text-xs">pts</span>
                        </div>
                        <div style={{ height: 3, background: "var(--bg-sunken)", borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
                          <div style={{ width: `${totalCommitted > 0 ? (col.pts / totalCommitted) * 100 : 0}%`, height: "100%", background: col.color }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Vélocité + Charge */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                    {/* Vélocité */}
                    <div className="sp-panel">
                      <h3 className="sp-panel-h">Vélocité · sprints récents</h3>
                      <div className="sp-velocity">
                        {velocitySprints.map((s) => {
                          const isCurrent = s.status === "active";
                          return (
                            <div
                              key={s._id}
                              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}
                            >
                              <div style={{ display: "flex", alignItems: "end", gap: 2, width: "100%", height: 100 }}>
                                <div
                                  style={{
                                    flex: 1,
                                    background: isCurrent ? "oklch(0.85 0.06 275)" : "var(--border-strong)",
                                    height: `${(s.committed / maxV) * 100}%`,
                                    borderRadius: "2px 2px 0 0",
                                  }}
                                  title="Engagés"
                                />
                                <div
                                  style={{
                                    flex: 1,
                                    background: isCurrent ? "var(--accent)" : "oklch(0.65 0.13 275)",
                                    height: `${(s.completed / maxV) * 100}%`,
                                    borderRadius: "2px 2px 0 0",
                                  }}
                                  title="Terminés"
                                />
                              </div>
                              <span style={{ fontSize: 10.5, color: "var(--text-subtle)", fontFamily: "var(--font-mono)", textOverflow: "ellipsis", overflow: "hidden", maxWidth: 48, whiteSpace: "nowrap" }}>
                                {s.name.slice(0, 8)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div
                        className="row"
                        style={{ gap: 24, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}
                      >
                        <div>
                          <div className="text-subtle text-xs">Moyenne</div>
                          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 500, fontSize: 16 }}>{avgVelocity} pts</div>
                        </div>
                        <div>
                          <div className="text-subtle text-xs">Engagement tenu</div>
                          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 500, fontSize: 16, color: "var(--green)" }}>{engagementPct}%</div>
                        </div>
                      </div>
                    </div>

                    {/* Charge par personne (demo) */}
                    <div className="sp-panel">
                      <h3 className="sp-panel-h">Charge par personne · ce sprint</h3>
                      <div className="col" style={{ gap: 10, marginTop: 12 }}>
                        {PEOPLE.slice(0, 5).map((p, i) => {
                          const pts = ([8, 6, 5, 4, 3] as const)[i];
                          const cap = 8;
                          const overload = pts > 6;
                          return (
                            <div key={p.id} className="row" style={{ gap: 10 }}>
                              <Avatar user={p.id} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                                  <span style={{ fontSize: 12.5, fontWeight: 500 }}>{p.name.split(" ")[0]}</span>
                                  <span className="text-subtle text-xs font-mono">{pts}/{cap} pts</span>
                                </div>
                                <div style={{ height: 4, background: "var(--bg-soft)", borderRadius: 2, overflow: "hidden" }}>
                                  <div
                                    style={{
                                      height: "100%",
                                      width: `${(pts / cap) * 100}%`,
                                      background: overload
                                        ? "var(--red)"
                                        : pts >= cap * 0.8
                                        ? "var(--amber)"
                                        : "var(--accent)",
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── Backlog ── */}
          {tab === "backlog" && (
            <div style={{ marginTop: 24 }}>
              <div className="row" style={{ marginBottom: 12 }}>
                <span className="text-subtle text-sm">
                  {SPRINT_BACKLOG.length} cartes en backlog ·{" "}
                  {SPRINT_BACKLOG.reduce((a, b) => a + b.pts, 0)} points
                </span>
                <span className="spacer" />
                <button className="btn btn--outline btn--sm">Tirer dans le sprint en cours</button>
              </div>
              <div
                style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: 10, overflow: "hidden",
                }}
              >
                {SPRINT_BACKLOG.map((c, i) => (
                  <div
                    key={c.id}
                    className="row"
                    style={{
                      padding: "12px 16px", gap: 12,
                      borderBottom: i < SPRINT_BACKLOG.length - 1 ? "1px solid var(--border)" : "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-soft)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    <span
                      style={{
                        fontSize: 11, color: "var(--text-subtle)",
                        fontFamily: "var(--font-mono)", width: 22,
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <PriorityDot id={c.priority} />
                    <span style={{ flex: 1, fontSize: 13.5 }}>{c.title}</span>
                    {c.labels.map((l) => (
                      <LabelChip key={l} id={l} />
                    ))}
                    <Avatar user={c.owner} size="sm" />
                    <span
                      className="badge"
                      style={{ fontFamily: "var(--font-mono)", minWidth: 30, justifyContent: "center" }}
                    >
                      {c.pts}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Prochain sprint ── */}
          {tab === "next" && (
            <>
              {nextSprint === null ? (
                <div className="sp-empty" style={{ marginTop: 32 }}>
                  <Icon name="calendar" size={32} stroke={1.5} style={{ color: "var(--text-subtle)" }} />
                  <h3 style={{ fontSize: 16, fontWeight: 500, margin: "12px 0 6px" }}>
                    Aucun sprint planifié
                  </h3>
                  <p className="text-muted" style={{ margin: "0 0 16px", fontSize: 13, maxWidth: 380 }}>
                    Planifiez votre prochain sprint pour préparer la suite.
                  </p>
                  <button className="btn btn--primary btn--sm" onClick={() => setShowNewModal(true)}>
                    Planifier un sprint →
                  </button>
                </div>
              ) : (
                <div className="sp-panel" style={{ marginTop: 24 }}>
                  <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>{nextSprint.name}</h3>
                      {nextSprint.goal && (
                        <p className="text-muted text-sm" style={{ margin: "4px 0 0" }}>{nextSprint.goal}</p>
                      )}
                      <p className="text-subtle text-xs" style={{ margin: "4px 0 0" }}>
                        Du{" "}
                        {new Date(nextSprint.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}{" "}
                        au{" "}
                        {new Date(nextSprint.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                        {" "}· {nextSprint.committed} points engagés
                      </p>
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                      <button
                        className="btn btn--primary btn--sm"
                        onClick={async () => {
                          await updateSprint({ sprintId: nextSprint._id, status: "active" });
                          toast.success("Sprint démarré !");
                          setTab("current");
                        }}
                      >
                        Démarrer →
                      </button>
                      <button
                        className="btn btn--ghost btn--sm"
                        style={{ color: "var(--red)" }}
                        onClick={() => handleDelete(nextSprint._id, nextSprint.name)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Historique ── */}
          {tab === "history" && (
            <div style={{ marginTop: 24 }}>
              {history.length === 0 ? (
                <div className="sp-empty">
                  <Icon name="calendar" size={32} stroke={1.5} style={{ color: "var(--text-subtle)" }} />
                  <h3 style={{ fontSize: 16, fontWeight: 500, margin: "12px 0 6px" }}>Aucun sprint terminé</h3>
                  <p className="text-muted" style={{ margin: 0, fontSize: 13 }}>L&apos;historique apparaîtra ici une fois vos premiers sprints complétés.</p>
                </div>
              ) : (
                <div className="col" style={{ gap: 6 }}>
                  {[...history].reverse().map((s) => {
                    const donePct = s.committed > 0 ? Math.round((s.completed / s.committed) * 100) : 0;
                    return (
                      <div
                        key={s._id}
                        className="row"
                        style={{
                          padding: "14px 18px", background: "var(--surface)",
                          border: "1px solid var(--border)", borderRadius: 8,
                          gap: 12, cursor: "pointer",
                        }}
                      >
                        <span className="badge" style={{ fontFamily: "var(--font-mono)", minWidth: 48 }}>
                          {s.name.slice(0, 8)}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 500, fontSize: 13.5 }}>{s.goal || s.name}</div>
                          <div className="text-subtle text-xs" style={{ marginTop: 2 }}>
                            {new Date(s.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} →{" "}
                            {new Date(s.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </div>
                        </div>
                        <div style={{ width: 160 }}>
                          <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                            <span className="text-subtle text-xs font-mono">
                              {s.completed}/{s.committed} pts
                            </span>
                            <span
                              className="text-subtle text-xs"
                              style={{
                                color:
                                  donePct >= 90
                                    ? "var(--green)"
                                    : donePct >= 75
                                    ? "var(--amber)"
                                    : "var(--red)",
                              }}
                            >
                              {donePct}%
                            </span>
                          </div>
                          <div style={{ height: 4, background: "var(--bg-soft)", borderRadius: 2, overflow: "hidden" }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${donePct}%`,
                                background:
                                  donePct >= 90
                                    ? "var(--green)"
                                    : donePct >= 75
                                    ? "var(--amber)"
                                    : "var(--red)",
                              }}
                            />
                          </div>
                        </div>
                        <button
                          className="btn btn--ghost btn--sm"
                          style={{ color: "var(--red)" }}
                          onClick={(e) => { e.stopPropagation(); handleDelete(s._id, s.name); }}
                        >
                          Supprimer
                        </button>
                        <button className="btn btn--ghost btn--sm">Rétro →</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <style>{`
        .sp-current {
          margin-top: 24px;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 14px; padding: 24px 28px;
          display: grid; grid-template-columns: 1.5fr 1fr;
          gap: 32px;
        }
        .sp-current-stats {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 24px; padding-left: 32px;
          border-left: 1px solid var(--border); align-items: start;
        }
        .sp-current-stats > div {
          display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
        }
        .sp-current-v {
          font-family: var(--font-mono); font-size: 32px;
          font-weight: 500; letter-spacing: -0.015em;
          line-height: 1.1;
        }
        .sp-panel {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; padding: 18px 22px;
          margin-top: 12px;
        }
        .sp-panel-h {
          font-size: 13px; font-weight: 500;
          margin: 0; letter-spacing: -0.005em;
        }
        .sp-cols {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 10px; margin-top: 12px;
        }
        .sp-col {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 10px; padding: 14px 16px;
        }
        .sp-velocity {
          display: flex; align-items: end; gap: 8px;
          padding: 8px 0;
        }
        .sp-empty {
          padding: 60px 20px; text-align: center;
          background: var(--bg-soft); border: 1px dashed var(--border-strong);
          border-radius: 12px; display: flex;
          flex-direction: column; align-items: center;
        }
      `}</style>
    </div>
  );
}
