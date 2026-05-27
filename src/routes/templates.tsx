import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Icon } from "#/features/app/Icon";
import { AppShell } from "#/features/app/AppShell";
import { api } from "../../convex/_generated/api";

// ============ DONNÉES ============

const TEMPLATE_CATS = [
  { id: "all", label: "Toutes", count: 22 },
  { id: "product", label: "Produit", count: 6 },
  { id: "design", label: "Design", count: 4 },
  { id: "engineering", label: "Ingénierie", count: 5 },
  { id: "marketing", label: "Marketing", count: 4 },
  { id: "ops", label: "Opérations & RH", count: 3 },
];

interface Template {
  id: string;
  cat: string;
  name: string;
  emoji: string;
  accent: string;
  desc: string;
  cards: number;
  by: string;
  uses: number;
  featured?: boolean;
}

const TEMPLATES: Template[] = [
  { id: "t1", cat: "product", name: "Roadmap produit · pondérée RICE", emoji: "◆", accent: "#5B53C7", desc: "4 colonnes + champ pondération RICE. Filtre par initiative.", cards: 24, by: "Équipe Flowboard", uses: 1840, featured: true },
  { id: "t2", cat: "product", name: "Discovery & user research", emoji: "◉", accent: "#C45C8E", desc: "De l’insight au prototype validé. Inclut un canvas Jobs to be done.", cards: 16, by: "Studio Nord", uses: 410, featured: true },
  { id: "t3", cat: "engineering", name: "Sprint agile · 2 semaines", emoji: "◇", accent: "#3E8E72", desc: "Backlog → Sprint → En cours → En revue → Done. Burndown auto.", cards: 18, by: "Équipe Flowboard", uses: 2150, featured: true },
  { id: "t4", cat: "engineering", name: "Roadmap d’infra & migrations", emoji: "◊", accent: "#5C8EC4", desc: "Plan de migration en plusieurs phases, avec rollback et dépendances.", cards: 32, by: "Orbite", uses: 320 },
  { id: "t5", cat: "engineering", name: "Bug triage & QA", emoji: "◌", accent: "#A38B3F", desc: "Pipeline bug reports → priorisation → fix → vérif. Métriques MTTR.", cards: 14, by: "Équipe Flowboard", uses: 680 },
  { id: "t6", cat: "engineering", name: "Incidents & post-mortem", emoji: "◈", accent: "#C45C8E", desc: "Réponse à incident, ownership, timeline, post-mortem template.", cards: 8, by: "Méridien", uses: 95 },
  { id: "t7", cat: "design", name: "Design system · build & maintien", emoji: "◇", accent: "#7C5CC4", desc: "Tokens → composants → docs → adoption. Avec versionning.", cards: 22, by: "Atelier·M", uses: 540, featured: true },
  { id: "t8", cat: "design", name: "Design review hebdomadaire", emoji: "◉", accent: "#5B53C7", desc: "Lundi : à présenter. Mardi : reviewé. Vendredi : itéré.", cards: 9, by: "Studio Nord", uses: 220 },
  { id: "t9", cat: "design", name: "Brand identity refresh", emoji: "◈", accent: "#C45C8E", desc: "Audit → moodboard → exploration → décision → application.", cards: 28, by: "Fabrique·NV", uses: 130 },
  { id: "t10", cat: "design", name: "Asset library & ressources", emoji: "◌", accent: "#A38B3F", desc: "Logos, illustrations, photos. Avec licences et statut d’usage.", cards: 40, by: "Loupe & Co", uses: 88 },
  { id: "t11", cat: "marketing", name: "Lancement produit · 8 semaines", emoji: "◆", accent: "#3E8E72", desc: "Calendrier complet de lancement, content + comms + events.", cards: 36, by: "Équipe Flowboard", uses: 480 },
  { id: "t12", cat: "marketing", name: "Editorial calendar", emoji: "◉", accent: "#7C5CC4", desc: "Idée → brief → écriture → relecture → publication. Multi-canal.", cards: 24, by: "Studio Nord", uses: 320 },
  { id: "t13", cat: "marketing", name: "Funnel d’acquisition organique", emoji: "◇", accent: "#5C8EC4", desc: "SEO, partenariats, communauté, ads. Avec mesures par canal.", cards: 18, by: "Comète", uses: 140 },
  { id: "t14", cat: "marketing", name: "Events & meetups", emoji: "◈", accent: "#C45C8E", desc: "Sourcing speaker, logistique, comms pré/post. Réutilisable par event.", cards: 22, by: "Plein Sud", uses: 65 },
  { id: "t15", cat: "ops", name: "Recrutement · pipeline candidats", emoji: "◉", accent: "#5B53C7", desc: "Sourcing → entretien tech → final → offre. Avec scorecards.", cards: 16, by: "Équipe Flowboard", uses: 920 },
  { id: "t16", cat: "ops", name: "Onboarding nouvelle recrue", emoji: "◊", accent: "#3E8E72", desc: "Avant J1, semaine 1, mois 1, mois 3. Checklist personnalisable.", cards: 28, by: "Méridien", uses: 240 },
  { id: "t17", cat: "ops", name: "OKR trimestriels", emoji: "◆", accent: "#A38B3F", desc: "Définition, suivi, check-in mensuel, retro de fin de trimestre.", cards: 12, by: "Orbite", uses: 380 },
  { id: "t18", cat: "product", name: "Feedback utilisateur", emoji: "◌", accent: "#7C5CC4", desc: "Collecte multi-canal → tri par thème → priorisation → réponse.", cards: 14, by: "Cale Sèche", uses: 175 },
  { id: "t19", cat: "product", name: "Compétiteurs & veille", emoji: "◈", accent: "#5C8EC4", desc: "Suivi des concurrents, releases, prix. Mis à jour mensuellement.", cards: 18, by: "Studio Nord", uses: 95 },
  { id: "t20", cat: "product", name: "A/B tests & expérimentations", emoji: "◇", accent: "#3E8E72", desc: "Hypothèse → setup → résultats → décision. Avec stats de signif.", cards: 14, by: "PostHog", uses: 110 },
  { id: "t21", cat: "product", name: "Pricing & monétisation", emoji: "◆", accent: "#C45C8E", desc: "Itérations pricing, A/B, segmentation, plans Free/Premium.", cards: 12, by: "Orbite", uses: 60 },
  { id: "t22", cat: "engineering", name: "Migration legacy → moderne", emoji: "◊", accent: "#5B53C7", desc: "Plan étape par étape, avec stratégie de coexistence et rollback.", cards: 22, by: "Équipe Flowboard", uses: 95 },
];

