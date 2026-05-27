import { Icon } from "./Icon";

const GROUPS: Array<{
  title: string;
  items: Array<{ keys: string[]; label: string }>;
}> = [
  {
    title: "Général",
    items: [
      { keys: ["⌘", "K"], label: "Ouvrir la recherche / palette de commandes" },
      { keys: ["?"], label: "Afficher ce panneau d'aide" },
      { keys: ["Échap"], label: "Fermer une fenêtre" },
    ],
  },
  {
    title: "Navigation (taper « g » puis…)",
    items: [
      { keys: ["G", "B"], label: "Aller aux tableaux" },
      { keys: ["G", "I"], label: "Aller à l'inbox" },
      { keys: ["G", "T"], label: "Aller à mes tâches" },
      { keys: ["G", "O"], label: "Aller aux objectifs" },
      { keys: ["G", "D"], label: "Aller aux docs" },
      { keys: ["G", "S"], label: "Aller aux sprints" },
      { keys: ["G", ","], label: "Aller aux réglages" },
    ],
  },
];

export function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        style={{ width: "min(480px, 92vw)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="row"
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-c)",
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 15 }}>
            Raccourcis clavier
          </span>
          <span className="spacer" />
          <button
            type="button"
            className="sb-icon-btn"
            onClick={onClose}
            aria-label="Fermer"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <div
          style={{
            padding: "8px 20px 20px",
            overflowY: "auto",
            maxHeight: "70vh",
          }}
        >
          {GROUPS.map((group) => (
            <div key={group.title} style={{ marginTop: 16 }}>
              <div
                className="text-subtle text-xs"
                style={{
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight: 500,
                  marginBottom: 8,
                }}
              >
                {group.title}
              </div>
              {group.items.map((item) => (
                <div
                  key={item.label}
                  className="row"
                  style={{ padding: "6px 0", gap: 12 }}
                >
                  <span style={{ flex: 1, fontSize: 13.5 }}>{item.label}</span>
                  <span className="row" style={{ gap: 4 }}>
                    {item.keys.map((k) => (
                      <span key={k} className="kbd">
                        {k}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
