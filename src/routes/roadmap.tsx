import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Icon } from "#/features/app/Icon";
import { Avatar } from "#/features/app/primitives";
import { MarketingShell, MkEyebrow } from "#/features/app/MarketingShell";

export const Route = createFileRoute("/roadmap")({
  component: RoadmapRoute,
});

function RoadmapRoute() {
  return (
    <MarketingShell active="roadmap">
      <RoadmapContent />
    </MarketingShell>
  );
}

// ---------------------------------------------------------------------------
// Données
// ---------------------------------------------------------------------------

interface ShippedItem {
  id: string;
  title: string;
  desc: string;
  date: string;
  icon: string;
}

interface ActiveItem {
  id: string;
  title: string;
  desc: string;
  votes: number;
  comments: number;
  owner: string;
  eta: string;
  progress: number;
  hot?: boolean;
}

interface PlannedItem {
  id: string;
  title: string;
  desc: string;
  votes: number;
  comments: number;
  hot?: boolean;
}

interface Roadmap {
  shipped: ShippedItem[];
  now: ActiveItem[];
  next: PlannedItem[];
  later: PlannedItem[];
}

const ROADMAP: Roadmap = {
  shipped: [
    { id: "r1", title: "Vue Board + Calendrier",          desc: "Les 2 vues principales partagent les mêmes cartes.", date: "mars 2026",  icon: "board"  },
    { id: "r2", title: "Modal de carte avec sous-tâches", desc: "Checklist avec barre de progression.",               date: "mars 2026",  icon: "check"  },
    { id: "r3", title: "Command palette (⌘K)",            desc: "Recherche + actions, partout dans l'app.",           date: "avril 2026", icon: "search" },
    { id: "r4", title: "Intégration Slack & GitHub",      desc: "Notifications dans le canal, PR liées aux cartes.", date: "avril 2026", icon: "link"   },
  ],
  now: [
    { id: "r5", title: "Vue Timeline / Gantt",     desc: "Swimlanes par étiquette, drag pour replanifier.",          votes: 47, comments: 12, owner: "u1", eta: "Mai 2026",  progress: 80 },
    { id: "r6", title: "Dashboard de vélocité",    desc: "Vélocité, charge par personne, retards. Auto-généré.",     votes: 38, comments: 8,  owner: "u4", eta: "Mai 2026",  progress: 65 },
    { id: "r7", title: "Docs intégrés",            desc: "Un wiki léger lié aux boards. Sync avec les cartes.",      votes: 52, comments: 18, owner: "u3", eta: "Juin 2026", progress: 40 },
  ],
  next: [
    { id: "r8",  title: "Vue Table avec colonnes custom", desc: "Spreadsheet-like avec champs personnalisés.",                   votes: 64, comments: 21 },
    { id: "r9",  title: "Mobile app (iOS & Android)",     desc: "App native, focus consultation + check rapide.",               votes: 89, comments: 34, hot: true },
    { id: "r10", title: "Automatisations no-code",        desc: "Règles « Quand X → Y », bibliothèque de templates.",           votes: 41, comments: 9  },
    { id: "r11", title: "Sprints & cycles",               desc: "Planning de sprint, burndown, vélocité.",                      votes: 36, comments: 14 },
  ],
  later: [
    { id: "r12", title: "Assistant IA",              desc: "Diviser une carte, résumer un fil, générer un brief.",    votes: 78, comments: 28, hot: true },
    { id: "r13", title: "SSO SAML & SCIM",           desc: "Pour les comptes Entreprise.",                            votes: 22, comments: 4  },
    { id: "r14", title: "API publique + Webhooks",   desc: "REST API, OAuth, événements sortants.",                   votes: 55, comments: 16 },
    { id: "r15", title: "Permissions granulaires",   desc: "Par board, par colonne, par carte si besoin.",             votes: 31, comments: 11 },
    { id: "r16", title: "Time tracking intégré",     desc: "Démarrer/arrêter un timer sur une carte.",                votes: 29, comments: 8  },
  ],
};

// ---------------------------------------------------------------------------
// Sous-composants
// ---------------------------------------------------------------------------

