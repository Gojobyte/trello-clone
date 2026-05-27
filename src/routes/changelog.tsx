import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "#/features/app/Icon";
import { MarketingShell, MkEyebrow } from "#/features/app/MarketingShell";

export const Route = createFileRoute("/changelog")({
  component: ChangelogRoute,
});

function ChangelogRoute() {
  return (
    <MarketingShell active="changelog">
      <ChangelogContent />
    </MarketingShell>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type EntryKind = "new" | "improved" | "fixed" | "breaking";

interface Entry {
  kind: EntryKind;
  text: string;
}

interface Cover {
  tone: "accent" | "pro" | "major";
  label: string;
}

interface Release {
  version: string;
  date: string;
  title: string;
  highlight?: boolean;
  cover?: Cover;
  entries: Entry[];
}

// ─── Données ──────────────────────────────────────────────────────────────────

const RELEASES: Release[] = [
  {
    version: "v1.2",
    date: "20 mai 2026",
    title: "Command palette, Timeline en beta",
    highlight: true,
    cover: { tone: "accent", label: "NOUVEAU" },
    entries: [
      {
        kind: "new",
        text: "Command palette (⌘K) avec recherche sur cartes, boards et actions.",
      },
      {
        kind: "new",
        text: "Vue Timeline en beta — swimlanes par étiquette, drag pour replanifier (PRO).",
      },
      {
        kind: "new",
        text: "Section « Outils » dans la sidebar : Objectifs (OKR), Docs, Sprints, Charge équipe.",
      },
      {
        kind: "improved",
        text: "Modal de carte : onglet Sous-tâches avec progression visuelle.",
      },
      {
        kind: "improved",
        text: "Transitions entre les vues du board (Board → Calendrier → Timeline → Dashboard).",
      },
      {
        kind: "fixed",
        text: "Drag-and-drop sur Safari 17.4 : ne perd plus l'assigné lors du drop.",
      },
    ],
  },
  {
    version: "v1.1",
    date: "28 avril 2026",
    title: "Vues personnelles & Inbox",
    entries: [
      {
        kind: "new",
        text: "Inbox unifié : mentions, assignations, échéances et activités dans un seul endroit.",
      },
      {
        kind: "new",
        text: "Vue « Mon jour » : vos cartes prioritaires du jour, retards en tête.",
      },
      {
        kind: "new",
        text: "Vues sauvegardées : filtres croisés inter-boards, partageables à l'équipe.",
      },
      {
        kind: "improved",
        text: "Recherche full-text sur les commentaires et descriptions.",
      },
      {
        kind: "improved",
        text: "Performance du board : -30% sur le temps de rendu initial.",
      },
      {
        kind: "fixed",
        text: "Notifications Slack : déduplication des notifications quand 2 personnes assignent en même temps.",
      },
    ],
  },
  {
    version: "v1.0",
    date: "15 mars 2026",
    title: "Sortie publique — Flowboard est là",
    cover: { tone: "major", label: "LANCEMENT" },
    entries: [
      {
        kind: "new",
        text: "Sortie publique après 4 mois de beta privée avec 40 équipes.",
      },
      {
        kind: "new",
        text: "Vues Board et Calendrier partageant les mêmes cartes.",
      },
      {
        kind: "new",
        text: "Cartes riches : étiquettes, sous-tâches, commentaires, pièces jointes, échéances.",
      },
      {
        kind: "new",
        text: "Workspaces avec membres, rôles et permissions par board.",
      },
      {
        kind: "new",
        text: "Intégrations Slack et GitHub (PR liées aux cartes).",
      },
      {
        kind: "new",
        text: "Plan Free (jusqu'à 3 boards) et Premium (boards illimités).",
      },
    ],
  },
  {
    version: "v0.9",
    date: "12 février 2026",
    title: "Beta privée — itérations finales",
    entries: [
      {
        kind: "new",
        text: "Templates de boards : Sprint agile, Roadmap RICE, Recrutement.",
      },
      {
        kind: "new",
        text: "Importation depuis CSV et depuis Trello en un clic.",
      },
      {
        kind: "improved",
        text: "Composant carte refait pour être 2× plus rapide à manipuler.",
      },
      {
        kind: "fixed",
        text: "Cartes archivées qui réapparaissaient après un refresh.",
      },
    ],
  },
  {
    version: "v0.8",
    date: "20 janvier 2026",
    title: "Beta privée — drag-and-drop",
    entries: [
      {
        kind: "new",
        text: "Drag-and-drop des cartes entre colonnes (et au sein d'une colonne).",
      },
      { kind: "new", text: "Filtres par assigné, étiquette, priorité." },
      {
        kind: "improved",
        text: "Modal de carte : navigation clavier complète.",
      },
    ],
  },
  {
    version: "v0.7",
    date: "8 janvier 2026",
    title: "Beta privée — ouverture des 40 premiers comptes",
    cover: { tone: "pro", label: "BETA" },
    entries: [
      {
        kind: "new",
        text: "Beta privée ouverte à 40 équipes triées sur le volet (merci !).",
      },
      {
        kind: "new",
        text: "Boards, colonnes, cartes — les fondations sont là.",
      },
      { kind: "new", text: "Authentification email + Google." },
    ],
  },
];

const KIND_META: Record<
  EntryKind,
  { label: string; bg: string; fg: string }
> = {
  new: {
    label: "Nouveau",
    bg: "oklch(0.94 0.05 155)",
    fg: "oklch(0.35 0.13 155)",
  },
  improved: {
    label: "Amélioré",
    bg: "oklch(0.94 0.05 240)",
    fg: "oklch(0.35 0.13 240)",
  },
  fixed: {
    label: "Corrigé",
    bg: "var(--bg-soft)",
    fg: "var(--text-muted)",
  },
  breaking: {
    label: "Breaking",
    bg: "oklch(0.94 0.05 25)",
    fg: "oklch(0.42 0.16 25)",
  },
};

// ─── Sous-composant : placeholder visuel de capture ───────────────────────────

function ReleasePlaceholder({ version }: { version: string }) {
  return (
    <div
      style={{
        height: 280,
        borderRadius: 8,
        background: "var(--bg-sunken)",
        border: "1px dashed var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-subtle)",
        fontSize: 13,
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.02em",
      }}
    >
      Capture release {version} · 1120×420
    </div>
  );
}

// ─── Contenu principal ────────────────────────────────────────────────────────

type FilterId = "all" | EntryKind;

const FILTER_OPTIONS: { id: FilterId; label: string }[] = [
  { id: "all", label: "Tout" },
  { id: "new", label: "Nouveau" },
  { id: "improved", label: "Amélioré" },
  { id: "fixed", label: "Corrigé" },
  { id: "breaking", label: "Breaking" },
];

function ChangelogContent() {
  const [filter, setFilter] = useState<FilterId>("all");

  const visible = RELEASES.map((r) => ({
    ...r,
    entries:
      filter === "all"
        ? r.entries
        : r.entries.filter((e) => e.kind === filter),
  })).filter((r) => r.entries.length > 0);

  return (
    <>
      {/* Hero */}
      <section className="mk-hero" style={{ paddingBottom: 48 }}>
        <MkEyebrow>Changelog</MkEyebrow>
        <h1 className="mk-h1">
          Ce qui change,
          <br />
          <span style={{ color: "var(--text-subtle)" }}>
            semaine après semaine.
          </span>
        </h1>
        <p className="mk-sub">
          On expédie environ une release par mois. Pas de pop-up « Quoi de
          neuf ? », juste cette page.
        </p>
        <div className="row" style={{ marginTop: 24, gap: 8 }}>
          <button className="btn btn--outline btn--sm">
            <Icon name="bell" size={12} /> S&apos;abonner par email
          </button>
          <button className="btn btn--ghost btn--sm">RSS</button>
          <span
            className="text-subtle text-xs"
            style={{ marginLeft: 12 }}
          >
            Mis à jour le 20 mai 2026
          </span>
        </div>
      </section>

      {/* Filter chips */}
      <section
        className="mk-section"
        style={{ paddingTop: 0, paddingBottom: 24 }}
      >
        <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
          {FILTER_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              style={{
                padding: "4px 12px",
                borderRadius: 100,
                border: "1px solid",
                background:
                  filter === id ? "var(--text)" : "var(--surface)",
                color:
                  filter === id ? "var(--bg)" : "var(--text-muted)",
                borderColor:
                  filter === id ? "var(--text)" : "var(--border)",
                fontSize: 12.5,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Timeline verticale */}
      <section
        className="mk-section"
        style={{ paddingTop: 0, paddingBottom: 80 }}
      >
        <div className="cl-list">
          {visible.map((r, i) => (
            <article key={r.version} className="cl-item">
              {/* Méta sticky */}
              <aside className="cl-meta">
                <div className="cl-version">{r.version}</div>
                <div className="text-subtle text-sm">{r.date}</div>
                {r.cover && (
                  <span
                    className="cl-tag"
                    style={{
                      background:
                        r.cover.tone === "accent"
                          ? "var(--accent)"
                          : r.cover.tone === "pro"
                            ? "var(--accent-soft)"
                            : "var(--text)",
                      color:
                        r.cover.tone === "pro"
                          ? "var(--accent-text)"
                          : "white",
                    }}
                  >
                    {r.cover.label}
                  </span>
                )}
              </aside>

              {/* Corps */}
              <div className="cl-body">
                <h2 className="cl-title">{r.title}</h2>
                {r.highlight && (
                  <div className="cl-highlight">
                    <ReleasePlaceholder version={r.version} />
                  </div>
                )}
                <ul className="cl-entries">
                  {r.entries.map((e, j) => {
                    const k = KIND_META[e.kind];
                    return (
                      <li key={j}>
                        <span
                          className="cl-kind"
                          style={{ background: k.bg, color: k.fg }}
                        >
                          {k.label}
                        </span>
                        <span>{e.text}</span>
                      </li>
                    );
                  })}
                </ul>
                {i < visible.length - 1 && (
                  <div
                    className="divider"
                    style={{ margin: "32px 0 0" }}
                  />
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mk-cta">
        <h2
          style={{
            fontSize: 32,
            margin: 0,
            letterSpacing: "-0.02em",
            fontWeight: 500,
          }}
        >
          On expédie en public.
        </h2>
        <p
          className="text-muted"
          style={{ fontSize: 15, marginTop: 12, maxWidth: 460 }}
        >
          Roadmap publique, votes ouverts, et un Discord pour discuter avec
          l&apos;équipe produit.
        </p>
        <div className="row" style={{ gap: 10, marginTop: 24 }}>
          <Link to="/roadmap" className="btn btn--primary btn--lg">
            Voir la roadmap
          </Link>
          <button className="btn btn--outline btn--lg">
            Rejoindre le Discord
          </button>
        </div>
      </section>

      <style>{`
        .cl-list { display: flex; flex-direction: column; gap: 0; }
        .cl-item {
          display: grid; grid-template-columns: 200px 1fr;
          gap: 48px; padding: 32px 0;
        }
        .cl-item:first-child { padding-top: 0; }
        .cl-meta { position: sticky; top: 88px; align-self: start; }
        .cl-version {
          font-size: 22px; font-weight: 500;
          font-family: var(--font-mono);
          letter-spacing: -0.01em;
          margin-bottom: 4px;
        }
        .cl-tag {
          display: inline-block; margin-top: 10px;
          padding: 2px 8px; border-radius: 100px;
          font-size: 10.5px; font-weight: 500;
          letter-spacing: 0.03em;
        }
        .cl-body { min-width: 0; }
        .cl-title {
          font-size: 24px; font-weight: 500;
          letter-spacing: -0.015em;
          margin: 0 0 20px;
          line-height: 1.2;
        }
        .cl-highlight {
          background: var(--bg-soft); border: 1px solid var(--border);
          border-radius: 12px; padding: 12px;
          margin-bottom: 24px;
        }
        .cl-entries {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 12px;
        }
        .cl-entries li {
          display: grid; grid-template-columns: 90px 1fr;
          gap: 14px; font-size: 14px; line-height: 1.55;
          align-items: baseline;
        }
        .cl-kind {
          font-size: 10.5px; font-weight: 500;
          padding: 2px 8px; border-radius: 4px;
          text-transform: uppercase; letter-spacing: 0.04em;
          text-align: center;
        }
        @media (max-width: 880px) {
          .cl-item { grid-template-columns: 1fr; gap: 16px; }
          .cl-meta { position: static; }
          .cl-entries li { grid-template-columns: 1fr; gap: 4px; }
          .cl-kind { justify-self: start; }
        }
      `}</style>
    </>
  );
}
