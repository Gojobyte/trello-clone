import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AuthLayout } from "#/features/app/AuthLayout";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/login")({ component: LoginPage });

// Validation email minimale (HTML5-like, suffisante pour gater l'UX 2-step).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPage() {
	const navigate = useNavigate();
	const { data: session, isPending: sessionPending } = authClient.useSession();

	// Le formulaire reste UN SEUL form en interne ; le 2-step est purement visuel.
	const [step, setStep] = useState<1 | 2>(1);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [remember, setRemember] = useState(false);
	const [showPw, setShowPw] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!sessionPending && session?.user) {
			navigate({ to: "/boards" });
		}
	}, [sessionPending, session, navigate]);

	const emailValid = useMemo(() => EMAIL_RE.test(email.trim()), [email]);
	const emailInitial = (email.trim()[0] || "?").toUpperCase();

	function handleContinue() {
		if (!emailValid) {
			setError("Email invalide.");
			return;
		}
		setError(null);
		setStep(2);
	}

	function handleBack() {
		setStep(1);
		setError(null);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		// Si on est encore à l'étape 1, on bascule au lieu de soumettre.
		if (step === 1) {
			handleContinue();
			return;
		}
		if (!password) {
			setError("Mot de passe requis.");
			return;
		}
		setLoading(true);
		const { error: signInError } = await authClient.signIn.email({
			email: email.trim(),
			password,
			rememberMe: remember,
		});
		setLoading(false);
		if (signInError) {
			setError(signInError.message ?? "Email ou mot de passe incorrect.");
			return;
		}
		window.location.href = "/boards";
	}

	return (
		<AuthLayout visual={<LoginVisual />}>
			<div className="auth-head">
				<div className="auth-eyebrow" aria-live="polite">
					<span>ÉTAPE</span>
					<span className={`dot${step >= 1 ? " on" : ""}`} />
					<span className={`dot${step >= 2 ? " on" : ""}`} />
					<span>{step} · 2</span>
				</div>
				<h1 className="auth-h1">
					Reprends <em>où tu en étais.</em>
				</h1>
				<p className="auth-sub">
					Pas encore de compte ? <Link to="/register">Créer un compte</Link> — 3
					boards offerts, sans CB.
				</p>
			</div>

			<form
				className="auth-steps"
				onSubmit={handleSubmit}
				noValidate
				aria-label="Connexion"
			>
				{/* ÉTAPE 1 — email + social */}
				<fieldset
					className={`auth-step ${step === 1 ? "is-entered" : "is-entering"}`}
					hidden={step !== 1}
				>
					<legend className="sr-only">Email</legend>

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
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleContinue();
									}
								}}
								placeholder="vous@atelier.fr"
							/>
						</div>
					</div>

					{error && step === 1 && <AuthError message={error} />}

					<button type="button" className="auth-cta" onClick={handleContinue}>
						Continuer
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
					</button>

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
				</fieldset>

				{/* ÉTAPE 2 — mot de passe */}
				<fieldset
					className={`auth-step ${step === 2 ? "is-entered" : "is-entering"}`}
					hidden={step !== 2}
				>
					<legend className="sr-only">Mot de passe</legend>

					<button type="button" className="auth-back-btn" onClick={handleBack}>
						<svg
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							aria-hidden="true"
						>
							<path d="M19 12H5M12 19l-7-7 7-7" />
						</svg>
						Retour
					</button>

					<div className="auth-email-card">
						<div className="auth-email-card-avatar">{emailInitial}</div>
						<div className="auth-email-card-info">
							<div className="lbl">CONNECTÉ EN TANT QUE</div>
							<div className="mail">{email}</div>
						</div>
						<button
							type="button"
							className="auth-email-card-change"
							onClick={handleBack}
						>
							Changer
						</button>
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
								autoComplete="current-password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••••••"
							/>
							<button
								type="button"
								className="auth-field-toggle"
								aria-label={
									showPw
										? "Masquer le mot de passe"
										: "Afficher le mot de passe"
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
					</div>

					<div className="auth-field-row">
						<label className="auth-checkbox">
							<input
								type="checkbox"
								checked={remember}
								onChange={(e) => setRemember(e.target.checked)}
							/>
							<span className="box" />
							<span>Se souvenir 30 jours</span>
						</label>
						<button type="button" className="auth-forgot">
							Oublié ?
						</button>
					</div>

					{error && step === 2 && <AuthError message={error} />}

					<button type="submit" className="auth-cta" disabled={loading}>
						{loading ? "Connexion en cours…" : "Se connecter"}
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
				</fieldset>
			</form>

			<div className="auth-switch">
				Pas encore avec nous ? <Link to="/register">Créer un compte</Link>
			</div>
		</AuthLayout>
	);
}

// Pane droit du login : eyebrow + prévisu kanban tiltée + quote serif italique.
function LoginVisual() {
	return (
		<>
			<div className="auth-visual-eyebrow">
				<span className="ping" />
				LUME · ÉCLAT V3
			</div>

			<div className="auth-visual-product">
				<div className="auth-visual-product-inner">
					<div className="auth-visual-titlebar">
						<div className="dots">
							<span />
							<span />
							<span />
						</div>
						<div className="crumb">
							<b>Atelier Boréal</b> / Sprint 14
						</div>
					</div>
					<div className="auth-visual-board">
						<div className="auth-vc">
							<div className="auth-vc-h">
								À FAIRE <span className="pill">8</span>
							</div>
							<div className="auth-vc-card">
								Recadrer la hero
								<div className="m">SE-204</div>
							</div>
							<div className="auth-vc-card">
								Calque grain SVG
								<div className="m">SE-205</div>
							</div>
						</div>
						<div className="auth-vc">
							<div className="auth-vc-h">
								EN COURS <span className="pill">3</span>
							</div>
							<div className="auth-vc-card live">
								Hero — orbes
								<div className="m">
									<span className="da" />
									<span className="tag">live</span>
								</div>
							</div>
							<div className="auth-vc-card">
								Drift 28s
								<div className="m">SE-202</div>
							</div>
						</div>
						<div className="auth-vc">
							<div className="auth-vc-h">
								REVUE <span className="pill">5</span>
							</div>
							<div className="auth-vc-card">
								Italique
								<div className="m">SE-198</div>
							</div>
							<div className="auth-vc-card">
								Contraste
								<div className="m">SE-199</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<blockquote className="auth-quote">
				<span className="auth-quote-mark">&ldquo;</span>
				<p>Tout est lumineux. On retrouve le calme d'un atelier silencieux.</p>
				<footer className="auth-quote-author">
					<span className="av-lg" />
					<span className="who">
						<b>Lume Atelier</b> · Studio fondateur
					</span>
				</footer>
			</blockquote>

			<div className="auth-visual-foot">
				<div>
					<span className="ping" />
					STATUS · OPÉRATIONNEL
				</div>
				<div>HÉBERGÉ EN FRANCE · RGPD</div>
			</div>
		</>
	);
}

export function AuthError({ message }: { message: string }) {
	return (
		<div role="alert" className="auth-error">
			<span className="auth-error-icon">!</span>
			{message}
		</div>
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
