import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Icon } from "#/features/app/Icon";
import { AppShell } from "#/features/app/AppShell";
import { authClient } from "#/lib/auth-client";
import { toast } from "sonner";

// ============ TYPES CONVEX ============

type ConvexKR = {
  _id: Id<"keyResults">;
  goalId: Id<"goals">;
  title: string;
  progress: number;
};

type ConvexGoal = {
  _id: Id<"goals">;
  title: string;
  quarter: string;
  color: string;
  status: "on_track" | "at_risk" | "off_track";
  _creationTime: number;
  keyResults: ConvexKR[];
};

// ============ COULEURS DISPONIBLES ============

const COLOR_OPTIONS = [
  { id: "indigo",  value: "#6366f1", label: "Indigo" },
  { id: "emerald", value: "#10b981", label: "Émeraude" },
  { id: "violet",  value: "#8b5cf6", label: "Violet" },
  { id: "amber",   value: "#f59e0b", label: "Ambre" },
  { id: "rose",    value: "#f43f5e", label: "Rose" },
  { id: "sky",     value: "#0ea5e9", label: "Ciel" },
  { id: "teal",    value: "#14b8a6", label: "Sarcelle" },
  { id: "slate",   value: "#64748b", label: "Ardoise" },
];

// ============ ROUTE ============

export const Route = createFileRoute("/goals")({
  component: GoalsRoute,
});

function GoalsRoute() {
  return (
    <AppShell active={{ route: "goals" }} title="Objectifs" crumbs={["Atelier Marchand"]}>
      <GoalsContent />
    </AppShell>
  );
}

// ============ CONTENU ============

