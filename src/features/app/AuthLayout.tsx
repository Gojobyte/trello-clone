import { Link } from "@tanstack/react-router";
import { Avatar } from "./primitives";
import { BrandMark } from "./MarketingShell";

// Mise en page partagée des écrans de connexion / inscription (design gestion-pro).
export function AuthLayout({
  switchLink,
  children,
}: {
  switchLink: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="auth">
      <header className="auth-nav">
        <Link to="/" className="row" style={{ gap: 8 }}>
          <BrandMark />
          <span style={{ fontWeight: 600, letterSpacing: "-0.01em" }}>
            Flowboard
          </span>
        </Link>
        {switchLink}
      </header>

      <div className="auth-grid">
        <div className="auth-form-side">{children}</div>

        <aside className="auth-aside">
          <div className="auth-aside-inner">
            <blockquote className="auth-quote">
              <span
                style={{
                  fontSize: 40,
                  color: "var(--accent)",
                  fontFamily: "Georgia, serif",
                  lineHeight: 0,
                  position: "relative",
                  top: 12,
                }}
              >
                "
              </span>
              <span>
                On a testé trois outils avant Flowboard. C'est le premier où le
                board et le calendrier partagent vraiment les mêmes cartes. Ça
                change tout pour notre standup du lundi.
              </span>
            </blockquote>
            <div className="row" style={{ gap: 12, marginTop: 24 }}>
              <Avatar user="u3" size="lg" />
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>
                  Claire Dubois
                </div>
                <div className="text-subtle text-sm">
                  Head of Product, Studio Nord
                </div>
              </div>
            </div>

            <div className="auth-aside-meta">
              <div>
                <div className="font-mono" style={{ fontSize: 28, fontWeight: 500 }}>
                  124
                </div>
                <div className="text-subtle text-sm">équipes en beta</div>
              </div>
              <div>
                <div className="font-mono" style={{ fontSize: 28, fontWeight: 500 }}>
                  v1.2
                </div>
                <div className="text-subtle text-sm">depuis mars 2026</div>
              </div>
              <div>
                <div className="font-mono" style={{ fontSize: 28, fontWeight: 500 }}>
                  Discord
                </div>
                <div className="text-subtle text-sm">communauté ouverte</div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        .auth {
          min-height: 100vh; background: var(--bg);
          display: flex; flex-direction: column;
        }
        .auth-nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 32px;
        }
        .auth-grid {
          flex: 1;
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 0;
        }
        .auth-form-side {
          display: grid; place-items: center;
          padding: 32px 32px 80px;
        }
        .auth-form { width: 100%; max-width: 380px; }
        .auth-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 24px 0; color: var(--text-subtle);
          font-size: 11.5px; text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .auth-divider::before, .auth-divider::after {
          content: ''; flex: 1; height: 1px; background: var(--border-c);
        }
        .auth-aside {
          background: var(--bg-soft);
          border-left: 1px solid var(--border-c);
          padding: 48px;
          display: flex; align-items: center;
        }
        .auth-aside-inner { max-width: 460px; }
        .auth-quote {
          font-size: 22px; line-height: 1.45;
          letter-spacing: -0.01em; font-weight: 400;
          margin: 0; color: var(--text);
        }
        .auth-aside-meta {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 24px; margin-top: 56px;
          padding-top: 32px; border-top: 1px solid var(--border-c);
        }
        @media (max-width: 920px) {
          .auth-grid { grid-template-columns: 1fr; }
          .auth-aside { display: none; }
        }
      `}</style>
    </div>
  );
}
