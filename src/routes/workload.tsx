import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Icon } from "#/features/app/Icon";
import { AppShell } from "#/features/app/AppShell";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/workload")({
  component: WorkloadRoute,
});

function WorkloadRoute() {
  return (
    <AppShell active={{ route: "workload" }} title="Charge équipe" crumbs={["Atelier Marchand"]}>
      <WorkloadContent />
    </AppShell>
  );
}

// ─── Initiale + couleur dérivée du nom ───────────────────────────────────────

function nameToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  }
  const hue = (hash % 360 + 360) % 360;
  return `oklch(0.62 0.14 ${hue})`;
}

function MemberAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase();
  const bg = nameToColor(name);
  return (
    <span
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: bg,
        color: "#fff",
        fontSize: 12,
        fontWeight: 600,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        letterSpacing: 0,
      }}
    >
      {initial}
    </span>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

function WorkloadContent() {
  const { data: session } = authClient.useSession();
  const data = useQuery(api.workload.summary, session?.user ? {} : "skip");

  // Chargement
  if (data === undefined) {
    return (
      <div className="view-inner">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 240,
            color: "var(--text-subtle)",
            fontSize: 14,
          }}
        >
          Chargement…
        </div>
      </div>
    );
  }

  const { members, unassignedOpen, totalCards, boardCount } = data;

  // Trier les membres par cartes ouvertes décroissant
  const sorted = [...members].sort((a, b) => b.open - a.open);

  const totalOpen = members.reduce((s, m) => s + m.open, 0);
  const maxOpen = sorted.length > 0 ? sorted[0].open : 1;

  // ─── Stats bande ─────────────────────────────────────────────────────────
  const stats = [
    {
      l: "Cartes totales",
      v: totalCards,
      sub: "tous tableaux",
      tone: "neutral" as const,
    },
    {
      l: "Tableaux actifs",
      v: boardCount,
      sub: "en cours",
      tone: "neutral" as const,
    },
    {
      l: "Cartes ouvertes",
      v: totalOpen,
      sub: "non terminées",
      tone: totalOpen > 50 ? ("bad" as const) : ("neutral" as const),
    },
    {
      l: "Non-assignées",
      v: unassignedOpen,
      sub: "à attribuer",
      tone: unassignedOpen > 0 ? ("bad" as const) : ("good" as const),
    },
  ];

  // ─── Recommandations dynamiques ───────────────────────────────────────────
  type Tone = "amber" | "red" | "green";
  const recommendations: Array<{ i: string; t: string; d: string; tone: Tone }> = [];

  const overloaded = sorted.filter((m) => m.open > 8);
  if (overloaded.length > 0) {
    overloaded.forEach((m) => {
      recommendations.push({
        i: "arrow",
        t: `${m.name} est surchargé·e`,
        d: `${m.open} cartes ouvertes — envisager de redistribuer vers un membre disponible.`,
        tone: "amber",
      });
    });
  }

  if (unassignedOpen > 0) {
    const available = sorted.filter((m) => m.open < 4);
    const hint =
      available.length > 0
        ? `${available[0].name} a seulement ${available[0].open} cartes — lui attribuer en priorité ?`
        : "Attribuer ces cartes à un membre de l'équipe dès que possible.";
    recommendations.push({
      i: "user",
      t: `${unassignedOpen} carte${unassignedOpen > 1 ? "s" : ""} non-assignée${unassignedOpen > 1 ? "s" : ""}`,
      d: hint,
      tone: "amber",
    });
  }

  const withOverdue = sorted.filter((m) => m.overdue > 0);
  withOverdue.forEach((m) => {
    recommendations.push({
      i: "clock",
      t: `${m.name} a ${m.overdue} carte${m.overdue > 1 ? "s" : ""} en retard`,
      d: "Prioriser ou réassigner ces cartes pour éviter un blocage.",
      tone: "red",
    });
  });

  if (recommendations.length === 0) {
    recommendations.push({
      i: "spark",
      t: "Équipe bien équilibrée",
      d: "Aucune anomalie détectée. Continuez sur cette lancée !",
      tone: "green",
    });
  }

  // ─── État vide ────────────────────────────────────────────────────────────
  const isEmpty = members.length === 0 && totalCards === 0;

  return (
    <div className="view-inner">
      {/* En-tête */}
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.015em", margin: 0 }}>
            Charge équipe
          </h1>
          <p className="text-muted text-sm" style={{ margin: "4px 0 0" }}>
            Vue réelle des cartes par membre · données en direct depuis Convex
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn--outline">
            <Icon name="filter" size={13} /> Filtrer par projet
          </button>
          <button className="btn btn--outline">
            <Icon name="arrowdown" size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="wl-stats">
        {stats.map((s, i) => (
          <div key={i} className="wl-stat">
            <span className="wl-stat-l">{s.l}</span>
            <span
              className="wl-stat-v"
              style={{
                color: s.tone === "bad" ? "var(--red)" : s.tone === "good" ? "var(--green)" : "var(--text)",
              }}
            >
              {s.v}
            </span>
            <span className="wl-stat-sub">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* Tableau de charge */}
      <div className="wl-table-wrap">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>Charge par membre</h3>
            <p className="text-subtle text-xs" style={{ margin: "4px 0 0" }}>
              Cartes ouvertes, en retard, cette semaine et terminées
            </p>
          </div>
          <span className="text-subtle text-xs">{sorted.length} membre{sorted.length !== 1 ? "s" : ""}</span>
        </div>

        {/* État vide */}
        {isEmpty ? (
          <div className="wl-empty">
            <Icon name="user" size={28} style={{ color: "var(--text-subtle)", marginBottom: 10 }} />
            <div style={{ fontWeight: 500, fontSize: 14 }}>Aucune donnée pour l'instant</div>
            <p className="text-muted text-sm" style={{ margin: "6px 0 0", maxWidth: 320, textAlign: "center" }}>
              Créez des tableaux et assignez des cartes à des membres pour voir leur charge ici.
            </p>
          </div>
        ) : (
          <>
            {/* En-tête colonnes */}
            <div className="wl-row wl-row-head">
              <div className="wl-col-name">Membre</div>
              <div className="wl-col-bar">Charge relative</div>
              <div className="wl-col-num">Ouvertes</div>
              <div className="wl-col-num" style={{ color: "var(--red)" }}>En retard</div>
              <div className="wl-col-num">Cette sem.</div>
              <div className="wl-col-num" style={{ color: "var(--green)" }}>Terminées</div>
            </div>

            {/* Lignes membres */}
            {sorted.map((m) => {
              const barWidth = maxOpen > 0 ? Math.round((m.open / maxOpen) * 100) : 0;
              const barColor =
                m.open > 8
                  ? "var(--red)"
                  : m.open > 5
                  ? "var(--amber)"
                  : "var(--accent)";

              return (
                <div key={m.userId} className="wl-row">
                  <div className="wl-col-name">
                    <MemberAvatar name={m.name} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</span>
                  </div>
                  <div className="wl-col-bar">
                    <div className="wl-bar-track">
                      <div
                        className="wl-bar-fill"
                        style={{ width: `${barWidth}%`, background: barColor }}
                      />
                    </div>
                  </div>
                  <div className="wl-col-num">{m.open}</div>
                  <div
                    className="wl-col-num"
                    style={{ color: m.overdue > 0 ? "var(--red)" : "var(--text-subtle)" }}
                  >
                    {m.overdue}
                  </div>
                  <div className="wl-col-num">{m.dueThisWeek}</div>
                  <div
                    className="wl-col-num"
                    style={{ color: m.completed > 0 ? "var(--green)" : "var(--text-subtle)" }}
                  >
                    {m.completed}
                  </div>
                </div>
              );
            })}

            {/* Ligne non-assignées */}
            <div className="wl-row wl-row-unassigned">
              <div className="wl-col-name">
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "var(--bg-sunken)",
                    border: "1px dashed var(--border-strong)",
                    display: "grid",
                    placeItems: "center",
                    color: "var(--text-subtle)",
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  ?
                </span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)" }}>
                  Non-assignées
                </span>
              </div>
              <div className="wl-col-bar">
                <div className="wl-bar-track">
                  {unassignedOpen > 0 && (
                    <div
                      className="wl-bar-fill"
                      style={{
                        width: `${Math.round((unassignedOpen / (maxOpen || 1)) * 100)}%`,
                        background: "var(--red)",
                        opacity: 0.6,
                      }}
                    />
                  )}
                </div>
              </div>
              <div
                className="wl-col-num"
                style={{ color: unassignedOpen > 0 ? "var(--red)" : "var(--text-subtle)" }}
              >
                {unassignedOpen}
              </div>
              <div className="wl-col-num" style={{ color: "var(--text-subtle)" }}>—</div>
              <div className="wl-col-num" style={{ color: "var(--text-subtle)" }}>—</div>
              <div className="wl-col-num" style={{ color: "var(--text-subtle)" }}>—</div>
            </div>
          </>
        )}
      </div>

      {/* Recommandations */}
      <div className="wl-reco">
        <div className="row" style={{ gap: 8, marginBottom: 12 }}>
          <Icon name="spark" size={14} style={{ color: "var(--accent)" }} />
          <span style={{ fontWeight: 500, fontSize: 13 }}>Recommandations</span>
        </div>
        <div className="col" style={{ gap: 10 }}>
          {recommendations.map((r, i) => (
            <div key={i} className="wl-reco-item">
              <span
                className="wl-reco-icon"
                style={{
                  background:
                    r.tone === "red"
                      ? "var(--red-soft)"
                      : r.tone === "green"
                      ? "var(--green-soft, oklch(0.94 0.07 145))"
                      : "var(--amber-soft)",
                  color:
                    r.tone === "red"
                      ? "var(--red)"
                      : r.tone === "green"
                      ? "var(--green)"
                      : "var(--amber)",
                }}
              >
                <Icon name={r.i} size={12} stroke={1.8} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{r.t}</div>
                <div className="text-muted text-sm">{r.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .wl-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 1px; background: var(--border);
          border: 1px solid var(--border); border-radius: 10px;
          overflow: hidden; margin-top: 24px;
        }
        .wl-stat {
          background: var(--surface); padding: 16px 18px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .wl-stat-l { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500; }
        .wl-stat-v { font-size: 28px; font-weight: 500; letter-spacing: -0.015em; font-family: var(--font-mono); line-height: 1.1; }
        .wl-stat-sub { font-size: 11.5px; color: var(--text-subtle); }

        .wl-table-wrap {
          margin-top: 24px;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; padding: 20px 24px;
        }

        .wl-row {
          display: grid;
          grid-template-columns: 200px 1fr 80px 80px 90px 90px;
          align-items: center;
          gap: 8px;
          padding: 9px 10px;
          border-radius: 8px;
          transition: background 0.1s;
        }
        .wl-row:not(.wl-row-head):hover { background: var(--bg-soft); }
        .wl-row-head {
          padding: 6px 10px;
          margin-bottom: 4px;
        }
        .wl-row-head > div {
          font-size: 10.5px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 500;
        }
        .wl-row-unassigned {
          margin-top: 8px;
          padding-top: 10px;
          border-top: 1px solid var(--border);
        }

        .wl-col-name { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .wl-col-bar { display: flex; align-items: center; }
        .wl-col-num {
          text-align: right;
          font-family: var(--font-mono);
          font-size: 13px;
          font-weight: 500;
        }

        .wl-bar-track {
          flex: 1;
          height: 8px;
          background: var(--bg-sunken);
          border-radius: 99px;
          overflow: hidden;
        }
        .wl-bar-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 0.3s ease;
        }

        .wl-empty {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          min-height: 180px;
          color: var(--text-subtle);
        }

        .wl-reco {
          margin-top: 24px;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; padding: 18px 22px;
        }
        .wl-reco-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px;
          background: var(--bg-soft); border-radius: 8px;
        }
        .wl-reco-icon {
          width: 28px; height: 28px; border-radius: 7px;
          display: grid; place-items: center; flex: none;
        }
      `}</style>
    </div>
  );
}