function SectionHead({ title, subtitle, tone }: { title: string; subtitle?: string; tone: "green" | "accent" | "blue" | "subtle" }) {
  const dotColor =
    tone === "green"  ? "var(--green)"        :
    tone === "accent" ? "var(--accent)"       :
    tone === "blue"   ? "var(--blue)"         :
                        "var(--text-subtle)";
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="row" style={{ gap: 10, marginBottom: 4 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
        <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em", margin: 0 }}>{title}</h2>
      </div>
      {subtitle && (
        <p className="text-muted" style={{ margin: "0 0 0 22px", fontSize: 14 }}>{subtitle}</p>
      )}
    </div>
  );
}

function VoteButton({ votes, small = false }: { votes: number; small?: boolean }) {
  const [voted, setVoted] = useState(false);

  return (
    <button
      onClick={(e) => { e.stopPropagation(); setVoted(!voted); }}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        padding: small ? "4px 10px" : "6px 14px",
        background: voted ? "var(--accent-soft)" : "var(--surface)",
        border: "1px solid",
        borderColor: voted ? "var(--accent)" : "var(--border)",
        borderRadius: small ? 8 : 10,
        cursor: "pointer",
        color: voted ? "var(--accent-text)" : "var(--text)",
        transition: "all 0.12s",
        lineHeight: 1,
      }}
      onMouseEnter={(e) => { if (!voted) e.currentTarget.style.borderColor = "var(--border-strong)"; }}
      onMouseLeave={(e) => { if (!voted) e.currentTarget.style.borderColor = "var(--border)"; }}
    >
      <Icon name="chevron" size={small ? 11 : 13} stroke={2.2} style={{ transform: "rotate(90deg)" }} />
      <span style={{ fontFamily: "var(--font-mono)", fontSize: small ? 11 : 12.5, fontWeight: 600, marginTop: 2 }}>
        {votes + (voted ? 1 : 0)}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Page principale
// ---------------------------------------------------------------------------

function RoadmapContent() {
  const totalVotes = [...ROADMAP.now, ...ROADMAP.next, ...ROADMAP.later]
    .reduce((acc, x) => acc + (x.votes || 0), 0);

  return (
    <>
      {/* Hero */}
      <section className="mk-hero">
        <MkEyebrow>Roadmap publique</MkEyebrow>
        <h1 className="mk-h1">
          Ce qu'on construit,<br />
          <span style={{ color: "var(--text-subtle)" }}>en ce moment.</span>
        </h1>
        <p className="mk-sub">
          On vient de lancer la v1. Voici exactement ce sur quoi on travaille,
          ce qui est en réflexion, et ce qui attend. Votez pour ce qui compte
          pour vous — on regarde vraiment.
        </p>
        <div className="row" style={{ marginTop: 24, gap: 8 }}>
          <Link to="/register" className="btn btn--primary">
            Démarrer &amp; voter
          </Link>
          <button className="btn btn--outline">
            <Icon name="chat" size={13} /> Discord communauté
          </button>
          <span className="text-subtle text-xs" style={{ marginLeft: 12 }}>
            {totalVotes} votes au total · mise à jour le 20 mai 2026
          </span>
        </div>
      </section>

      {/* Légende statuts */}
      <section className="mk-section" style={{ paddingTop: 32, paddingBottom: 24 }}>
        <div className="rm-legend">
          {([
            { tone: "green",  label: "Expédié",  n: ROADMAP.shipped.length },
            { tone: "accent", label: "En cours", n: ROADMAP.now.length     },
            { tone: "blue",   label: "Prochain", n: ROADMAP.next.length    },
            { tone: "subtle", label: "Plus tard", n: ROADMAP.later.length  },
          ] as const).map((s, i) => (
            <div key={i} className="rm-legend-item">
              <span className="rm-legend-dot" style={{
                background:
                  s.tone === "green"  ? "var(--green)"        :
                  s.tone === "accent" ? "var(--accent)"       :
                  s.tone === "blue"   ? "var(--blue)"         :
                                        "var(--text-subtle)",
              }} />
              <span style={{ fontWeight: 500, fontSize: 13 }}>{s.label}</span>
              <span className="text-subtle text-xs font-mono">{s.n}</span>
            </div>
          ))}
        </div>
      </section>

      {/* En cours */}
      <section className="mk-section" style={{ paddingTop: 0, paddingBottom: 48 }}>
        <SectionHead
          title="En cours"
          tone="accent"
          subtitle="On travaille dessus en ce moment — visibilité sur l'avancement et l'ETA."
        />
        <div className="rm-cards">
          {ROADMAP.now.map((item) => (
            <article key={item.id} className="rm-card rm-card--now">
              <div className="rm-card-head">
                <span className="rm-status" style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />
                  En cours
                </span>
                <span className="text-subtle text-sm">ETA · {item.eta}</span>
                <span className="spacer" />
                <Avatar user={item.owner} size="sm" title="Owner" />
              </div>
              <h3 className="rm-card-title">{item.title}</h3>
              <p className="rm-card-desc">{item.desc}</p>
              <div className="rm-card-progress">
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 6, fontSize: 11.5 }}>
                  <span className="text-subtle">Avancement</span>
                  <span className="font-mono" style={{ fontWeight: 500 }}>{item.progress}%</span>
                </div>
                <div style={{ height: 6, background: "var(--bg-sunken)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${item.progress}%`,
                    background: "linear-gradient(90deg, var(--accent), oklch(0.62 0.18 295))",
                  }} />
                </div>
              </div>
              <div className="rm-card-foot">
                <VoteButton votes={item.votes} />
                <span className="rm-meta">
                  <Icon name="chat" size={11} stroke={1.6} /> {item.comments} commentaires
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Prochain */}
      <section className="mk-section" style={{ paddingTop: 0, paddingBottom: 48 }}>
        <SectionHead
          title="Prochain"
          tone="blue"
          subtitle="Ce qu'on attaque après. L'ordre dépend en partie de vos votes."
        />
        <div className="rm-cards">
          {ROADMAP.next.map((item) => (
            <article key={item.id} className="rm-card">
              <div className="rm-card-head">
                <span className="rm-status" style={{ background: "var(--blue-soft)", color: "var(--blue)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--blue)" }} />
                  Prochain
                </span>
                {item.hot && (
                  <span className="rm-hot" title="Forte demande de la communauté">
                    🔥 Très demandé
                  </span>
                )}
              </div>
              <h3 className="rm-card-title">{item.title}</h3>
              <p className="rm-card-desc">{item.desc}</p>
              <div className="rm-card-foot">
                <VoteButton votes={item.votes} />
                <span className="rm-meta">
                  <Icon name="chat" size={11} stroke={1.6} /> {item.comments}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Plus tard */}
      <section className="mk-section" style={{ paddingTop: 0, paddingBottom: 48 }}>
        <SectionHead
          title="Plus tard"
          tone="subtle"
          subtitle="En réflexion. Vos votes nous aident à décider quoi promouvoir."
        />
        <div className="rm-cards rm-cards--later">
          {ROADMAP.later.map((item) => (
            <article key={item.id} className="rm-card rm-card--later">
              <div className="rm-card-head">
                <span className="rm-status" style={{ background: "var(--bg-soft)", color: "var(--text-muted)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-subtle)" }} />
                  Plus tard
                </span>
                {item.hot && (
                  <span className="rm-hot" title="Forte demande">🔥 Très demandé</span>
                )}
              </div>
              <h3 className="rm-card-title" style={{ fontSize: 15 }}>{item.title}</h3>
              <p className="rm-card-desc">{item.desc}</p>
              <div className="rm-card-foot">
                <VoteButton votes={item.votes} small />
                <span className="rm-meta text-xs">
                  <Icon name="chat" size={10} stroke={1.6} /> {item.comments}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Récemment expédié */}
      <section className="mk-section" style={{ paddingTop: 24, paddingBottom: 80 }}>
        <SectionHead
          title="Récemment expédié"
          tone="green"
          subtitle={`${ROADMAP.shipped.length} fonctionnalités livrées depuis le lancement public en mars 2026.`}
        />
        <div className="rm-shipped">
          {ROADMAP.shipped.map((item) => (
            <div key={item.id} className="rm-shipped-item">
              <span className="rm-shipped-icon">
                <Icon name="check" size={12} stroke={2.2} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{item.title}</div>
                <div className="text-muted text-sm">{item.desc}</div>
              </div>
              <span className="text-subtle text-xs font-mono">{item.date}</span>
            </div>
          ))}
        </div>
        <Link to="/changelog" className="btn btn--ghost btn--sm" style={{ marginTop: 16 }}>
          Voir le changelog complet →
        </Link>
      </section>

      {/* Proposer une idée */}
      <section className="mk-section" style={{ paddingTop: 0, paddingBottom: 80 }}>
        <div className="rm-submit">
          <div>
            <MkEyebrow color="accent">Votre voix compte</MkEyebrow>
            <h3 style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.015em", margin: "0 0 8px" }}>
              Une idée qu'on n'a pas listée ?
            </h3>
            <p className="text-muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>
              Toutes les suggestions sont lues par l'équipe produit. Les
              meilleures finissent dans la liste ci-dessus, soumises au vote.
            </p>
          </div>
          <div className="row" style={{ gap: 8, alignItems: "flex-end" }}>
            <input
              className="input"
              placeholder="Décrivez votre idée en une phrase…"
              style={{ minWidth: 320 }}
            />
            <button className="btn btn--primary">Proposer</button>
          </div>
        </div>
      </section>

      <style>{`
        .rm-legend {
          display: flex; gap: 24px; flex-wrap: wrap;
          padding: 16px 20px;
          background: var(--bg-soft); border-radius: 100px;
          width: fit-content; margin: 0 auto;
        }
        .rm-legend-item { display: flex; align-items: center; gap: 8px; }
        .rm-legend-dot { width: 8px; height: 8px; border-radius: 50%; }

        .rm-cards {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .rm-cards--later { grid-template-columns: repeat(5, 1fr); }
        .rm-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; padding: 18px 20px;
          display: flex; flex-direction: column;
          transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
        }
        .rm-card:hover {
          border-color: var(--border-strong);
          box-shadow: var(--shadow-sm); transform: translateY(-1px);
        }
        .rm-card--now { border-color: var(--accent); }
        .rm-card--later { padding: 14px 16px; }
        .rm-card-head { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .rm-status {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 2px 8px; border-radius: 100px;
          font-size: 11px; font-weight: 500;
        }
        .rm-hot {
          padding: 2px 8px; border-radius: 100px;
          background: oklch(0.95 0.05 25); color: oklch(0.45 0.16 25);
          font-size: 11px; font-weight: 500;
        }
        .rm-card-title {
          font-size: 16px; font-weight: 500;
          letter-spacing: -0.005em; margin: 0 0 6px;
          line-height: 1.3;
        }
        .rm-card-desc {
          font-size: 13px; color: var(--text-muted);
          margin: 0 0 16px; line-height: 1.55; flex: 1;
        }
        .rm-card-progress { margin-bottom: 14px; }
        .rm-card-foot {
          display: flex; align-items: center; gap: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }
        .rm-meta {
          display: inline-flex; align-items: center; gap: 4px;
          color: var(--text-subtle); font-size: 12px;
          margin-left: auto;
        }

        .rm-shipped {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; overflow: hidden;
        }
        .rm-shipped-item {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 18px;
          border-bottom: 1px solid var(--border);
        }
        .rm-shipped-item:last-child { border-bottom: none; }
        .rm-shipped-icon {
          width: 28px; height: 28px; border-radius: 50%;
          background: var(--green-soft); color: var(--green);
          display: grid; place-items: center; flex: none;
        }

        .rm-submit {
          background: var(--bg-soft); border: 1px solid var(--border);
          border-radius: 16px; padding: 32px 36px;
          display: flex; justify-content: space-between; align-items: center;
          gap: 32px;
        }

        @media (max-width: 880px) {
          .rm-cards { grid-template-columns: 1fr; }
          .rm-cards--later { grid-template-columns: 1fr 1fr; }
          .rm-submit { flex-direction: column; align-items: stretch; }
        }
      `}</style>
    </>
  );
}
