import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Icon } from "#/features/app/Icon";
import { MarketingShell } from "#/features/app/MarketingShell";

export const Route = createFileRoute("/pricing")({
  component: PricingRoute,
});

function PricingRoute() {
  return (
    <MarketingShell active="pricing">
      <PricingContent />
    </MarketingShell>
  );
}

type FeatureEntry = [string, boolean, { strong?: boolean }?];

interface Plan {
  name: string;
  tag: string;
  price: { m: number; y: number } | string;
  cta: string;
  ctaStyle: string;
  featured?: boolean;
  features: FeatureEntry[];
}

const PLANS: Plan[] = [
  {
    name: "Free",
    tag: "Pour démarrer",
    price: { m: 0, y: 0 },
    cta: "Commencer gratuitement",
    ctaStyle: "outline",
    features: [
      ["Boards illimités, jusqu'à 3 actifs", true],
      ["Vue Board + Calendrier", true],
      ["Cartes : checklist, étiquettes, échéances", true],
      ["Jusqu'à 10 membres par workspace", true],
      ["Historique sur 14 jours", true],
      ["Vue Timeline & Dashboard", false],
      ["Automatisations", false],
      ["Assistant IA", false],
      ["Champs personnalisés", false],
      ["SSO & permissions avancées", false],
    ],
  },
  {
    name: "Premium",
    tag: "Pour les équipes qui livrent",
    price: { m: 12, y: 9 },
    cta: "Démarrer l'essai",
    ctaStyle: "accent",
    featured: true,
    features: [
      ["Tout du plan Free, plus :", true, { strong: true }],
      ["Boards et membres illimités", true],
      ["Vue Timeline + Dashboard", true],
      ["Automatisations no-code", true],
      ["Assistant IA (génération, division, résumé)", true],
      ["Champs personnalisés illimités", true],
      ["Historique sur 12 mois", true],
      ["Intégrations Slack, GitHub, Figma, Linear", true],
      ["Modèles d'équipe & templates avancés", true],
      ["Support prioritaire", true],
    ],
  },
  {
    name: "Entreprise",
    tag: "Pour les organisations",
    price: "Sur devis",
    cta: "Nous contacter",
    ctaStyle: "outline",
    features: [
      ["Tout du plan Premium, plus :", true, { strong: true }],
      ["SSO SAML & SCIM", true],
      ["Permissions granulaires par board", true],
      ["Audit log & rétention paramétrable", true],
      ["Contrat DPA, BAA, MSA personnalisé", true],
      ["SLA 99.99% garanti", true],
      ["Customer Success dédié", true],
      ["On-boarding équipe sur place", true],
      ["Domaines multiples", true],
      ["Sandbox de pré-production", true],
    ],
  },
];

const COMPARE_ROWS: string[][] = [
  ["Boards actifs", "3", "Illimités", "Illimités"],
  ["Membres par workspace", "10", "Illimités", "Illimités"],
  ["Historique", "14 jours", "12 mois", "Paramétrable"],
  ["Vues", "Board + Calendrier", "Toutes (+ Timeline, Dashboard)", "Toutes"],
  ["Automatisations", "—", "100 actions / mois", "Illimitées"],
  ["Champs personnalisés", "—", "Illimités", "Illimités"],
  ["Assistant IA", "—", "✓", "✓"],
  ["SSO SAML / SCIM", "—", "—", "✓"],
  ["Audit log", "—", "—", "✓"],
  ["SLA", "—", "99.9%", "99.99%"],
  ["Support", "Communauté", "Email prioritaire", "CSM dédié"],
];

const FAQ_ITEMS: [string, string][] = [
  [
    "Puis-je changer de plan à tout moment ?",
    "Oui. Le passage à Premium est immédiat ; la rétrogradation prend effet à la fin de la période en cours. Aucun frais caché.",
  ],
  [
    "Que se passe-t-il à la fin de l'essai Premium ?",
    "L'essai dure 14 jours. À la fin, votre workspace revient automatiquement au plan Free — vous gardez vos données, seules les fonctionnalités Premium se désactivent.",
  ],
  [
    "Y a-t-il une remise pour les associations et l'éducation ?",
    "Oui — 50% sur Premium pour les associations à but non lucratif et les établissements éducatifs. Contactez-nous avec un justificatif.",
  ],
  [
    "Comment est facturé Premium ?",
    "Par utilisateur actif et par mois. Vous pouvez ajouter ou retirer des membres à tout moment, la facture est ajustée au prorata.",
  ],
  [
    "Mes données restent-elles privées ?",
    "Oui. Vos données ne sont jamais utilisées pour entraîner des modèles tiers. Hébergement en France et en Allemagne, conforme RGPD.",
  ],
];

