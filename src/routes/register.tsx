import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AuthLayout } from "#/features/app/AuthLayout";
import { authClient } from "#/lib/auth-client";
import { AuthError } from "#/routes/login";

export const Route = createFileRoute("/register")({ component: RegisterPage });

const PW_LABELS = [
	"AU MOINS 8 CARACTÈRES, UN CHIFFRE.",
	"TROP COURT — 8 CARACTÈRES MIN.",
	"PASSABLE",
	"CORRECT",
	"SOLIDE",
	"EXCELLENT",
] as const;

// Renvoie un score 0..4 + un libellé court à afficher sous la barre.
function scorePassword(v: string): { lvl: 0 | 1 | 2 | 3 | 4; label: string } {
	if (!v) return { lvl: 0, label: PW_LABELS[0] };
	let s = 0;
	if (v.length >= 8) s++;
	if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
	if (/\d/.test(v)) s++;
	if (/[^A-Za-z0-9]/.test(v)) s++;
	const lvl = Math.min(s, 4) as 0 | 1 | 2 | 3 | 4;
	// Index 1..5 dans PW_LABELS = "TROP COURT" → "EXCELLENT".
	const label = PW_LABELS[(lvl + 1) as 1 | 2 | 3 | 4 | 5];
	return { lvl, label };
}

function RegisterPage() {
	const navigate = useNavigate();
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPw, setShowPw] = useState(false);
	const [accepted, setAccepted] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!sessionPending && session?.user) {
			navigate({ to: "/boards" });
		}
	}, [sessionPending, session, navigate]);

	const { lvl, label } = useMemo(() => scorePassword(password), [password]);
	const passwordOk = password.length >= 8;

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		if (!name.trim()) {
			setError("Votre nom est requis.");
			return;
		}
		if (!passwordOk) {
			setError("Le mot de passe doit contenir au moins 8 caractères.");
			return;
		}
		if (!accepted) {
			setError("Vous devez accepter les conditions pour continuer.");
			return;
		}
		setLoading(true);
		const { error: signUpError } = await authClient.signUp.email({
			name: name.trim(),
			email: email.trim(),
			password,
		});
		setLoading(false);
		if (signUpError) {
			setError(signUpError.message ?? "Erreur lors de l'inscription.");
			return;
		}
		window.location.href = "/boards";
	}

	return (
		<AuthLayout visual={<RegisterVisual />}>
			<div className="auth-head">
				<div className="auth-eyebrow">
					<span>NOUVEAU COMPTE</span>
					<span className="dot on" />
				</div>
				<h1 className="auth-h1">
					Crée ton <em>espace.</em>
				</h1>
				<p className="auth-sub">
					Déjà un compte ? <Link to="/login">Se connecter</Link> — 14 secondes
					pour entrer, sans CB.
				</p>
			</div>

			<form
				onSubmit={handleSubmit}
				noValidate
				aria-label="Créer un compte"
				style={{ display: "grid", gap: 16 }}
			>
				<div className="auth-field">
					<label className="auth-field-label" htmlFor="name">
						Votre nom
					</label>
					<div className="auth-field-wrap">
						<svg
							className="auth-field-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.8"
							aria-hidden="true"
						>
							<circle cx="12" cy="8" r="4" />
							<path d="M4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2" />
						</svg>
						<input
							id="name"
							name="name"
							className="auth-field-input"
							type="text"
							autoComplete="name"
							required
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Noémie Lambert"
						/>
					</div>
				</div>

				<div className="auth-field">
					<label className="auth-field-label" htmlFor="email">
						Email
					</label>
					<div className="auth-field-wrap">
						<svg
							className="auth-field-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.8"
							aria-hidden="true"
						>
							<rect x="3" y="5" width="18" height="14" rx="2" />
							<path d="M3 7l9 6 9-6" />
						</svg>
						<input
							id="email"
							name="email"
							className="auth-field-input"
							type="email"
							autoComplete="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="vous@atelier.fr"
						/>
					</div>
				</div>

				<div className="auth-field">
					<label className="auth-field-label" htmlFor="password">
						Mot de passe
					</label>
					<div className="auth-field-wrap">
						<svg
							className="auth-field-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.8"
							aria-hidden="true"
						>
							<rect x="5" y="11" width="14" height="9" rx="2" />
							<path d="M8 11V7a4 4 0 0 1 8 0v4" />
						</svg>
						<input
							id="password"
							name="password"
							className="auth-field-input"
							type={showPw ? "text" : "password"}
							autoComplete="new-password"
							required
							minLength={8}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="8 caractères minimum"
						/>
						<button
							type="button"
							className="auth-field-toggle"
							aria-label={
								showPw ? "Masquer le mot de passe" : "Afficher le mot de passe"
							}
							onClick={() => setShowPw((v) => !v)}
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.8"
								aria-hidden="true"
							>
								<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
								<circle cx="12" cy="12" r="3" />
							</svg>
						</button>
					</div>
					<div className={`auth-strength-meter lvl-${lvl}`} aria-hidden="true">
						<span className="seg" />
						<span className="seg" />
						<span className="seg" />
						<span className="seg" />
					</div>
					<div className={`auth-strength-hint lvl-${lvl}`} aria-live="polite">
						{label}
					</div>
				</div>

				<label className="auth-terms">
					<input
						type="checkbox"
						checked={accepted}
						onChange={(e) => setAccepted(e.target.checked)}
						style={{ marginTop: 3 }}
					/>
					<span>
						J'accepte les{" "}
						<a href="/docs" className="auth-terms-link">
							conditions générales
						</a>{" "}
						et la{" "}
						<a href="/docs" className="auth-terms-link">
							politique de confidentialité
						</a>
						.
					</span>
				</label>

				{error && <AuthError message={error} />}

				<button
					type="submit"
					className="auth-cta"
					disabled={loading || !accepted}
					style={{ marginTop: 4 }}
				>
					{loading ? "Création en cours…" : "Créer mon compte"}
					{!loading && (
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							aria-hidden="true"
						>
							<path d="M5 12h14M13 5l7 7-7 7" />
						</svg>
					)}
				</button>

				<div className="auth-legal">
					Données hébergées en France (Scaleway · Paris &amp; Strasbourg).
					Export complet à tout moment.
				</div>

				<div className="auth-divider">
					<span>OU CONTINUER AVEC</span>
				</div>
				<div className="auth-social-row">
					<button type="button" className="auth-social-btn" disabled>
						<GoogleIcon /> Google
					</button>
					<button type="button" className="auth-social-btn" disabled>
						<GithubIcon /> GitHub
					</button>
				</div>
			</form>

			<div className="auth-switch">
				Déjà inscrit·e ? <Link to="/login">Se connecter</Link>
			</div>
		</AuthLayout>
	);
}

