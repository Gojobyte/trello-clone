import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell, MkEyebrow } from "#/features/app/MarketingShell";

export const Route = createFileRoute("/integrations")({
  component: IntegrationsRoute,
});

function IntegrationsRoute() {
  return (
    <MarketingShell active="integrations">
      <IntegrationsContent />
    </MarketingShell>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────

interface FeaturedIntegration {
  name: string;
  cat: string;
  desc: string;
  mark: string;
  color: string;
  users: string;
  featured: boolean;
  pro?: boolean;
}

interface Integration {
  name: string;
  desc: string;
  mark: string;
  color: string;
  pro?: boolean;
}

interface IntegrationGroup {
  cat: string;
  items: Integration[];
}

const POPULAR: FeaturedIntegration[] = [
  { name: "Slack",   cat: "Communication", desc: "Notifications de cartes dans le canal de votre choix. Créez des cartes depuis un message.", mark: "S",  color: "#4A154B", users: "78", featured: true },
  { name: "GitHub",  cat: "Développement", desc: "Liez automatiquement les PR et issues aux cartes. Statut sync.",                           mark: "G",  color: "#1A1A18", users: "52", featured: true },
  { name: "Figma",   cat: "Design",        desc: "Embarquez des frames vivantes dans les cartes. Aperçu cliquable.",                         mark: "F",  color: "#A259FF", users: "34", featured: true },
  { name: "Linear",  cat: "Développement", desc: "Sync bidirectionnel des issues. Migration en 1 clic.",                                     mark: "L",  color: "#5E6AD2", users: "18", featured: true, pro: true },
];

const ALL_GROUPS: IntegrationGroup[] = [
  { cat: "Communication", items: [
    { name: "Slack",           desc: "Notifications + création de cartes", mark: "S",  color: "#4A154B" },
    { name: "Microsoft Teams", desc: "Canaux liés aux boards",             mark: "M",  color: "#5059C9" },
    { name: "Discord",         desc: "Webhooks sur les événements",        mark: "D",  color: "#5865F2" },
    { name: "Email",           desc: "Carte par email entrant",            mark: "@",  color: "#6B6B68" },
  ]},
  { cat: "Développement", items: [
    { name: "GitHub",  desc: "PR, issues, commits",          mark: "G",  color: "#1A1A18" },
    { name: "GitLab",  desc: "Merge requests, CI/CD",        mark: "GL", color: "#FC6D26" },
    { name: "Linear",  desc: "Sync issues",                  mark: "L",  color: "#5E6AD2", pro: true },
    { name: "Sentry",  desc: "Cartes auto sur erreur",       mark: "Se", color: "#362D59", pro: true },
    { name: "Jira",    desc: "Migration & sync",             mark: "J",  color: "#0052CC" },
    { name: "Vercel",  desc: "Déploiements en commentaire",  mark: "V",  color: "#1A1A18" },
  ]},
  { cat: "Design", items: [
    { name: "Figma",  desc: "Frames embarquées",          mark: "F",  color: "#A259FF" },
    { name: "Sketch", desc: "Prévisualisation cartes",    mark: "Sk", color: "#F7B500" },
    { name: "Framer", desc: "Liens de prototypes",        mark: "Fr", color: "#1A1A18" },
    { name: "Penpot", desc: "Frames open source",         mark: "Pp", color: "#1E1E1E" },
  ]},
  { cat: "Productivité & docs", items: [
    { name: "Google Workspace", desc: "Drive, Docs, Calendar",          mark: "Go", color: "#1A73E8" },
    { name: "Notion",           desc: "Pages liées aux cartes",         mark: "N",  color: "#1A1A18" },
    { name: "Loom",             desc: "Vidéos dans les commentaires",   mark: "Lo", color: "#625DF5" },
    { name: "Miro",             desc: "Boards embarqués",               mark: "Mi", color: "#FFD02F" },
  ]},
  { cat: "Stockage & fichiers", items: [
    { name: "Dropbox",  desc: "Fichiers attachés",      mark: "Dr", color: "#0061FF" },
    { name: "OneDrive", desc: "Fichiers Microsoft",     mark: "OD", color: "#0078D4" },
    { name: "Box",      desc: "Stockage entreprise",    mark: "B",  color: "#0061D5" },
  ]},
  { cat: "Analytics & data", items: [
    { name: "PostHog",   desc: "Funnels → cartes",       mark: "Ph", color: "#1A1A18", pro: true },
    { name: "Amplitude", desc: "Events sur cartes",      mark: "Am", color: "#1A1A18", pro: true },
    { name: "Webhook",   desc: "POST personnalisé",      mark: "⚙",  color: "#6B6B68", pro: true },
    { name: "Zapier",    desc: "5 000+ apps en pont",    mark: "Za", color: "#FF4F00" },
  ]},
];

const TOTAL_COUNT = ALL_GROUPS.reduce((a, g) => a + g.items.length, 0);

// ─── Sub-components ───────────────────────────────────────────────────────────

function IntMark({ mark, color, large = false }: { mark: string; color: string; large?: boolean }) {
  return (
    <div
      className={`int-mark${large ? " int-mark--lg" : ""}`}
      style={{ background: color }}
    >
      {mark}
    </div>
  );
}

function ProBadge({ small = false }: { small?: boolean }) {
  return (
    <span
      className="badge"
      style={{
        background: "var(--accent-soft)",
        color: "var(--accent-text)",
        borderColor: "transparent",
        fontSize: small ? 9.5 : 10,
      }}
    >
      PRO
    </span>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

function IntegrationsContent() {
  const [category, setCategory] = useState<string>("all");

  const categories = ["Toutes", ...ALL_GROUPS.map((g) => g.cat)];

  const isActive = (c: string) =>
    c === "Toutes" ? category === "all" : category === c;

  return (
    <>
      {/* Hero */}
      <section className="mk-hero">
        <MkEyebrow>Intégrations</MkEyebrow>
        <h1 className="mk-h1">
          Connecté à vos outils.<br />
          <span style={{ color: "var(--text-subtle)" }}>Pas à votre place.</span>
        </h1>
        <p className="mk-sub">
          Flowboard reste votre source de vérité. Les intégrations apportent
          le contexte — sans déporter vos données ailleurs.
        </p>
      </section>

      {/* Featured */}
      <section className="mk-section">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 500, margin: 0, letterSpacing: "-0.005em" }}>
            Les plus utilisées
          </h2>
          <span className="text-subtle text-sm">
            {POPULAR.length} populaires · {TOTAL_COUNT} au total
          </span>
        </div>
        <div className="int-featured">
          {POPULAR.map((it) => (
            <div key={it.name} className="int-feat-card">
              <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
                <IntMark mark={it.mark} color={it.color} large />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row" style={{ gap: 6 }}>
                    <span style={{ fontWeight: 500, fontSize: 15, letterSpacing: "-0.005em" }}>
                      {it.name}
                    </span>
                    {it.pro && <ProBadge />}
                  </div>
                  <div className="text-subtle text-xs" style={{ marginTop: 2 }}>
                    {it.cat} · {it.users} équipes
                  </div>
                </div>
              </div>
              <p className="text-muted" style={{ fontSize: 13.5, lineHeight: 1.55, margin: "14px 0 16px" }}>
                {it.desc}
              </p>
              <button className="btn btn--outline btn--sm" style={{ width: "100%", justifyContent: "center" }}>
                Configurer
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Category tabs + grid */}
      <section className="mk-section" style={{ paddingTop: 40 }}>
        <div className="row" style={{ gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c === "Toutes" ? "all" : c)}
              style={{
                padding: "5px 12px",
                borderRadius: 100,
                border: "1px solid",
                background: isActive(c) ? "var(--text)" : "var(--surface)",
                color: isActive(c) ? "var(--bg)" : "var(--text-muted)",
                borderColor: isActive(c) ? "var(--text)" : "var(--border)",
                fontSize: 12.5,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="col" style={{ gap: 40 }}>
          {ALL_GROUPS.filter((g) => category === "all" || g.cat === category).map((g) => (
            <div key={g.cat}>
              <h3 style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 14px" }}>
                {g.cat}
              </h3>
              <div className="int-grid">
                {g.items.map((it) => (
                  <div key={it.name} className="int-card">
                    <IntMark mark={it.mark} color={it.color} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="row" style={{ gap: 6 }}>
                        <span style={{ fontWeight: 500, fontSize: 14 }}>{it.name}</span>
                        {it.pro && <ProBadge small />}
                      </div>
                      <div className="text-subtle text-xs" style={{ marginTop: 2 }}>{it.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Build your own — API & Webhooks */}
      <section className="mk-section" style={{ paddingTop: 80 }}>
        <div className="int-build">
          <div>
            <MkEyebrow color="accent">API & Webhooks</MkEyebrow>
            <h2 style={{ fontSize: 32, letterSpacing: "-0.02em", fontWeight: 500, margin: "0 0 16px", lineHeight: 1.15 }}>
              Pas trouvé votre outil ?<br />Construisez-le.
            </h2>
            <p className="text-muted" style={{ fontSize: 15, lineHeight: 1.55, margin: "0 0 24px", maxWidth: 420 }}>
              API REST complète, webhooks sortants, OAuth 2.0 et un SDK
              TypeScript. Une carte en 4 lignes de code.
            </p>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn--primary">Documentation API</button>
              <button className="btn btn--outline">Voir un exemple</button>
            </div>
          </div>
          <div className="int-code">
            <div className="int-code-head">
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "oklch(0.78 0.10 25)" }} />
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "oklch(0.82 0.10 75)" }} />
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "oklch(0.78 0.10 155)" }} />
              <span style={{ marginLeft: 8, fontSize: 11, color: "var(--text-subtle)", fontFamily: "var(--font-mono)" }}>
                create-card.ts
              </span>
            </div>
            <pre style={{ margin: 0, padding: "20px 22px", fontSize: 12.5, lineHeight: 1.7, fontFamily: "var(--font-mono)", overflow: "auto" }}>
{`import { Flowboard } from '@flowboard/sdk';

const fb = new Flowboard(process.env.FB_TOKEN);

await fb.cards.create({
  board:    'roadmap-2026',
  column:   'todo',
  title:    'Refactor card modal',
  labels:   ['design', 'tech-debt'],
  assignees:['lea@atelier-m.fr'],
  due:      '2026-06-15',
});`}
            </pre>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mk-cta">
        <h2 style={{ fontSize: 36, margin: 0, letterSpacing: "-0.02em", fontWeight: 500 }}>
          Toutes ces intégrations, gratuites.
        </h2>
        <p className="text-muted" style={{ fontSize: 15, marginTop: 12, maxWidth: 480 }}>
          Aucune restriction sur le plan Free — vous payez Premium pour les vues
          avancées et l'automatisation, pas pour brancher Slack.
        </p>
        <div className="row" style={{ gap: 10, marginTop: 24 }}>
          <Link to="/register" className="btn btn--primary btn--lg">
            Démarrer gratuitement
          </Link>
          <Link to="/pricing" className="btn btn--ghost btn--lg">
            Voir les tarifs →
          </Link>
        </div>
      </section>

      <style>{`
        .int-featured {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        .int-feat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
        }
        .int-feat-card:hover {
          border-color: var(--border-strong);
          box-shadow: var(--shadow-sm);
          transform: translateY(-1px);
        }
        .int-mark {
          width: 32px; height: 32px; border-radius: 7px;
          display: grid; place-items: center;
          color: white; font-weight: 600; font-size: 12.5px;
          flex: none;
          font-family: var(--font-sans);
        }
        .int-mark--lg { width: 44px; height: 44px; border-radius: 10px; font-size: 16px; }
        .int-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .int-card {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          transition: border-color 0.12s, background 0.12s;
          cursor: pointer;
        }
        .int-card:hover { border-color: var(--border-strong); background: var(--surface-hover); }
        .int-build {
          display: grid; grid-template-columns: 1fr 1.2fr;
          gap: 48px; align-items: center;
        }
        .int-code {
          background: #18181A; color: #E8E8E5;
          border-radius: 12px; overflow: hidden;
          border: 1px solid var(--border);
        }
        .int-code-head {
          display: flex; align-items: center; gap: 6px;
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
        }
        @media (max-width: 920px) {
          .int-featured { grid-template-columns: 1fr 1fr; }
          .int-grid { grid-template-columns: 1fr 1fr; }
          .int-build { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
