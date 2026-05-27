import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "#/features/app/Icon";
import { Avatar } from "#/features/app/primitives";
import { MarketingShell, MkEyebrow } from "#/features/app/MarketingShell";

export const Route = createFileRoute("/")({ component: LandingRoute });

function LandingRoute() {
  return (
    <MarketingShell active="home">
      <LandingContent />
    </MarketingShell>
  );
}

// ---- Mini-maquettes statiques pour la section "quatre vues" ----

function BoardMini() {
  return (
    <div style={{ display: "flex", gap: 6, height: "100%" }}>
      {[
        { t: "À faire", n: 3, accent: "oklch(0.78 0.08 240)" },
        { t: "En cours", n: 2, accent: "var(--accent)" },
        { t: "Terminé", n: 4, accent: "oklch(0.78 0.08 155)" },
      ].map((col, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: 6,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div className="row" style={{ gap: 4, padding: "0 2px 4px" }}>
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: col.accent,
              }}
            />
            <span style={{ fontSize: 9.5, fontWeight: 500 }}>{col.t}</span>
            <span className="spacer" />
            <span
              style={{
                fontSize: 8.5,
                color: "var(--text-subtle)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {col.n}
            </span>
          </div>
          {Array.from({ length: col.n }).map((_, j) => (
            <div
              key={j}
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: "5px 6px",
              }}
            >
              <div
                style={{
                  height: 3,
                  width: "70%",
                  background: "var(--bg-sunken)",
                  borderRadius: 2,
                  marginBottom: 4,
                }}
              />
              <div
                style={{
                  height: 3,
                  width: "45%",
                  background: "var(--bg-sunken)",
                  borderRadius: 2,
                }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function CalendarMini() {
  const events: { day: number; c: string }[] = [
    { day: 2, c: "var(--accent)" },
    { day: 5, c: "oklch(0.78 0.08 155)" },
    { day: 8, c: "oklch(0.78 0.10 75)" },
    { day: 11, c: "oklch(0.78 0.08 240)" },
    { day: 12, c: "var(--accent)" },
    { day: 16, c: "oklch(0.78 0.10 25)" },
    { day: 19, c: "var(--accent)" },
  ];
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        height: "100%",
        overflow: "hidden",
        display: "grid",
        gridTemplateRows: "auto 1fr",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <div
            key={i}
            style={{
              padding: "4px 0",
              textAlign: "center",
              fontSize: 9,
              color: "var(--text-subtle)",
              fontWeight: 500,
              borderRight: i < 6 ? "1px solid var(--border)" : "none",
            }}
          >
            {d}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gridTemplateRows: "repeat(3, 1fr)",
          gap: 1,
          background: "var(--border)",
        }}
      >
        {Array.from({ length: 21 }).map((_, i) => {
          const ev = events.find((e) => e.day === i);
          const isToday = i === 11;
          return (
            <div
              key={i}
              style={{
                background: "var(--surface)",
                padding: 3,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <span
                style={{
                  fontSize: 8,
                  fontFamily: "var(--font-mono)",
                  background: isToday ? "var(--text)" : "transparent",
                  color: isToday ? "var(--bg)" : "var(--text-muted)",
                  padding: "0 3px",
                  borderRadius: 4,
                  alignSelf: "flex-start",
                }}
              >
                {i + 1}
              </span>
              {ev && (
                <div
                  style={{
                    height: 4,
                    borderRadius: 1,
                    background: ev.c,
                    opacity: 0.85,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelineMini() {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        height: "100%",
        padding: 8,
        display: "flex",
        flexDirection: "column",
        gap: 5,
      }}
    >
      {[
        { l: "Design", start: 0, w: 40, c: "oklch(0.78 0.10 280)" },
        { l: "Infra", start: 20, w: 50, c: "var(--accent)" },
        { l: "Research", start: 10, w: 25, c: "oklch(0.78 0.10 160)" },
        { l: "Copy", start: 35, w: 30, c: "oklch(0.78 0.10 75)" },
        { l: "Growth", start: 50, w: 35, c: "oklch(0.78 0.10 220)" },
      ].map((r, i) => (
        <div key={i} className="row" style={{ gap: 6 }}>
          <span style={{ fontSize: 9, width: 44, color: "var(--text-muted)" }}>
            {r.l}
          </span>
          <div
            style={{
              flex: 1,
              position: "relative",
              height: 14,
              background: "var(--bg-soft)",
              borderRadius: 3,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 1,
                bottom: 1,
                left: `${r.start}%`,
                width: `${r.w}%`,
                background: r.c,
                borderRadius: 2,
              }}
            />
          </div>
        </div>
      ))}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          marginTop: 4,
          paddingTop: 4,
          display: "flex",
          gap: 4,
          fontSize: 8,
          color: "var(--text-subtle)",
          fontFamily: "var(--font-mono)",
          paddingLeft: 50,
        }}
      >
        <span style={{ flex: 1 }}>S19</span>
        <span style={{ flex: 1 }}>S20</span>
        <span style={{ flex: 1 }}>S21</span>
        <span style={{ flex: 1 }}>S22</span>
      </div>
    </div>
  );
}

function DashboardMini() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "auto 1fr",
        gap: 6,
        height: "100%",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 6,
        }}
      >
        {[
          { l: "Actives", v: "34" },
          { l: "Vélocité", v: "5.5" },
          { l: "Retard", v: "2", c: "var(--red)" },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: "6px 8px",
            }}
          >
            <div
              style={{
                fontSize: 8,
                color: "var(--text-subtle)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {s.l}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 16,
                fontWeight: 500,
                color: s.c || "var(--text)",
              }}
            >
              {s.v}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 4,
          padding: 8,
          display: "grid",
          gridTemplateColumns: "repeat(10, 1fr)",
          gap: 3,
          alignItems: "end",
        }}
      >
        {[3, 5, 4, 7, 6, 8, 5, 9, 7, 10].map((v, i) => (
          <div
            key={i}
            style={{
              height: `${v * 9}%`,
              background:
                i === 9 ? "var(--accent)" : "oklch(0.85 0.06 275)",
              borderRadius: "2px 2px 0 0",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ---- Aperçu statique du produit (remplace l'iframe) ----

type ViewId = "board" | "calendar" | "timeline" | "dashboard";

function ProductPreview({ view }: { view: ViewId }) {
  switch (view) {
    case "board":
      return <BoardMini />;
    case "calendar":
      return <CalendarMini />;
    case "timeline":
      return <TimelineMini />;
    case "dashboard":
      return <DashboardMini />;
  }
}

// ---- Contenu principal de la landing ----

function LandingContent() {
  const [viewDemo, setViewDemo] = useState<ViewId>("board");
  const navigate = useNavigate();

  const views: { id: ViewId; icon: string; label: string }[] = [
    { id: "board", icon: "board", label: "Board" },
    { id: "calendar", icon: "calendar", label: "Cal" },
    { id: "timeline", icon: "timeline", label: "Time" },
    { id: "dashboard", icon: "dashboard", label: "Dash" },
  ];

  return (
    <div>
      {/* HERO */}
      <section className="mk-hero" style={{ paddingTop: 88, paddingBottom: 40 }}>
        <div className="landing-eyebrow" style={{ marginBottom: 24 }}>
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "var(--green)",
              display: "inline-block",
            }}
          />
          Lancé en mars 2026 · v1.2 disponible
        </div>
        <h1 className="mk-h1" style={{ fontSize: 88 }}>
          La gestion de projet,
          <br />
          <span style={{ color: "var(--text-subtle)" }}>posée et précise.</span>
        </h1>
        <p className="mk-sub">
          Un seul endroit pour vos boards Kanban, votre calendrier, vos timelines
          et votre documentation. Pensé pour les équipes qui préfèrent la clarté
          aux notifications.
        </p>
        <div className="row" style={{ gap: 10, marginTop: 28 }}>
          <Link to="/register" className="btn btn--primary btn--lg">
            Commencer gratuitement
            <Icon name="arrow" size={14} />
          </Link>
          <button className="btn btn--outline btn--lg">
            Regarder la démo · 2 min
          </button>
        </div>
        <div
          className="row"
          style={{
            marginTop: 16,
            gap: 10,
            fontSize: 12.5,
            color: "var(--text-subtle)",
          }}
        >
          <span>Gratuit pour toujours · jusqu'à 3 boards</span>
          <span style={{ opacity: 0.3 }}>·</span>
          <span>Sans carte bancaire</span>
          <span style={{ opacity: 0.3 }}>·</span>
          <span>Beta publique · 124 équipes à bord</span>
        </div>
      </section>

      {/* PRODUCT DEMO with view switcher */}
      <section
        className="mk-section"
        style={{ paddingTop: 24, paddingBottom: 96 }}
      >
        <div className="ld-product">
          <div className="ld-product-chrome">
            <div className="row" style={{ gap: 6 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#E5E5E2",
                }}
              />
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#E5E5E2",
                }}
              />
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#E5E5E2",
                }}
              />
            </div>
            <span
              style={{
                flex: 1,
                fontSize: 11,
                color: "var(--text-subtle)",
                fontFamily: "var(--font-mono)",
                textAlign: "center",
              }}
            >
              app.flowboard / atelier-m / roadmap-2026
            </span>
            <div
              className="row"
              style={{
                padding: 2,
                background: "var(--bg-soft)",
                borderRadius: 6,
                gap: 0,
              }}
            >
              {views.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setViewDemo(v.id)}
                  style={{
                    gap: 4,
                    padding: "3px 8px",
                    border: "none",
                    borderRadius: 4,
                    background:
                      viewDemo === v.id ? "var(--surface)" : "transparent",
                    boxShadow:
                      viewDemo === v.id ? "var(--shadow-xs)" : "none",
                    fontSize: 11.5,
                    fontWeight: 500,
                    color:
                      viewDemo === v.id ? "var(--text)" : "var(--text-muted)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  <Icon name={v.icon} size={11} style={{ marginRight: 4 }} />
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <div className="ld-product-stage">
            <ProductPreview view={viewDemo} />
          </div>
        </div>
      </section>

      {/* FOUR VIEWS, ONE BOARD */}
      <section
        className="mk-section"
        style={{ paddingTop: 24, paddingBottom: 80 }}
      >
        <div style={{ maxWidth: 680, marginBottom: 48 }}>
          <MkEyebrow>Le produit</MkEyebrow>
          <h2
            style={{
              fontSize: 44,
              letterSpacing: "-0.025em",
              fontWeight: 500,
              margin: "0 0 16px",
              lineHeight: 1.1,
            }}
          >
            Une seule app,
            <br />
            quatre vues sur le même travail.
          </h2>
          <p
            className="text-muted"
            style={{ fontSize: 16, lineHeight: 1.55, margin: 0 }}
          >
            Le board, le calendrier, la timeline et le dashboard partagent les
            mêmes cartes. Changez de perspective, jamais de contexte.
          </p>
        </div>

        <div className="ld-views">
          {(
            [
              {
                icon: "board",
                t: "Board Kanban",
                d: "Colonnes glissantes, cartes riches, étiquettes et avancement.",
                visual: <BoardMini />,
              },
              {
                icon: "calendar",
                t: "Calendrier",
                d: "Glissez-déposez pour replanifier. Toute carte avec une échéance s'y affiche.",
                visual: <CalendarMini />,
              },
              {
                icon: "timeline",
                t: "Timeline / Gantt",
                pro: true,
                d: "Voir les dépendances, repérer les goulets. Pour présenter en réunion.",
                visual: <TimelineMini />,
              },
              {
                icon: "dashboard",
                t: "Dashboard",
                pro: true,
                d: "Charge par personne, vélocité, retards. Tableau de bord auto-généré.",
                visual: <DashboardMini />,
              },
            ] as {
              icon: string;
              t: string;
              d: string;
              pro?: boolean;
              visual: React.ReactNode;
            }[]
          ).map((f, i) => (
            <div key={i} className="ld-view-card">
              <div className="ld-view-visual">{f.visual}</div>
              <div className="ld-view-body">
                <div className="row" style={{ gap: 8 }}>
                  <Icon name={f.icon} size={15} />
                  <span
                    style={{
                      fontWeight: 500,
                      fontSize: 16,
                      letterSpacing: "-0.005em",
                    }}
                  >
                    {f.t}
                  </span>
                  {f.pro && (
                    <span
                      className="badge"
                      style={{
                        background: "var(--accent-soft)",
                        color: "var(--accent-text)",
                        borderColor: "transparent",
                        fontSize: 10,
                      }}
                    >
                      PRO
                    </span>
                  )}
                </div>
                <p
                  className="text-muted"
                  style={{ fontSize: 13.5, lineHeight: 1.55, margin: "8px 0 0" }}
                >
                  {f.d}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECONDARY FEATURES STRIP */}
      <section
        className="mk-section"
        style={{ paddingTop: 0, paddingBottom: 80 }}
      >
        <div className="ld-strip">
          {(
            [
              {
                icon: "docs",
                t: "Docs intégrés",
                d: "Liez une page de spec à une carte. Un wiki léger qui vit à côté de vos boards.",
              },
              {
                icon: "bolt",
                t: "Automatisations",
                d: "« Quand une carte passe en Terminé, archive après 14 jours. » Sans code.",
                pro: true,
              },
              {
                icon: "spark",
                t: "Assistant IA",
                d: "Générer une description, diviser une carte, résumer un fil de commentaires.",
                pro: true,
              },
            ] as { icon: string; t: string; d: string; pro?: boolean }[]
          ).map((f, i) => (
            <div key={i} className="ld-strip-item">
              <div className="ld-strip-icon">
                <Icon name={f.icon} size={16} />
              </div>
              <div>
                <div className="row" style={{ gap: 8 }}>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{f.t}</span>
                  {f.pro && (
                    <span
                      className="badge"
                      style={{
                        background: "var(--accent-soft)",
                        color: "var(--accent-text)",
                        borderColor: "transparent",
                        fontSize: 10,
                      }}
                    >
                      PRO
                    </span>
                  )}
                </div>
                <p
                  className="text-muted"
                  style={{ fontSize: 13, lineHeight: 1.55, margin: "4px 0 0" }}
                >
                  {f.d}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WHY US — COMPARISON */}
      <section
        className="mk-section"
        style={{
          paddingTop: 56,
          paddingBottom: 80,
          borderTop: "1px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: 680, marginBottom: 40 }}>
          <MkEyebrow>Pourquoi Flowboard</MkEyebrow>
          <h2
            style={{
              fontSize: 36,
              letterSpacing: "-0.02em",
              fontWeight: 500,
              margin: "0 0 16px",
              lineHeight: 1.15,
            }}
          >
            La densité de Linear, le drag-and-drop de Trello, les vues de
            Notion.
          </h2>
          <p
            className="text-muted"
            style={{ fontSize: 15, lineHeight: 1.55, margin: 0 }}
          >
            On a refusé de choisir. Voilà ce qui en sort.
          </p>
        </div>
        <div className="ld-compare">
          {[
            {
              t: "Une seule source de vérité",
              d: "Pas de duplication entre l'outil produit et l'outil de planning.",
            },
            {
              t: "Clavier first",
              d: "Un raccourci par action. ⌘K trouve tout en 200ms.",
            },
            {
              t: "Densité réglable",
              d: "Compact pour les power-users, aéré pour le reste de l'équipe.",
            },
            {
              t: "Pas d'IA imposée",
              d: "L'assistant aide, ne décide pas. Toujours désactivable.",
            },
            {
              t: "API ouverte, dès Free",
              d: "Webhooks et REST sur tous les plans, gratuits.",
            },
            {
              t: "Hébergé en Europe",
              d: "Données en France ou Allemagne. RGPD natif, pas en option.",
            },
          ].map((f, i) => (
            <div key={i} className="ld-compare-item">
              <Icon
                name="check"
                size={14}
                stroke={2.2}
                style={{ color: "var(--accent)", flex: "none", marginTop: 2 }}
              />
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{f.t}</div>
                <p
                  className="text-muted"
                  style={{ margin: "4px 0 0", fontSize: 13, lineHeight: 1.55 }}
                >
                  {f.d}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* KEYBOARD SECTION */}
      <section className="ld-keyboard">
        <div className="ld-keyboard-inner">
          <div className="ld-keyboard-grid">
            <div>
              <MkEyebrow>L'expérience</MkEyebrow>
              <h2
                style={{
                  fontSize: 36,
                  letterSpacing: "-0.02em",
                  fontWeight: 500,
                  margin: "0 0 16px",
                  lineHeight: 1.15,
                }}
              >
                Pensé pour les claviers,
                <br />
                fluide à la souris.
              </h2>
              <p
                className="text-muted"
                style={{
                  fontSize: 15,
                  lineHeight: 1.55,
                  margin: "0 0 24px",
                  maxWidth: 380,
                }}
              >
                Plus de 40 raccourcis pour ne plus quitter le clavier. Et tout
                est aussi accessible à la souris, sans modale cachée.
              </p>
              <button className="btn btn--outline">
                Voir tous les raccourcis
              </button>
            </div>
            <div className="ld-shortcuts">
              {(
                [
                  ["⌘ K", "Command palette · tout, partout"],
                  ["C", "Créer une carte sans souris"],
                  ["⌘ B", "Naviguer entre les boards"],
                  ["⌘ /", "Filtrer la vue active"],
                  ["G P", "Aller à la roadmap"],
                  ["?", "Voir tous les raccourcis"],
                ] as [string, string][]
              ).map(([k, l], i) => (
                <div key={i} className="ld-shortcut">
                  <span className="kbd" style={{ fontSize: 11.5, padding: "3px 8px" }}>
                    {k}
                  </span>
                  <span className="text-muted" style={{ fontSize: 13.5 }}>
                    {l}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section
        className="mk-section"
        style={{ paddingTop: 96, paddingBottom: 96 }}
      >
        <div className="ld-testi">
          <blockquote
            style={{
              margin: 0,
              fontSize: 32,
              lineHeight: 1.3,
              letterSpacing: "-0.015em",
              fontWeight: 400,
              maxWidth: 760,
            }}
          >
            <span
              style={{
                fontSize: 48,
                color: "var(--accent)",
                fontFamily: "Georgia, serif",
                lineHeight: 0,
                position: "relative",
                top: 16,
              }}
            >
              "
            </span>
            On a testé trois outils avant Flowboard. C'est le premier où le
            board et le calendrier partagent vraiment les mêmes cartes. Ça
            change tout pour notre standup du lundi.
          </blockquote>
          <div className="row" style={{ gap: 12, marginTop: 32 }}>
            <Avatar user="u3" size="lg" />
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>Claire Dubois</div>
              <div className="text-subtle text-sm">
                Head of Product, Studio Nord · utilise Flowboard depuis avril
              </div>
            </div>
            <span
              style={{
                width: 1,
                height: 28,
                background: "var(--border)",
                margin: "0 16px",
              }}
            />
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => navigate({ to: "/roadmap" })}
            >
              Notre roadmap →
            </button>
          </div>
        </div>
      </section>

      {/* CLIENT LOGOS */}
      <section
        className="mk-section"
        style={{ paddingTop: 0, paddingBottom: 80 }}
      >
        <p
          className="text-subtle"
          style={{
            fontSize: 11.5,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontWeight: 500,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          Quelques équipes à bord depuis le lancement
        </p>
        <div className="ld-logos">
          {["Atelier·M", "Studio Nord", "Orbite", "Fabrique·NV", "Commète"].map(
            (n) => (
              <span
                key={n}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 14,
                  color: "var(--text-subtle)",
                }}
              >
                {n}
              </span>
            )
          )}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mk-cta">
        <h2
          style={{
            fontSize: 48,
            margin: 0,
            letterSpacing: "-0.025em",
            fontWeight: 500,
            lineHeight: 1.05,
          }}
        >
          Commencez en moins d'une minute.
        </h2>
        <p
          className="text-muted"
          style={{ fontSize: 16, marginTop: 16, maxWidth: 480 }}
        >
          Inscription par email. Importez vos cartes depuis n'importe quel CSV.
          On s'occupe du reste.
        </p>
        <div className="row" style={{ gap: 10, marginTop: 28 }}>
          <Link to="/register" className="btn btn--primary btn--lg">
            Créer mon workspace
          </Link>
          <button
            className="btn btn--ghost btn--lg"
            onClick={() => navigate({ to: "/pricing" })}
          >
            Voir les tarifs →
          </button>
        </div>
      </section>

      <style>{`
        .ld-product {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 10px;
          box-shadow: var(--shadow-lg);
        }
        .ld-product-chrome {
          display: flex; align-items: center; gap: 12px;
          padding: 8px 12px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 8px;
        }
        .ld-product-stage {
          height: 560px; overflow: hidden;
          border-radius: 10px; background: var(--bg);
          position: relative;
          padding: 16px;
        }

        .ld-views {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .ld-view-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 0;
          overflow: hidden;
          transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
        }
        .ld-view-card:hover {
          border-color: var(--border-strong);
          box-shadow: var(--shadow-sm);
          transform: translateY(-2px);
        }
        .ld-view-visual {
          background: var(--bg-soft);
          height: 200px; overflow: hidden;
          border-bottom: 1px solid var(--border);
          padding: 16px;
        }
        .ld-view-body { padding: 20px 24px 24px; }

        .ld-strip {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1px; background: var(--border);
          border: 1px solid var(--border); border-radius: 12px;
          overflow: hidden;
        }
        .ld-strip-item {
          background: var(--surface);
          padding: 24px 24px 28px;
          display: flex; gap: 14px;
        }
        .ld-strip-icon {
          width: 36px; height: 36px; border-radius: 8px;
          background: var(--bg-soft); display: grid; place-items: center;
          color: var(--text); flex: none;
        }

        .ld-compare {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 24px 40px;
        }
        .ld-compare-item {
          display: flex; gap: 10px;
        }

        .ld-keyboard {
          background: var(--bg-soft);
          padding: 96px 0;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .ld-keyboard-inner {
          max-width: 1120px; margin: 0 auto;
          padding: 0 32px;
        }
        .ld-keyboard-grid {
          display: grid; grid-template-columns: 1fr 1.2fr;
          gap: 64px; align-items: center;
        }
        .ld-shortcuts {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 14px; padding: 4px 8px;
        }
        .ld-shortcut {
          display: flex; align-items: center; gap: 14px;
          padding: 12px 12px;
          border-bottom: 1px solid var(--border);
        }
        .ld-shortcut:last-child { border-bottom: none; }
        .ld-shortcut .kbd { min-width: 56px; text-align: center; }

        .ld-testi {
          max-width: 880px; margin: 0 auto;
          text-align: left;
        }

        .ld-logos {
          display: flex; justify-content: space-around;
          align-items: center; flex-wrap: wrap; gap: 32px;
          padding: 32px;
          background: var(--bg-soft);
          border-radius: 12px;
        }

        @media (max-width: 880px) {
          .ld-views { grid-template-columns: 1fr; }
          .ld-strip { grid-template-columns: 1fr; }
          .ld-compare { grid-template-columns: 1fr 1fr; }
          .ld-keyboard-grid { grid-template-columns: 1fr; gap: 32px; }
        }
      `}</style>
    </div>
  );
}