// Pane droit du register : eyebrow + 3 bénéfices cards.
function RegisterVisual() {
	return (
		<>
			<div className="auth-visual-eyebrow">
				<span className="ping" />
				POURQUOI FLOWBOARD · ÉCLAT V3
			</div>

			<div className="auth-visual-head">
				<h2 className="auth-visual-h2">
					Trois choses
					<br />
					<em>qu'on tient.</em>
				</h2>
				<p className="auth-visual-h2-sub">
					Pas de promesse marketing — la liste qu'on assume vraiment, dès le
					compte gratuit.
				</p>
			</div>

			<div className="auth-benefits">
				<article className="auth-benefit-card">
					<div className="auth-benefit-icon">
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							aria-hidden="true"
						>
							<rect x="3" y="4" width="5" height="16" rx="1" />
							<rect x="10" y="4" width="5" height="10" rx="1" />
							<rect x="17" y="4" width="4" height="13" rx="1" />
						</svg>
					</div>
					<div>
						<div className="auth-benefit-label">OFFERT, DÈS L'INSCRIPTION</div>
						<h4>
							<em>3 boards</em> gratuits
						</h4>
						<p>
							Jusqu'à 100 tickets. Pas de plafond de jours, pas de fenêtre
							d'essai qui ferme.
						</p>
					</div>
				</article>

				<article className="auth-benefit-card">
					<div className="auth-benefit-icon">
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							aria-hidden="true"
						>
							<rect x="2" y="6" width="20" height="13" rx="2" />
							<path d="M2 10h20M6 15h3" />
						</svg>
					</div>
					<div>
						<div className="auth-benefit-label">SANS CB · SANS RELANCE</div>
						<h4>
							Pas de carte <em>bancaire.</em>
						</h4>
						<p>
							Aucune information de paiement demandée. Vous payez quand vous
							décidez d'inviter plus de monde.
						</p>
					</div>
				</article>

				<article className="auth-benefit-card">
					<div className="auth-benefit-icon">
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							aria-hidden="true"
						>
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
						</svg>
					</div>
					<div>
						<div className="auth-benefit-label">RGPD · HÉBERGÉ EN FRANCE</div>
						<h4>
							Vos données, <em>en France.</em>
						</h4>
						<p>
							Scaleway · Paris &amp; Strasbourg. Aucun transfert hors UE. Export
							complet à tout moment.
						</p>
					</div>
				</article>
			</div>

			<div className="auth-visual-foot">
				<div>
					<span className="ping" />
					124 ÉQUIPES À BORD
				</div>
				<div>4 VUES · 40+ RACCOURCIS</div>
			</div>
		</>
	);
}

function GoogleIcon() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<title>Google</title>
			<path
				fill="#EA4335"
				d="M12 11v3.2h4.5c-.18 1.18-1.34 3.46-4.5 3.46-2.7 0-4.92-2.24-4.92-5s2.22-5 4.92-5c1.54 0 2.58.66 3.18 1.22l2.16-2.08C15.94 5.42 14.16 4.5 12 4.5c-4.14 0-7.5 3.36-7.5 7.5s3.36 7.5 7.5 7.5c4.32 0 7.18-3.04 7.18-7.32 0-.5-.06-.86-.14-1.18H12z"
			/>
		</svg>
	);
}

function GithubIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<title>GitHub</title>
			<path d="M12 2C6.48 2 2 6.58 2 12.24c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.36-3.37-1.36-.46-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.55-1.13-4.55-5.04 0-1.11.39-2.02 1.03-2.74-.1-.26-.45-1.3.1-2.7 0 0 .84-.27 2.75 1.05A9.34 9.34 0 0112 6.84c.85.01 1.71.12 2.51.34 1.91-1.32 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.74 0 3.92-2.34 4.78-4.57 5.03.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49C19.13 20.6 22 16.77 22 12.24 22 6.58 17.52 2 12 2z" />
		</svg>
	);
}
