import { Link } from "@tanstack/react-router";
import { useTheme } from "#/lib/use-theme";
import { BrandMark } from "./MarketingShell";

// Mise en page partagée des écrans de connexion / inscription.
// Split-screen Lume Éclat : gauche = formulaire, droite = pane visuel.
// `switchLink` est conservé pour rétro-compat mais peut rester `undefined`
// si le route gère son propre lien de bascule (login ↔ register).
export function AuthLayout({
	children,
	visual,
	switchLink: _switchLink,
}: {
	children: React.ReactNode;
	visual: React.ReactNode;
	switchLink?: React.ReactNode;
}) {
	const { theme, setTheme } = useTheme();
	return (
		<div className="auth-grid">
			<section className="auth-form-side">
				<header className="auth-top">
					<Link to="/" className="auth-top-brand" aria-label="Flowboard">
						<BrandMark />
						<span>Flowboard</span>
					</Link>
					<fieldset className="auth-theme-toggle" aria-label="Thème">
						<legend className="sr-only">Thème</legend>
						<button
							type="button"
							aria-label="Thème sombre"
							aria-pressed={theme === "dark"}
							onClick={() => setTheme("dark")}
						>
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.8"
								width="13"
								height="13"
								aria-hidden="true"
							>
								<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
							</svg>
						</button>
						<button
							type="button"
							aria-label="Thème clair"
							aria-pressed={theme === "light"}
							onClick={() => setTheme("light")}
						>
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.8"
								width="13"
								height="13"
								aria-hidden="true"
							>
								<circle cx="12" cy="12" r="4" />
								<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
							</svg>
						</button>
					</fieldset>
				</header>

				<div className="auth-form-wrap">{children}</div>

				<footer className="auth-bottom">
					<div>© 2026 FLOWBOARD · LUME ATELIER</div>
					<div>
						<a href="/docs">RGPD</a> · <a href="/docs">CONDITIONS</a>
					</div>
				</footer>
			</section>

			<aside className="auth-visual-side" aria-hidden="true">
				<div className="auth-visual-orbs">
					<div className="orb orb-1" />
					<div className="orb orb-2" />
					<div className="orb orb-3" />
				</div>
				<div className="auth-visual-grain" />
				<div className="auth-visual-inner">{visual}</div>
			</aside>
		</div>
	);
}