function GoalsContent() {
  const { data: session } = authClient.useSession();
  const goals = useQuery(api.goals.list, session?.user ? {} : "skip");

  const createGoal = useMutation(api.goals.create);

  const [quarter, setQuarter] = useState("Q2 2026");
  const [openId, setOpenId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (goals === undefined) {
    return (
      <div className="view-inner">
        <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-muted)" }}>
          Chargement…
        </div>
      </div>
    );
  }

  const filtered = goals.filter(g => g.quarter === quarter);

  const goalProgress = (g: ConvexGoal) =>
    g.keyResults.length === 0
      ? 0
      : Math.round(g.keyResults.reduce((sum, kr) => sum + kr.progress, 0) / g.keyResults.length);

  const totalProgress =
    filtered.length === 0
      ? 0
      : Math.round(filtered.reduce((a, g) => a + goalProgress(g), 0) / filtered.length);

  const onTrack  = filtered.filter(g => g.status === "on_track").length;
  const atRisk   = filtered.filter(g => g.status === "at_risk").length;
  const offTrack = filtered.filter(g => g.status === "off_track").length;

  return (
    <div className="view-inner">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.015em", margin: 0 }}>
            Objectifs
          </h1>
          <p className="text-muted text-sm" style={{ margin: "4px 0 0" }}>
            {filtered.length} objectifs · {filtered.reduce((a, g) => a + g.keyResults.length, 0)} résultats clés
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <div className="row" style={{ padding: 2, background: "var(--bg-soft)", borderRadius: 6, gap: 0 }}>
            {["Q1 2026", "Q2 2026", "Q3 2026"].map(q => (
              <button
                key={q}
                onClick={() => setQuarter(q)}
                style={{
                  padding: "4px 12px", border: "none", borderRadius: 4,
                  background: quarter === q ? "var(--surface)" : "transparent",
                  boxShadow: quarter === q ? "var(--shadow-xs)" : "none",
                  fontSize: 12.5, fontWeight: 500,
                  color: quarter === q ? "var(--text)" : "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                {q}
              </button>
            ))}
          </div>
          <button className="btn btn--primary" onClick={() => setShowCreateModal(true)}>
            <Icon name="plus" size={13} /> Nouvel objectif
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="goals-summary">
        <div className="goals-summary-main">
          <span className="text-subtle text-xs" style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>
            Avancement global · {quarter}
          </span>
          <div className="row" style={{ alignItems: "baseline", gap: 12, marginTop: 6 }}>
            <span style={{ fontSize: 44, fontWeight: 500, letterSpacing: "-0.02em", fontFamily: "var(--font-mono)" }}>
              {totalProgress}%
            </span>
            <span className="text-muted" style={{ fontSize: 14 }}>
              {onTrack} en ligne · {atRisk} à risque · {offTrack} dérive
            </span>
          </div>
          <div style={{ height: 8, background: "var(--bg-sunken)", borderRadius: 4, overflow: "hidden", marginTop: 14 }}>
            <div style={{ height: "100%", width: `${totalProgress}%`,
              background: "linear-gradient(90deg, var(--accent), oklch(0.62 0.18 295))" }} />
          </div>
          <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
            <span className="text-subtle text-xs">Début · 1 avril</span>
            <span className="text-subtle text-xs">Aujourd'hui · 20 mai</span>
            <span className="text-subtle text-xs">Fin · 30 juin</span>
          </div>
        </div>
        <div className="goals-summary-side">
          <div>
            <span className="text-subtle text-xs">Résultats clés</span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 500 }}>
              {filtered.reduce((a, g) => a + g.keyResults.length, 0)}
            </div>
          </div>
          <div>
            <span className="text-subtle text-xs">Objectifs actifs</span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 500 }}>
              {filtered.length}
            </div>
          </div>
          <div>
            <span className="text-subtle text-xs">En ligne</span>
            <div className="row" style={{ gap: 4 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 500, color: "var(--green)" }}>
                {filtered.length === 0 ? "–" : `${Math.round((onTrack / filtered.length) * 100)}%`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Goals list */}
      <div style={{ marginTop: 24 }}>
        <span className="text-subtle text-xs" style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>
          Objectifs du trimestre
        </span>

        {filtered.length === 0 ? (
          <div className="goals-empty">
            <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
            <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 6 }}>Aucun objectif pour {quarter}</div>
            <div className="text-muted text-sm" style={{ marginBottom: 20 }}>
              Définissez vos ambitions pour ce trimestre.
            </div>
            <button className="btn btn--primary" onClick={() => setShowCreateModal(true)}>
              <Icon name="plus" size={13} /> Créer un objectif
            </button>
          </div>
        ) : (
          <div className="col" style={{ gap: 12, marginTop: 12 }}>
            {filtered.map(g => (
              <GoalCard
                key={g._id}
                g={g}
                progress={goalProgress(g)}
                open={openId === g._id}
                onToggle={() => setOpenId(openId === g._id ? null : g._id)}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateGoalModal
          defaultQuarter={quarter}
          onClose={() => setShowCreateModal(false)}
          onCreate={async (data) => {
            await createGoal(data);
            toast.success("Objectif créé avec succès !");
            setShowCreateModal(false);
          }}
        />
      )}

      <style>{`
        .goals-summary {
          margin-top: 24px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 24px 28px;
          display: grid; grid-template-columns: 1.4fr 1fr;
          gap: 32px;
        }
        .goals-summary-side {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 20px; align-items: center;
          padding-left: 32px;
          border-left: 1px solid var(--border);
        }
        .goal-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.12s, box-shadow 0.12s;
        }
        .goal-card:hover { border-color: var(--border-strong); }
        .goal-head {
          display: flex; align-items: center; gap: 14px;
          padding: 18px 22px; cursor: pointer;
        }
        .goal-stripe {
          width: 3px; align-self: stretch;
          border-radius: 2px;
        }
        .goal-progress-ring {
          width: 36px; height: 36px;
          position: relative; flex: none;
        }
        .goal-progress-ring svg { transform: rotate(-90deg); }
        .goal-progress-ring-text {
          position: absolute; inset: 0;
          display: grid; place-items: center;
          font-family: var(--font-mono); font-size: 10px;
          font-weight: 600;
        }
        .goal-title {
          flex: 1; font-weight: 500; font-size: 15px;
          letter-spacing: -0.005em; min-width: 0;
        }
        .goal-status-pill {
          padding: 2px 8px; border-radius: 100px;
          font-size: 11px; font-weight: 500;
        }
        .goal-body {
          padding: 0 22px 20px;
          border-top: 1px solid var(--border);
        }
        .kr-row {
          display: grid; grid-template-columns: 1fr 160px 80px 80px;
          gap: 12px; align-items: center;
          padding: 14px 0;
          border-bottom: 1px solid var(--border);
        }
        .kr-row:last-child { border-bottom: none; }
        .kr-title { font-size: 13.5px; line-height: 1.45; }
        .kr-bar {
          height: 6px; background: var(--bg-sunken);
          border-radius: 3px; overflow: hidden;
        }
        .kr-bar-fill { height: 100%; border-radius: 3px; }
        .goals-empty {
          margin-top: 48px;
          display: flex; flex-direction: column;
          align-items: center; text-align: center;
          padding: 48px 24px;
          background: var(--surface);
          border: 1px dashed var(--border);
          border-radius: 14px;
        }
        .goal-actions {
          display: flex; gap: 8px; align-items: center; margin-left: auto;
        }
        .modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.45);
          z-index: 200;
          display: flex; align-items: center; justify-content: center;
        }
        .modal {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 28px 32px;
          width: 520px; max-width: 95vw;
          box-shadow: 0 24px 60px rgba(0,0,0,0.2);
        }
        .modal h2 {
          margin: 0 0 20px;
          font-size: 17px; font-weight: 600;
          letter-spacing: -0.01em;
        }
        .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .form-label { font-size: 12.5px; font-weight: 500; color: var(--text-muted); }
        .form-input {
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-soft);
          color: var(--text);
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.12s;
        }
        .form-input:focus { border-color: var(--accent); }
        .color-grid {
          display: grid; grid-template-columns: repeat(8, 1fr); gap: 8px;
        }
        .color-swatch {
          width: 28px; height: 28px; border-radius: 50%;
          cursor: pointer; border: 2px solid transparent;
          transition: transform 0.1s, border-color 0.1s;
        }
        .color-swatch:hover { transform: scale(1.15); }
        .color-swatch.selected { border-color: var(--text); }
        .kr-input-row {
          display: flex; gap: 8px; align-items: center; margin-bottom: 8px;
        }
        .progress-slider {
          width: 100%; accent-color: var(--accent); cursor: pointer;
        }
        .btn-icon {
          padding: 4px 8px; border-radius: 6px; border: none;
          background: transparent; cursor: pointer;
          color: var(--text-muted); font-size: 12px;
          transition: background 0.1s, color 0.1s;
        }
        .btn-icon:hover { background: var(--bg-soft); color: var(--text); }
        .btn-danger {
          color: var(--red) !important;
        }
        .btn-danger:hover { background: var(--red-soft) !important; }
        .goal-head-actions {
          display: flex; gap: 6px; align-items: center;
        }
        select.form-input { appearance: auto; }
      `}</style>
    </div>
  );
}

