import { createFileRoute } from "@tanstack/react-router";
import { useState, Fragment } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Icon } from "#/features/app/Icon";
import { AppShell } from "#/features/app/AppShell";
import { authClient } from "#/lib/auth-client";
import { toast } from "sonner";

// ============ CATALOGUES ============

interface CatalogEntry {
  code: string;
  label: string;
  icon: string;
}

const TRIGGERS: CatalogEntry[] = [
  { code: "card.created", label: "Quand une carte est créée", icon: "plus" },
  { code: "card.completed", label: "Quand une carte est terminée", icon: "check" },
  { code: "card.moved", label: "Quand une carte change de liste", icon: "arrow" },
  { code: "due.approaching", label: "Quand une échéance approche", icon: "clock" },
  { code: "card.assigned", label: "Quand une carte est assignée", icon: "user" },
  { code: "comment.added", label: "Quand un commentaire est ajouté", icon: "chat" },
];

const ACTIONS: CatalogEntry[] = [
  { code: "notify", label: "Envoyer une notification", icon: "bell" },
  { code: "archive", label: "Archiver la carte", icon: "check" },
  { code: "move.done", label: "Déplacer vers Terminé", icon: "arrow" },
  { code: "assign", label: "Assigner un membre", icon: "user" },
  { code: "label.add", label: "Ajouter une étiquette", icon: "flag" },
  { code: "comment", label: "Ajouter un commentaire", icon: "chat" },
  { code: "due.set", label: "Définir une échéance", icon: "clock" },
];

function triggerLabel(code: string): string {
  return TRIGGERS.find((t) => t.code === code)?.label ?? code;
}

function triggerIcon(code: string): string {
  return TRIGGERS.find((t) => t.code === code)?.icon ?? "bolt";
}

function actionLabel(code: string): string {
  return ACTIONS.find((a) => a.code === code)?.label ?? code;
}

function actionIcon(code: string): string {
  return ACTIONS.find((a) => a.code === code)?.icon ?? "bolt";
}

// ============ TEMPLATES ============

interface TemplateItem {
  icon: string;
  title: string;
  trigger: string;
  actions: string[];
  name: string;
}

const TEMPLATES: TemplateItem[] = [
  {
    icon: "check",
    title: "Archiver les cartes terminées",
    name: "Archiver à la complétion",
    trigger: "card.completed",
    actions: ["archive"],
  },
  {
    icon: "bell",
    title: "Notifier quand une carte est assignée",
    name: "Notification d'assignation",
    trigger: "card.assigned",
    actions: ["notify"],
  },
  {
    icon: "user",
    title: "Assigner un membre à la création",
    name: "Auto-assignation",
    trigger: "card.created",
    actions: ["assign"],
  },
  {
    icon: "clock",
    title: "Définir une échéance à la création",
    name: "Échéance automatique",
    trigger: "card.created",
    actions: ["due.set"],
  },
  {
    icon: "flag",
    title: "Ajouter une étiquette quand terminé",
    name: "Étiquetage automatique",
    trigger: "card.completed",
    actions: ["label.add"],
  },
  {
    icon: "chat",
    title: "Commenter quand l'échéance approche",
    name: "Alerte échéance",
    trigger: "due.approaching",
    actions: ["comment", "notify"],
  },
];

// ============ ROUTE ============

export const Route = createFileRoute("/automations")({
  component: AutomationsRoute,
});

function AutomationsRoute() {
  return (
    <AppShell active={{ route: "automations" }} title="Automatisations" crumbs={["Atelier Marchand"]}>
      <AutomationsContent />
    </AppShell>
  );
}

// ============ CONTENU ============