// Structures réelles instanciées par modèle — listes + cartes de départ.
type Blueprint = { color: string; lists: Array<{ name: string; cards: string[] }> };

const CATEGORY_BLUEPRINT: Record<string, Blueprint> = {
  product: {
    color: "indigo",
    lists: [
      { name: "Idées", cards: ["Collecter les retours utilisateurs", "Analyser la concurrence", "Nouvelle idée de fonctionnalité"] },
      { name: "Planifié", cards: ["Spécifier le prochain incrément", "Estimer l'effort"] },
      { name: "En cours", cards: ["Première itération"] },
      { name: "Livré", cards: [] },
    ],
  },
  engineering: {
    color: "emerald",
    lists: [
      { name: "Backlog", cards: ["Dette technique à traiter", "Bug à investiguer", "Amélioration de performance"] },
      { name: "Sprint", cards: ["Tâche prioritaire du sprint"] },
      { name: "En cours", cards: [] },
      { name: "En revue", cards: [] },
      { name: "Terminé", cards: [] },
    ],
  },
  design: {
    color: "violet",
    lists: [
      { name: "À explorer", cards: ["Moodboard & références", "Explorations de direction"] },
      { name: "En cours", cards: ["Maquettes haute fidélité"] },
      { name: "En revue", cards: [] },
      { name: "Validé", cards: [] },
    ],
  },
  marketing: {
    color: "amber",
    lists: [
      { name: "Idées", cards: ["Sujet d'article", "Idée de campagne"] },
      { name: "En production", cards: ["Rédaction en cours"] },
      { name: "Planifié", cards: ["Programmé pour publication"] },
      { name: "Publié", cards: [] },
    ],
  },
  ops: {
    color: "teal",
    lists: [
      { name: "À faire", cards: ["Première tâche", "Deuxième tâche"] },
      { name: "En cours", cards: [] },
      { name: "Terminé", cards: [] },
    ],
  },
};

function blueprintFor(t: Template): Blueprint {
  return CATEGORY_BLUEPRINT[t.cat] ?? CATEGORY_BLUEPRINT.ops;
}