// ============ STATUTS ============

const STATUS_MAP: Record<string, { label: string; bg: string; fg: string }> = {
  "on_track":  { label: "En ligne",  bg: "var(--green-soft)",  fg: "var(--green)" },
  "at_risk":   { label: "À risque",  bg: "var(--amber-soft)",  fg: "var(--amber)" },
  "off_track": { label: "En dérive", bg: "var(--red-soft)",    fg: "var(--red)"   },
};

// ============ COMPOSANT GOAL CARD ============

function GoalCard({
  g,
  progress,
  open,
  onToggle,
}: {
  g: ConvexGoal;
  progress: number;
  open: boolean;
  onToggle: () => void;
}) {
  const updateGoal      = useMutation(api.goals.update);
  const removeGoal      = useMutation(api.goals.remove);
  const addKeyResult    = useMutation(api.goals.addKeyResult);
  const updateKeyResult = useMutation(api.goals.updateKeyResult);
  const removeKeyResult = useMutation(api.goals.removeKeyResult);

  const [newKrTitle, setNewKrTitle] = useState("");
  const [addingKr, setAddingKr]     = useState(false);

  const s = STATUS_MAP[g.status] ?? STATUS_MAP["on_track"];
  const r = 16;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;

  function handleStatusChange(status: "on_track" | "at_risk" | "off_track") {
    void updateGoal({ goalId: g._id, status });
  }

  async function handleDelete() {
    if (!confirm(`Supprimer l'objectif « ${g.title} » ? Cette action est irréversible.`)) return;
    await removeGoal({ goalId: g._id });
    toast.success("Objectif supprimé.");
  }

  async function handleAddKr() {
    if (!newKrTitle.trim()) return;
    await addKeyResult({ goalId: g._id, title: newKrTitle.trim() });
    setNewKrTitle("");
    setAddingKr(false);
    toast.success("Résultat clé ajouté.");
  }

  return (
    <div className="goal-card">
      <div className="goal-head" onClick={onToggle}>
        <span className="goal-stripe" style={{ background: g.color }} />
        <div className="goal-progress-ring">
          <svg width="36" height="36">
            <circle cx="18" cy="18" r={r} fill="none" stroke="var(--bg-sunken)" strokeWidth="3" />
            <circle
              cx="18" cy="18" r={r} fill="none" stroke={g.color} strokeWidth="3"
              strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            />
          </svg>
          <span className="goal-progress-ring-text">{progress}</span>
        </div>
        <div className="goal-title">
          {g.title}
          <div className="text-muted text-xs" style={{ marginTop: 2, fontWeight: 400 }}>
            {g.keyResults.length} résultats clés · {g.quarter}
          </div>
        </div>

        {/* Statut modifiable — stoppe la propagation pour ne pas toggle la carte */}
        <div onClick={e => e.stopPropagation()}>
          <select
            className="goal-status-pill"
            value={g.status}
            style={{
              background: s.bg,
              color: s.fg,
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            onChange={e => handleStatusChange(e.target.value as "on_track" | "at_risk" | "off_track")}
          >
            <option value="on_track">En ligne</option>
            <option value="at_risk">À risque</option>
            <option value="off_track">En dérive</option>
          </select>
        </div>

        {/* Bouton supprimer */}
        <button
          className="btn-icon btn-danger"
          title="Supprimer l'objectif"
          onClick={e => { e.stopPropagation(); void handleDelete(); }}
        >
          <Icon name="trash" size={14} />
        </button>

        <Icon
          name="chevdown"
          size={14}
          stroke={1.8}
          style={{
            transform: open ? "none" : "rotate(-90deg)",
            transition: "transform 0.18s",
            color: "var(--text-subtle)",
          }}
        />
      </div>

      {open && (
        <div className="goal-body">
          {g.keyResults.map(kr => (
            <KRRow
              key={kr._id}
              kr={kr}
              goalColor={g.color}
              onUpdate={(progress) => void updateKeyResult({ keyResultId: kr._id, progress })}
              onRemove={() => {
                void removeKeyResult({ keyResultId: kr._id });
                toast.success("Résultat clé supprimé.");
              }}
            />
          ))}

          {/* Ajouter un KR */}
          {addingKr ? (
            <div className="kr-input-row" style={{ marginTop: 12 }}>
              <input
                className="form-input"
                style={{ flex: 1 }}
                placeholder="Titre du résultat clé…"
                value={newKrTitle}
                onChange={e => setNewKrTitle(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") void handleAddKr(); if (e.key === "Escape") setAddingKr(false); }}
                autoFocus
              />
              <button className="btn btn--primary" style={{ fontSize: 13 }} onClick={() => void handleAddKr()}>
                Ajouter
              </button>
              <button className="btn-icon" onClick={() => setAddingKr(false)}>Annuler</button>
            </div>
          ) : (
            <button
              className="btn-icon"
              style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
              onClick={() => setAddingKr(true)}
            >
              <Icon name="plus" size={13} /> Ajouter un résultat clé
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============ COMPOSANT KR ROW ============

function KRRow({
  kr,
  goalColor,
  onUpdate,
  onRemove,
}: {
  kr: ConvexKR;
  goalColor: string;
  onUpdate: (progress: number) => void;
  onRemove: () => void;
}) {
  const [localProgress, setLocalProgress] = useState(kr.progress);

  const pct = localProgress;

  return (
    <div className="kr-row">
      <div>
        <div className="kr-title">{kr.title}</div>
      </div>

      {/* Barre de progression */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div className="kr-bar">
          <div
            className="kr-bar-fill"
            style={{
              width: `${pct}%`,
              background: pct >= 80 ? "var(--green)" : pct >= 50 ? goalColor : "var(--amber)",
            }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={localProgress}
          className="progress-slider"
          onChange={e => setLocalProgress(Number(e.target.value))}
          onMouseUp={() => onUpdate(localProgress)}
          onTouchEnd={() => onUpdate(localProgress)}
        />
      </div>

      <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 13 }}>
        <span style={{ fontWeight: 500 }}>{localProgress}%</span>
      </div>

      <button
        className="btn-icon btn-danger"
        title="Supprimer ce résultat clé"
        onClick={onRemove}
        style={{ justifySelf: "end" }}
      >
        <Icon name="trash" size={13} />
      </button>
    </div>
  );
}

// ============ MODALE DE CRÉATION ============

type CreateGoalData = {
  title: string;
  quarter: string;
  color: string;
  keyResults?: string[];
};

function CreateGoalModal({
  defaultQuarter,
  onClose,
  onCreate,
}: {
  defaultQuarter: string;
  onClose: () => void;
  onCreate: (data: CreateGoalData) => Promise<void>;
}) {
  const [title, setTitle]     = useState("");
  const [quarter, setQuarter] = useState(defaultQuarter);
  const [color, setColor]     = useState(COLOR_OPTIONS[0].value);
  const [kr1, setKr1]         = useState("");
  const [kr2, setKr2]         = useState("");
  const [kr3, setKr3]         = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) { toast.error("Le titre est obligatoire."); return; }
    if (!quarter.trim()) { toast.error("Le trimestre est obligatoire."); return; }

    const keyResults = [kr1, kr2, kr3].map(k => k.trim()).filter(Boolean);

    setLoading(true);
    try {
      await onCreate({ title: title.trim(), quarter: quarter.trim(), color, keyResults: keyResults.length > 0 ? keyResults : undefined });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Nouvel objectif</h2>

        <div className="form-group">
          <label className="form-label">Titre de l'objectif *</label>
          <input
            className="form-input"
            placeholder="Ex. : Lancer la v3 et stabiliser la base"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Trimestre *</label>
          <input
            className="form-input"
            placeholder="Ex. : Q2 2026"
            value={quarter}
            onChange={e => setQuarter(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Couleur</label>
          <div className="color-grid">
            {COLOR_OPTIONS.map(c => (
              <button
                key={c.id}
                className={`color-swatch${color === c.value ? " selected" : ""}`}
                style={{ background: c.value }}
                title={c.label}
                onClick={() => setColor(c.value)}
              />
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Résultats clés (optionnels, 1-3)</label>
          {[
            { val: kr1, set: setKr1, ph: "Résultat clé 1…" },
            { val: kr2, set: setKr2, ph: "Résultat clé 2…" },
            { val: kr3, set: setKr3, ph: "Résultat clé 3…" },
          ].map((item, i) => (
            <input
              key={i}
              className="form-input"
              style={{ marginBottom: 8 }}
              placeholder={item.ph}
              value={item.val}
              onChange={e => item.set(e.target.value)}
            />
          ))}
        </div>

        <div className="row" style={{ gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button className="btn" onClick={onClose} disabled={loading}>Annuler</button>
          <button className="btn btn--primary" onClick={() => void handleSubmit()} disabled={loading}>
            {loading ? "Création…" : "Créer l'objectif"}
          </button>
        </div>
      </div>
    </div>
  );
}