function AutomationsContent() {
  const { data: session } = authClient.useSession();
  const rules = useQuery(api.automations.list, session?.user ? {} : "skip");
  const createRule = useMutation(api.automations.create);
  const removeRule = useMutation(api.automations.remove);

  const [modalOpen, setModalOpen] = useState(false);
  const [prefill, setPrefill] = useState<{ name?: string; trigger?: string; actions?: string[] }>({});

  function openModal(pre?: { name?: string; trigger?: string; actions?: string[] }) {
    setPrefill(pre ?? {});
    setModalOpen(true);
  }

  async function handleCreate(name: string, trigger: string, actions: string[]) {
    await createRule({ name, trigger, actions });
    toast.success("Règle créée avec succès");
    setModalOpen(false);
  }

  async function handleRemove(ruleId: Id<"automationRules">, name: string) {
    if (!window.confirm(`Supprimer la règle « ${name} » ?`)) return;
    await removeRule({ ruleId });
    toast.success("Règle supprimée");
  }

  if (rules === undefined) {
    return (
      <div className="view-inner">
        <p className="text-muted text-sm">Chargement…</p>
      </div>
    );
  }

  const activeCount = rules.filter((r) => r.enabled).length;
  const totalRuns = rules.reduce((acc, r) => acc + r.runCount, 0);

  return (
    <div className="view-inner">
      {/* En-tête */}
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="row" style={{ gap: 8 }}>
            <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.015em", margin: 0 }}>
              Automatisations
            </h1>
            <span
              className="badge"
              style={{
                background: "var(--accent-soft)",
                color: "var(--accent-text)",
                borderColor: "transparent",
              }}
            >
              PRO
            </span>
          </div>
          <p className="text-muted text-sm" style={{ margin: "4px 0 0" }}>
            {activeCount} actives sur {rules.length} · {totalRuns} exécutions au total
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn--outline">
            <Icon name="docs" size={13} /> Bibliothèque
          </button>
          <button className="btn btn--primary" onClick={() => openModal()}>
            <Icon name="plus" size={13} /> Nouvelle règle
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="aut-stats">
        {[
          { l: "Règles actives", v: activeCount, sub: `sur ${rules.length} créées` },
          { l: "Exécutions totales", v: totalRuns, sub: "toutes règles confondues" },
          { l: "Règles inactives", v: rules.length - activeCount, sub: "en pause" },
          { l: "Règles configurées", v: rules.length, sub: "dans votre espace" },
        ].map((s, i) => (
          <div key={i} className="aut-stat">
            <span className="aut-stat-l">{s.l}</span>
            <span className="aut-stat-v">{s.v}</span>
            <span className="aut-stat-sub">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* Templates strip */}
      <div className="aut-templates">
        <div
          className="row"
          style={{ justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}
        >
          <span
            className="text-subtle text-xs"
            style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}
          >
            Démarrer avec un template
          </span>
          <a className="text-sm" style={{ color: "var(--text-muted)", cursor: "pointer" }}>
            Voir les {TEMPLATES.length} templates →
          </a>
        </div>
        <div className="aut-templates-grid">
          {TEMPLATES.map((t, i) => (
            <button
              key={i}
              className="aut-template"
              onClick={() => openModal({ name: t.name, trigger: t.trigger, actions: t.actions })}
            >
              <div className="aut-template-icon">
                <Icon name={t.icon} size={14} />
              </div>
              <span style={{ fontSize: 13 }}>{t.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Liste des règles */}
      <div style={{ marginTop: 32 }}>
        <div
          className="row"
          style={{ justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}
        >
          <span
            className="text-subtle text-xs"
            style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}
          >
            Vos règles
          </span>
          <div className="row" style={{ gap: 4 }}>
            <button className="btn btn--ghost btn--sm">
              <Icon name="filter" size={12} /> Filtrer
            </button>
            <button className="btn btn--ghost btn--sm">Trier</button>
          </div>
        </div>

        {rules.length === 0 ? (
          <div className="aut-empty">
            <Icon name="bolt" size={24} />
            <p>Aucune règle créée pour le moment</p>
            <button className="btn btn--primary" onClick={() => openModal()}>
              <Icon name="plus" size={13} /> Créer une règle
            </button>
          </div>
        ) : (
          <div className="col" style={{ gap: 8 }}>
            {rules.map((rule) => (
              <AutomationCard
                key={rule._id}
                rule={rule}
                onRemove={() => handleRemove(rule._id, rule.name)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Note honnête */}
      <p className="text-subtle text-xs" style={{ marginTop: 24, textAlign: "center" }}>
        Les règles sont enregistrées et activables. Le moteur d'exécution automatique sera branché prochainement.
      </p>

      {/* Modale de création */}
      {modalOpen && (
        <CreateRuleModal
          prefill={prefill}
          onCreate={handleCreate}
          onClose={() => setModalOpen(false)}
        />
      )}

      <style>{`
        .aut-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 1px; background: var(--border);
          border: 1px solid var(--border); border-radius: 10px;
          overflow: hidden; margin-top: 24px;
        }
        .aut-stat {
          background: var(--surface);
          padding: 16px 18px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .aut-stat-l { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500; }
        .aut-stat-v { font-size: 28px; font-weight: 500; letter-spacing: -0.015em; font-family: var(--font-mono); line-height: 1.1; }
        .aut-stat-sub { font-size: 11.5px; color: var(--text-subtle); }

        .aut-templates { margin-top: 32px; }
        .aut-templates-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .aut-template {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 14px; background: var(--surface);
          border: 1px solid var(--border); border-radius: 8px;
          cursor: pointer; text-align: left;
          transition: border-color 0.12s;
        }
        .aut-template:hover { border-color: var(--border-strong); }
        .aut-template-icon {
          width: 28px; height: 28px; border-radius: 6px;
          background: var(--bg-soft); display: grid; place-items: center;
          color: var(--text-muted); flex: none;
        }

        .aut-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.12s, box-shadow 0.12s;
        }
        .aut-card:hover { border-color: var(--border-strong); box-shadow: var(--shadow-xs); }
        .aut-head {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 18px;
        }
        .aut-icon {
          width: 32px; height: 32px; border-radius: 8px;
          display: grid; place-items: center;
          flex: none;
        }
        .aut-name {
          flex: 1; font-weight: 500; font-size: 14px;
          letter-spacing: -0.005em; min-width: 0;
        }
        .aut-flow {
          display: flex; align-items: center; gap: 0; flex-wrap: wrap;
          padding: 12px 18px 16px;
          border-top: 1px solid var(--border);
          background: var(--bg-soft);
          font-size: 12.5px;
        }
        .aut-flow-block {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 10px;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 6px;
        }
        .aut-flow-arrow {
          color: var(--text-subtle);
          padding: 0 8px;
          font-family: var(--font-mono);
        }
        .aut-flow-trigger {
          color: var(--accent-text); font-weight: 500;
          background: var(--accent-soft) !important; border-color: transparent !important;
        }

        .aut-empty {
          display: flex; flex-direction: column; align-items: center;
          gap: 12px; padding: 48px 24px;
          border: 1px dashed var(--border); border-radius: 12px;
          color: var(--text-muted); text-align: center;
        }
        .aut-empty p { margin: 0; font-size: 14px; }

        .modal-backdrop {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.45); backdrop-filter: blur(2px);
          display: grid; place-items: center;
        }
        .modal {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 28px;
          width: 480px; max-width: calc(100vw - 32px);
          box-shadow: var(--shadow-lg, 0 20px 60px rgba(0,0,0,0.18));
          display: flex; flex-direction: column; gap: 18px;
        }
        .modal-title {
          font-size: 16px; font-weight: 600;
          letter-spacing: -0.01em; margin: 0;
        }
        .modal-field { display: flex; flex-direction: column; gap: 6px; }
        .modal-label { font-size: 12px; font-weight: 500; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .modal-input, .modal-select {
          width: 100%; padding: 9px 12px;
          background: var(--bg-soft); border: 1px solid var(--border);
          border-radius: 8px; font-size: 14px; color: var(--text);
          outline: none; transition: border-color 0.12s;
          box-sizing: border-box;
        }
        .modal-input:focus, .modal-select:focus { border-color: var(--accent); }
        .modal-actions-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 6px;
        }
        .modal-action-check {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 10px; border-radius: 7px;
          border: 1px solid var(--border); cursor: pointer;
          font-size: 13px; user-select: none;
          transition: background 0.1s, border-color 0.1s;
        }
        .modal-action-check.selected {
          background: var(--accent-soft); border-color: var(--accent);
          color: var(--accent-text);
        }
        .modal-footer { display: flex; justify-content: flex-end; gap: 8px; }
      `}</style>
    </div>
  );
}

// ============ CARTE D'AUTOMATISATION ============

interface ConvexRule {
  _id: Id<"automationRules">;
  name: string;
  trigger: string;
  actions: string[];
  enabled: boolean;
  runCount: number;
  _creationTime: number;
}

function AutomationCard({
  rule,
  onRemove,
}: {
  rule: ConvexRule;
  onRemove: () => void;
}) {
  const toggle = useMutation(api.automations.toggle);

  async function handleToggle() {
    await toggle({ ruleId: rule._id });
  }

  return (
    <div className="aut-card">
      <div className="aut-head">
        <div
          className="aut-icon"
          style={{
            background: rule.enabled ? "var(--accent-soft)" : "var(--bg-sunken)",
            color: rule.enabled ? "var(--accent-text)" : "var(--text-subtle)",
          }}
        >
          <Icon name="bolt" size={14} />
        </div>
        <div className="aut-name">
          {rule.name}
          <div className="text-subtle text-xs" style={{ marginTop: 2, fontWeight: 400 }}>
            exécutée {rule.runCount} fois ·{" "}
            {rule.enabled ? "active" : "inactive"}
          </div>
        </div>
        <button
          className="btn btn--ghost btn--icon"
          title="Supprimer"
          onClick={onRemove}
          style={{ color: "var(--text-muted)" }}
        >
          <Icon name="trash" size={13} />
        </button>
        <div
          className={`toggle ${rule.enabled ? "on" : ""}`}
          onClick={handleToggle}
          style={{ cursor: "pointer" }}
        />
      </div>
      <div className="aut-flow">
        <span className="aut-flow-block aut-flow-trigger">
          <Icon name={triggerIcon(rule.trigger)} size={11} />
          {triggerLabel(rule.trigger)}
        </span>
        {rule.actions.map((code, i) => (
          <Fragment key={i}>
            <span className="aut-flow-arrow">→</span>
            <span className="aut-flow-block">
              <Icon
                name={actionIcon(code)}
                size={11}
                style={{ color: "var(--text-subtle)" }}
              />
              {actionLabel(code)}
            </span>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

// ============ MODALE DE CRÉATION ============

function CreateRuleModal({
  prefill,
  onCreate,
  onClose,
}: {
  prefill: { name?: string; trigger?: string; actions?: string[] };
  onCreate: (name: string, trigger: string, actions: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(prefill.name ?? "");
  const [trigger, setTrigger] = useState(prefill.trigger ?? TRIGGERS[0].code);
  const [selectedActions, setSelectedActions] = useState<string[]>(prefill.actions ?? []);
  const [saving, setSaving] = useState(false);

  function toggleAction(code: string) {
    setSelectedActions((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("Le nom de la règle est requis");
      return;
    }
    if (selectedActions.length === 0) {
      toast.error("Sélectionnez au moins une action");
      return;
    }
    setSaving(true);
    try {
      await onCreate(name.trim(), trigger, selectedActions);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <p className="modal-title">Nouvelle règle d'automatisation</p>

        <div className="modal-field">
          <label className="modal-label">Nom de la règle</label>
          <input
            className="modal-input"
            placeholder="Ex. : Archiver les cartes terminées"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="modal-field">
          <label className="modal-label">Déclencheur</label>
          <select
            className="modal-select"
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
          >
            {TRIGGERS.map((t) => (
              <option key={t.code} value={t.code}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="modal-field">
          <label className="modal-label">Actions (sélection multiple)</label>
          <div className="modal-actions-grid">
            {ACTIONS.map((a) => (
              <div
                key={a.code}
                className={`modal-action-check ${selectedActions.includes(a.code) ? "selected" : ""}`}
                onClick={() => toggleAction(a.code)}
              >
                <Icon name={a.icon} size={12} />
                {a.label}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn--ghost" onClick={onClose} disabled={saving}>
            Annuler
          </button>
          <button className="btn btn--primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "Enregistrement…" : "Créer la règle"}
          </button>
        </div>
      </div>
    </div>
  );
}