function PricingContent() {
  const [yearly, setYearly] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="pricing">
      {/* Hero */}
      <section
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "80px 32px 24px",
          textAlign: "center",
        }}
      >
        <div className="landing-eyebrow" style={{ margin: "0 auto 20px" }}>
          Tarifs
        </div>
        <h1
          style={{
            fontSize: 64,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            fontWeight: 500,
            margin: "0 0 16px",
          }}
        >
          Simple. Équitable.
          <br />
          <span style={{ color: "var(--text-subtle)" }}>Sans surprise.</span>
        </h1>
        <p
          className="text-muted"
          style={{ fontSize: 17, maxWidth: 540, margin: "0 auto" }}
        >
          Commencez gratuitement, passez en Premium quand votre équipe a besoin
          des vues avancées et de l'automatisation.
        </p>

        {/* Toggle Mensuel / Annuel */}
        <div
          className="row"
          style={{
            justifyContent: "center",
            marginTop: 32,
            gap: 0,
            padding: 3,
            background: "var(--bg-soft)",
            borderRadius: 100,
            display: "inline-flex",
            border: "1px solid var(--border)",
          }}
        >
          {(
            [
              { id: false, label: "Mensuel" },
              { id: true, label: "Annuel", badge: "−25%" },
            ] as { id: boolean; label: string; badge?: string }[]
          ).map((t) => (
            <button
              key={String(t.id)}
              onClick={() => setYearly(t.id)}
              className="row"
              style={{
                gap: 8,
                padding: "6px 16px",
                border: "none",
                borderRadius: 100,
                background:
                  yearly === t.id ? "var(--surface)" : "transparent",
                boxShadow: yearly === t.id ? "var(--shadow-sm)" : "none",
                fontSize: 13,
                fontWeight: 500,
                color:
                  yearly === t.id ? "var(--text)" : "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              {t.label}
              {t.badge && (
                <span
                  style={{
                    fontSize: 10,
                    padding: "1px 6px",
                    borderRadius: 100,
                    background: "var(--accent-soft)",
                    color: "var(--accent-text)",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 500,
                  }}
                >
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Plans grid + comparison + FAQ */}
      <section
        style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 32px 96px" }}
      >
        {/* Cards */}
        <div className="pricing-grid">
          {PLANS.map((p, i) => {
            const numericPrice =
              typeof p.price !== "string" ? p.price : null;
            return (
              <div
                key={i}
                className={`pricing-card${p.featured ? " pricing-card--featured" : ""}`}
              >
                {p.featured && (
                  <div className="pricing-featured-tag">
                    <Icon name="spark" size={11} /> Recommandé
                  </div>
                )}
                <div className="pricing-head">
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 20,
                      fontWeight: 500,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {p.name}
                  </h3>
                  <p className="text-muted text-sm" style={{ margin: "4px 0 0" }}>
                    {p.tag}
                  </p>
                </div>

                <div className="pricing-price">
                  {numericPrice === null ? (
                    <span
                      style={{
                        fontSize: 36,
                        fontWeight: 500,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {p.price as string}
                    </span>
                  ) : (
                    <>
                      <span className="pricing-currency">€</span>
                      <span className="pricing-amount">
                        {yearly ? numericPrice.y : numericPrice.m}
                      </span>
                      <span className="pricing-period">
                        {numericPrice.m === 0 ? "" : "/ utilisateur / mois"}
                      </span>
                    </>
                  )}
                  {yearly && numericPrice !== null && numericPrice.y > 0 && (
                    <div
                      className="text-subtle text-xs"
                      style={{ marginTop: 4 }}
                    >
                      Facturé annuellement · {numericPrice.y * 12}€/an
                    </div>
                  )}
                </div>

                <button
                  className={`btn btn--${p.ctaStyle} btn--lg`}
                  style={{ justifyContent: "center", marginTop: 8 }}
                  onClick={() => {
                    if (p.name === "Free") void navigate({ to: "/register" });
                  }}
                >
                  {p.cta}
                </button>

                <div className="divider" />

                <ul className="pricing-features">
                  {p.features.map((f, j) => (
                    <li key={j} style={{ fontWeight: f[2]?.strong ? 500 : 400 }}>
                      {f[1] ? (
                        <Icon
                          name="check"
                          size={13}
                          stroke={2}
                          style={{ color: "var(--accent)", flex: "none" }}
                        />
                      ) : (
                        <Icon
                          name="x"
                          size={13}
                          stroke={1.6}
                          style={{
                            color: "var(--text-subtle)",
                            flex: "none",
                          }}
                        />
                      )}
                      <span
                        style={{
                          color: f[1] ? "var(--text)" : "var(--text-subtle)",
                        }}
                      >
                        {f[0]}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Comparison table */}
        <section style={{ marginTop: 96 }}>
          <h2
            className="text-2xl"
            style={{
              marginBottom: 32,
              textAlign: "center",
              letterSpacing: "-0.02em",
            }}
          >
            Comparer en détail
          </h2>
          <div className="pricing-compare">
            <table>
              <thead>
                <tr>
                  <th style={{ width: "40%" }}></th>
                  <th>Free</th>
                  <th style={{ color: "var(--accent-text)" }}>Premium</th>
                  <th>Entreprise</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>
                        {cell === "✓" ? (
                          <Icon
                            name="check"
                            size={14}
                            stroke={2}
                            style={{ color: "var(--accent)" }}
                          />
                        ) : cell === "—" ? (
                          <span style={{ color: "var(--text-subtle)" }}>
                            —
                          </span>
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section
          style={{ marginTop: 96, maxWidth: 720, margin: "96px auto 0" }}
        >
          <h2
            className="text-2xl"
            style={{
              marginBottom: 32,
              textAlign: "center",
              letterSpacing: "-0.02em",
            }}
          >
            Questions fréquentes
          </h2>
          <div className="col" style={{ gap: 0 }}>
            {FAQ_ITEMS.map(([q, a], i) => (
              <details key={i} className="pricing-faq">
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
      </section>

      <style>{`
        .pricing { background: var(--bg); min-height: 100%; }
        .pricing-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .pricing-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 28px 28px 32px;
          display: flex; flex-direction: column; gap: 16px;
          position: relative;
        }
        .pricing-card--featured {
          border-color: var(--text);
          background: linear-gradient(180deg, var(--surface), oklch(0.985 0.012 275));
          box-shadow: var(--shadow-md);
        }
        .pricing-featured-tag {
          position: absolute; top: -10px; left: 28px;
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 9px; background: var(--text); color: var(--bg);
          border-radius: 100px; font-size: 11px; font-weight: 500;
          letter-spacing: 0.01em;
        }
        .pricing-head { margin-bottom: 4px; }
        .pricing-price {
          display: flex; align-items: baseline; gap: 4px;
          flex-wrap: wrap;
        }
        .pricing-currency {
          font-size: 22px; color: var(--text-muted);
          font-weight: 500;
        }
        .pricing-amount {
          font-size: 56px; font-weight: 500;
          letter-spacing: -0.03em; line-height: 1;
          font-family: var(--font-mono);
        }
        .pricing-period {
          font-size: 13px; color: var(--text-muted);
          margin-left: 4px;
        }
        .pricing-features {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 10px;
        }
        .pricing-features li {
          display: flex; align-items: flex-start; gap: 10px;
          font-size: 13.5px; line-height: 1.45;
        }
        .pricing-compare {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
        }
        .pricing-compare table {
          width: 100%; border-collapse: collapse;
          font-size: 13.5px;
        }
        .pricing-compare th, .pricing-compare td {
          padding: 12px 20px; text-align: left;
          border-bottom: 1px solid var(--border);
        }
        .pricing-compare th {
          background: var(--bg-soft);
          font-weight: 500; font-size: 12.5px;
          color: var(--text-muted);
        }
        .pricing-compare td:not(:first-child),
        .pricing-compare th:not(:first-child) {
          text-align: center;
        }
        .pricing-compare tr:last-child td { border-bottom: none; }
        .pricing-faq {
          border-bottom: 1px solid var(--border);
          padding: 16px 0;
        }
        .pricing-faq summary {
          font-weight: 500; font-size: 15px;
          cursor: pointer; list-style: none;
          display: flex; align-items: center; justify-content: space-between;
        }
        .pricing-faq summary::-webkit-details-marker { display: none; }
        .pricing-faq summary::after {
          content: '+'; font-size: 18px; color: var(--text-subtle);
          font-weight: 300;
        }
        .pricing-faq[open] summary::after { content: '−'; }
        .pricing-faq p {
          margin: 12px 0 0; color: var(--text-muted);
          line-height: 1.55; font-size: 14px;
        }
      `}</style>
    </div>
  );
}