// ============ ROUTE ============

export const Route = createFileRoute("/templates")({
  component: TemplatesRoute,
});

function TemplatesRoute() {
  return (
    <AppShell active={{ route: "templates" }} title="Templates">
      <TemplatesContent />
    </AppShell>
  );
}

// ============ CONTENU ============

function TemplatesContent() {
  const navigate = useNavigate();
  const createFromTemplate = useMutation(api.templates.createFromTemplate);
  const [cat, setCat] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("popular");
  const [creatingId, setCreatingId] = useState<string | null>(null);

  async function handleUse(t: Template) {
    if (creatingId) return;
    setCreatingId(t.id);
    try {
      const bp = blueprintFor(t);
      const boardId = await createFromTemplate({
        name: t.name,
        color: bp.color,
        lists: bp.lists,
      });
      toast.success("Tableau créé depuis le modèle");
      navigate({ to: "/boards/$boardId", params: { boardId } });
    } catch {
      toast.error("Impossible de créer le tableau");
      setCreatingId(null);
    }
  }

  const filtered = TEMPLATES.filter((t) => cat === "all" || t.cat === cat)
    .filter((t) => !query || t.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) =>
      sort === "popular" ? b.uses - a.uses : a.name.localeCompare(b.name),
    );

  const featured = TEMPLATES.filter((t) => t.featured).slice(0, 3);

  return (
    <div className="view-inner">
      {/* En-tête */}
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.015em", margin: 0 }}>
            Templates
          </h1>
          <p className="text-muted text-sm" style={{ margin: "4px 0 0" }}>
            {TEMPLATES.length} modèles · démarrez un tableau en 10 secondes
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button type="button" className="btn btn--outline" onClick={() => navigate({ to: "/boards" })}>
            <Icon name="folder" size={13} /> Mes tableaux
          </button>
        </div>
      </div>

      {/* Mis en avant */}
      <div style={{ marginTop: 28 }}>
        <span
          className="text-subtle text-xs"
          style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}
        >
          Mis en avant
        </span>
        <div className="tpl-featured">
          {featured.map((t) => (
            <article key={t.id} className="tpl-feat">
              <div
                className="tpl-feat-cover"
                style={{
                  background: `linear-gradient(160deg, ${t.accent}, ${t.accent}cc)`,
                }}
              >
                <span className="tpl-feat-emoji">{t.emoji}</span>
                <span className="tpl-feat-uses">{t.uses.toLocaleString("fr-FR")} équipes</span>
              </div>
              <div className="tpl-feat-body">
                <div style={{ fontWeight: 500, fontSize: 15, letterSpacing: "-0.005em", marginBottom: 4 }}>
                  {t.name}
                </div>
                <p className="text-muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
                  {t.desc}
                </p>
                <div className="row" style={{ marginTop: 14, gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    disabled={creatingId !== null}
                    onClick={() => handleUse(t)}
                  >
                    {creatingId === t.id ? "Création…" : "Utiliser ce modèle"}
                  </button>
                  <span className="spacer" />
                  <span className="text-subtle text-xs">par {t.by}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Recherche + tri */}
      <div className="row" style={{ marginTop: 32, gap: 8 }}>
        <div
          className="row"
          style={{
            flex: 1,
            maxWidth: 360,
            padding: "5px 10px",
            background: "var(--surface)",
            border: "1px solid var(--border-strong)",
            borderRadius: 6,
            gap: 6,
          }}
        >
          <Icon name="search" size={14} stroke={1.6} style={{ color: "var(--text-subtle)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un modèle…"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 13,
            }}
          />
        </div>
        <span className="spacer" />
        <div className="row" style={{ padding: 2, background: "var(--bg-soft)", borderRadius: 6, gap: 0 }}>
          {(
            [
              ["popular", "Populaires"],
              ["name", "A → Z"],
            ] as [string, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSort(id)}
              style={{
                padding: "4px 12px",
                border: "none",
                borderRadius: 4,
                background: sort === id ? "var(--surface)" : "transparent",
                boxShadow: sort === id ? "var(--shadow-xs)" : "none",
                fontSize: 12.5,
                fontWeight: 500,
                color: sort === id ? "var(--text)" : "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar catégories + grille */}
      <div className="tpl-grid-wrap">
        <aside className="tpl-cats">
          {TEMPLATE_CATS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              className={`tpl-cat ${cat === c.id ? "active" : ""}`}
            >
              <span>{c.label}</span>
              <span className="text-subtle text-xs font-mono">{c.count}</span>
            </button>
          ))}
        </aside>

        <div>
          <div className="row" style={{ marginBottom: 12 }}>
            <span className="text-subtle text-sm">{filtered.length} modèles</span>
          </div>
          <div className="tpl-grid">
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                className="tpl-card"
                disabled={creatingId !== null}
                onClick={() => handleUse(t)}
                title="Créer un tableau depuis ce modèle"
              >
                <div
                  className="tpl-cover"
                  style={{ background: `linear-gradient(160deg, ${t.accent}aa, ${t.accent}55)` }}
                >
                  <span style={{ fontSize: 22, color: "white", textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
                    {creatingId === t.id ? "…" : t.emoji}
                  </span>
                </div>
                <div className="tpl-body">
                  <div style={{ fontWeight: 500, fontSize: 14, letterSpacing: "-0.005em" }}>{t.name}</div>
                  <p
                    className="text-muted"
                    style={{
                      margin: "4px 0 0",
                      fontSize: 12.5,
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {t.desc}
                  </p>
                  <div className="row text-subtle text-xs" style={{ marginTop: 10, gap: 10 }}>
                    <span className="row" style={{ gap: 4 }}>
                      <Icon name="board" size={10} stroke={1.6} /> {t.cards}
                    </span>
                    <span className="row" style={{ gap: 4 }}>
                      <Icon name="user" size={10} stroke={1.6} /> {t.uses.toLocaleString("fr-FR")}
                    </span>
                    <span className="spacer" />
                    <span>{t.by}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .tpl-featured {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 12px; margin-top: 12px;
        }
        .tpl-feat {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px; overflow: hidden;
          display: flex; flex-direction: column;
          transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
        }
        .tpl-feat:hover {
          border-color: var(--border-strong);
          box-shadow: var(--shadow-sm); transform: translateY(-1px);
        }
        .tpl-feat-cover {
          height: 100px; position: relative;
          padding: 16px; color: white;
          display: flex; justify-content: space-between; align-items: flex-end;
        }
        .tpl-feat-emoji { font-size: 28px; line-height: 1; }
        .tpl-feat-uses {
          font-size: 11px; font-family: var(--font-mono);
          background: rgba(255,255,255,0.18); padding: 2px 8px; border-radius: 100px;
          backdrop-filter: blur(8px);
        }
        .tpl-feat-body { padding: 16px 18px 18px; flex: 1; display: flex; flex-direction: column; }

        .tpl-grid-wrap {
          display: grid; grid-template-columns: 200px 1fr;
          gap: 32px; margin-top: 24px;
        }
        .tpl-cats {
          display: flex; flex-direction: column;
          gap: 1px; position: sticky; top: 16px; align-self: start;
        }
        .tpl-cat {
          display: flex; align-items: center; gap: 8px;
          padding: 5px 10px; border-radius: 6px;
          border: none; background: transparent;
          font-size: 13px; color: var(--text-muted);
          cursor: pointer; text-align: left; width: 100%;
          transition: background 0.12s, color 0.12s;
        }
        .tpl-cat > span:first-child { flex: 1; }
        .tpl-cat:hover { background: var(--surface-hover); color: var(--text); }
        .tpl-cat.active {
          background: var(--surface); color: var(--text);
          box-shadow: var(--shadow-xs); font-weight: 500;
        }

        .tpl-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .tpl-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px; overflow: hidden;
          cursor: pointer; text-align: left; padding: 0;
          transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
        }
        .tpl-card:hover {
          border-color: var(--border-strong);
          box-shadow: var(--shadow-sm); transform: translateY(-1px);
        }
        .tpl-card:disabled { opacity: 0.6; cursor: default; }
        .tpl-cover {
          height: 64px;
          display: flex; align-items: center; justify-content: center;
        }
        .tpl-body { padding: 12px 14px 14px; }

        @media (max-width: 920px) {
          .tpl-featured { grid-template-columns: 1fr; }
          .tpl-grid-wrap { grid-template-columns: 1fr; }
          .tpl-cats { flex-direction: row; flex-wrap: wrap; position: static; }
          .tpl-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
