import { Link } from "@tanstack/react-router";
import { Icon } from "./Icon";

export function BrandMark({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <span className={`sidebar-brand-mark${size === "lg" ? " sidebar-brand-mark--lg" : ""}`}>
      F
    </span>
  );
}

export function BrandLockup() {
  return (
    <Link to="/" className="row" style={{ gap: 8 }}>
      <BrandMark />
      <span style={{ fontWeight: 600, letterSpacing: "-0.01em" }}>Flowboard</span>
    </Link>
  );
}

const NAV_ITEMS = [
  { to: "/", id: "home", label: "Produit" },
  { to: "/integrations", id: "integrations", label: "Intégrations" },
  { to: "/pricing", id: "pricing", label: "Tarifs" },
  { to: "/changelog", id: "changelog", label: "Changelog" },
  { to: "/roadmap", id: "roadmap", label: "Roadmap" },
] as const;

export function MarketingNav({ active }: { active?: string }) {
  return (
    <header className="landing-nav">
      <div className="landing-nav-inner">
        <BrandLockup />
        <nav
          className="row"
          style={{ gap: 24, fontSize: 13.5, color: "var(--text-muted)" }}
        >
          {NAV_ITEMS.map((it) => (
            <Link
              key={it.id}
              to={it.to}
              style={{
                color: active === it.id ? "var(--text)" : "var(--text-muted)",
                fontWeight: active === it.id ? 500 : 400,
              }}
            >
              {it.label}
            </Link>
          ))}
        </nav>
        <div className="row" style={{ gap: 8 }}>
          <Link to="/login" className="btn btn--ghost">
            Se connecter
          </Link>
          <Link to="/register" className="btn btn--primary">
            Essayer gratuitement
            <Icon name="arrow" size={13} />
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="mk-footer">
      <div className="mk-footer-inner">
        <div className="mk-footer-grid">
          <div>
            <div className="row" style={{ gap: 8, marginBottom: 16 }}>
              <BrandMark />
              <span style={{ fontWeight: 600 }}>Flowboard</span>
            </div>
            <p
              className="text-muted text-sm"
              style={{ margin: 0, maxWidth: 240, lineHeight: 1.55 }}
            >
              Gestion de projet pour les équipes qui préfèrent la clarté aux
              notifications.
            </p>
          </div>
          <div>
            <div className="mk-footer-h">Produit</div>
            <Link to="/">Fonctionnalités</Link>
            <Link to="/integrations">Intégrations</Link>
            <Link to="/pricing">Tarifs</Link>
            <Link to="/changelog">Changelog</Link>
            <Link to="/roadmap">Roadmap publique</Link>
          </div>
          <div>
            <div className="mk-footer-h">Communauté</div>
            <a>Discord</a>
            <a>Blog</a>
            <a>Newsletter</a>
            <a>Early adopters</a>
          </div>
          <div>
            <div className="mk-footer-h">Ressources</div>
            <a>Documentation</a>
            <a>Centre d'aide</a>
            <a>API &amp; SDK</a>
            <Link to="/templates">Templates</Link>
            <a>Statut</a>
          </div>
          <div>
            <div className="mk-footer-h">Légal</div>
            <a>Conditions</a>
            <a>Confidentialité</a>
            <a>RGPD</a>
            <a>Sécurité</a>
            <a>Sous-traitants</a>
          </div>
        </div>
        <div className="mk-footer-bottom">
          <span className="text-subtle text-sm">
            © 2026 Flowboard · Conçu en France · Hébergé en Europe
          </span>
          <div
            className="row"
            style={{ gap: 12, color: "var(--text-subtle)", fontSize: 12 }}
          >
            <span>FR</span>
            <span style={{ opacity: 0.3 }}>·</span>
            <span>EN</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function MkEyebrow({
  children,
  color = "muted",
}: {
  children: React.ReactNode;
  color?: "muted" | "accent";
}) {
  return (
    <div
      className="landing-eyebrow"
      style={{
        marginBottom: 20,
        color: color === "accent" ? "var(--accent-text)" : "var(--text-muted)",
        background: color === "accent" ? "var(--accent-soft)" : "var(--bg-soft)",
        borderColor: color === "accent" ? "transparent" : "var(--border-c)",
      }}
    >
      {children}
    </div>
  );
}

// Enveloppe une page publique : nav + contenu + footer.
export function MarketingShell({
  active,
  children,
}: {
  active?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="marketing">
      <MarketingNav active={active} />
      {children}
      <MarketingFooter />
    </div>
  );
}
