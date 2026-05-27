import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authClient } from "#/lib/auth-client";
import { AppShell } from "#/features/app/AppShell";
import { Icon } from "#/features/app/Icon";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

// ─── Types ──────────────────────────────────────────────────────────────────

type TabId =
	| "profile"
	| "security"
	| "appearance"
	| "notifications"
	| "danger";

interface Tab {
	id: TabId;
	label: string;
	icon: string;
}

// ─── Page principale ────────────────────────────────────────────────────────

function SettingsPage() {
	const navigate = useNavigate();
	const { data: session, isPending } = authClient.useSession();
	const [tab, setTab] = useState<TabId>("profile");

	useEffect(() => {
		if (!isPending && !session?.user) {
			void navigate({ to: "/login" });
		}
	}, [isPending, session, navigate]);

	if (isPending || !session?.user) {
		return (
			<div
				style={{
					display: "flex",
					minHeight: "100vh",
					alignItems: "center",
					justifyContent: "center",
					background: "var(--bg)",
				}}
			>
				<div
					style={{
						height: 4,
						width: 128,
						overflow: "hidden",
						borderRadius: "var(--r-full)",
						background: "var(--border)",
					}}
				>
					<div
						style={{
							height: "100%",
							width: "33%",
							borderRadius: "var(--r-full)",
							background: "var(--accent)",
							animation: "pulse 1.5s ease-in-out infinite",
						}}
					/>
				</div>
			</div>
		);
	}

	const user = session.user;

	const tabs: Tab[] = [
		{ id: "profile", label: "Profil", icon: "user" },
		{ id: "security", label: "Sécurité", icon: "lock" },
		{ id: "appearance", label: "Apparence", icon: "star" },
		{ id: "notifications", label: "Notifications", icon: "bell" },
		{ id: "danger", label: "Zone de danger", icon: "bolt" },
	];

	return (
		<AppShell active={{ route: "settings" }} title="Réglages">
			<div className="view-inner" style={{ padding: 0, height: "100%" }}>
				<div className="settings-layout">
					{/* Navigation latérale */}
					<aside className="settings-side">
						<h2 className="settings-side-title">Réglages</h2>
						{tabs.map((t) => (
							<button
								key={t.id}
								className={`sidebar-item${tab === t.id ? " active" : ""}${t.id === "danger" ? " sidebar-item--danger" : ""}`}
								onClick={() => setTab(t.id)}
							>
								<Icon
									name={t.icon}
									size={14}
									className="sidebar-item-icon"
								/>
								{t.label}
							</button>
						))}
					</aside>

					{/* Zone de contenu */}
					<div className="settings-main">
						<div className="settings-inner">
							{tab === "profile" && (
								<ProfilePanel
									initialName={user.name ?? ""}
									email={user.email ?? ""}
								/>
							)}
							{tab === "security" && <SecurityPanel />}
							{tab === "appearance" && <AppearancePanel />}
							{tab === "notifications" && <NotificationsPanel />}
							{tab === "danger" && (
								<DangerPanel
									email={user.email ?? ""}
									onDeleted={() => {
										window.location.href = "/";
									}}
								/>
							)}
						</div>
					</div>
				</div>
			</div>

			<style>{`
				.settings-layout {
					display: flex;
					height: 100%;
					overflow: hidden;
				}

				.settings-side {
					width: 220px;
					flex: none;
					background: var(--bg);
					border-right: 1px solid var(--border);
					padding: 20px 10px;
					overflow-y: auto;
				}

				.settings-side-title {
					font-size: 11px;
					font-weight: 600;
					margin: 0 12px 12px;
					color: var(--text-muted);
					text-transform: uppercase;
					letter-spacing: 0.06em;
				}

				.settings-main {
					flex: 1;
					overflow-y: auto;
					background: var(--bg);
				}

				.settings-inner {
					max-width: 680px;
					padding: 36px 44px 64px;
				}

				.settings-h1 {
					font-size: 22px;
					font-weight: 500;
					letter-spacing: -0.015em;
					margin: 0 0 4px;
					color: var(--text);
				}

				.settings-section {
					padding: 24px 0;
					border-top: 1px solid var(--border);
				}

				.settings-section:first-of-type {
					border-top: none;
					padding-top: 16px;
				}

				.settings-row {
					display: grid;
					grid-template-columns: 200px 1fr;
					gap: 32px;
					padding: 14px 0;
					align-items: start;
				}

				.settings-row-label {
					font-size: 13.5px;
					font-weight: 500;
					color: var(--text);
					padding-top: 6px;
				}

				.settings-row-hint {
					font-size: 12.5px;
					color: var(--text-muted);
					margin-top: 3px;
					line-height: 1.45;
				}

				.settings-feedback {
					display: flex;
					align-items: flex-start;
					gap: 8px;
					padding: 10px 12px;
					border-radius: var(--r-md);
					font-size: 13px;
					margin-top: 4px;
				}

				.settings-feedback--error {
					background: var(--red-soft);
					border: 1px solid oklch(0.85 0.06 25);
					color: var(--red);
				}

				.settings-feedback--success {
					background: var(--green-soft);
					border: 1px solid oklch(0.85 0.12 150);
					color: var(--green);
				}

				.settings-req-row {
					display: flex;
					flex-wrap: wrap;
					gap: 16px;
					padding: 4px 0;
				}

				.settings-req {
					display: inline-flex;
					align-items: center;
					gap: 5px;
					font-size: 12px;
				}

				.toggle {
					width: 32px;
					height: 18px;
					background: var(--border-strong);
					border-radius: 100px;
					position: relative;
					cursor: pointer;
					transition: background 0.18s;
					flex: none;
					border: none;
					outline: none;
				}

				.toggle::after {
					content: '';
					position: absolute;
					top: 2px;
					left: 2px;
					width: 14px;
					height: 14px;
					background: white;
					border-radius: 50%;
					transition: transform 0.18s;
				}

				.toggle.on { background: var(--accent); }
				.toggle.on::after { transform: translateX(14px); }

				.sidebar-item--danger {
					color: var(--red) !important;
				}

				.sidebar-item--danger:hover,
				.sidebar-item--danger.active {
					background: var(--red-soft) !important;
					color: var(--red) !important;
				}

				.settings-avatar-init {
					width: 52px;
					height: 52px;
					border-radius: 50%;
					background: linear-gradient(135deg, var(--accent) 0%, oklch(0.45 0.18 240) 100%);
					display: grid;
					place-items: center;
					font-size: 20px;
					font-weight: 600;
					color: white;
					flex: none;
				}

				.settings-danger-row {
					display: flex;
					align-items: center;
					justify-content: space-between;
					flex-wrap: wrap;
					gap: 12px;
					padding: 16px 0;
					border-top: 1px solid var(--border);
				}

				.settings-danger-row:first-of-type {
					border-top: none;
				}

				.settings-pw-eye {
					position: absolute;
					right: 0;
					top: 0;
					bottom: 0;
					display: flex;
					align-items: center;
					padding: 0 10px;
					background: none;
					border: none;
					cursor: pointer;
					color: var(--text-muted);
				}

				.settings-pw-eye:hover { color: var(--text); }

				.settings-input-wrap {
					position: relative;
				}

				@media (max-width: 640px) {
					.settings-side { width: 180px; }
					.settings-inner { padding: 24px 20px 48px; }
					.settings-row { grid-template-columns: 1fr; gap: 8px; }
				}
			`}</style>
		</AppShell>
	);
}

// ─── Composants utilitaires ─────────────────────────────────────────────────

function Field({
	id,
	label,
	type = "text",
	value,
	onChange,
	autoComplete,
	placeholder,
	readOnly,
	hint,
	rightSlot,
}: {
	id: string;
	label: string;
	type?: string;
	value: string;
	onChange?: (v: string) => void;
	autoComplete?: string;
	placeholder?: string;
	readOnly?: boolean;
	hint?: string;
	rightSlot?: React.ReactNode;
}) {
	return (
		<div>
			<label
				htmlFor={id}
				style={{
					display: "block",
					fontSize: 13,
					fontWeight: 500,
					marginBottom: 6,
					color: "var(--text)",
				}}
			>
				{label}
			</label>
			<div className="settings-input-wrap">
				<input
					id={id}
					type={type}
					autoComplete={autoComplete}
					value={value}
					onChange={(e) => onChange?.(e.target.value)}
					placeholder={placeholder}
					readOnly={readOnly}
					className="input"
					style={{
						width: "100%",
						paddingRight: rightSlot ? 40 : undefined,
						background: readOnly ? "var(--bg-soft)" : undefined,
						color: readOnly ? "var(--text-muted)" : undefined,
					}}
				/>
				{rightSlot && (
					<button
						type="button"
						className="settings-pw-eye"
						onClick={(e) => {
							const btn = e.currentTarget as HTMLButtonElement;
							btn.dispatchEvent(new CustomEvent("toggle-eye", { bubbles: true }));
						}}
					>
						{rightSlot}
					</button>
				)}
			</div>
			{hint && (
				<div className="settings-row-hint" style={{ marginTop: 4 }}>
					{hint}
				</div>
			)}
		</div>
	);
}

function Feedback({
	kind,
	children,
}: {
	kind: "error" | "success";
	children: React.ReactNode;
}) {
	return (
		<div
			role="alert"
			className={`settings-feedback settings-feedback--${kind}`}
		>
			<span
				style={{
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
					width: 16,
					height: 16,
					borderRadius: "50%",
					background: kind === "error" ? "var(--red)" : "var(--green)",
					color: "white",
					fontSize: 10,
					fontWeight: 700,
					flexShrink: 0,
					marginTop: 1,
				}}
			>
				{kind === "error" ? "!" : "✓"}
			</span>
			{children}
		</div>
	);
}

function Requirement({ ok, children }: { ok: boolean; children: React.ReactNode }) {
	return (
		<span className="settings-req">
			<Icon
				name="check"
				size={13}
				stroke={3}
				style={{ color: ok ? "var(--green)" : "var(--border-strong)" }}
			/>
			<span style={{ color: ok ? "var(--green)" : "var(--text-muted)" }}>
				{children}
			</span>
		</span>
	);
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
	return (
		<button
			type="button"
			className={`toggle${on ? " on" : ""}`}
			onClick={onToggle}
			aria-pressed={on}
		/>
	);
}

// ─── Panneau Profil ─────────────────────────────────────────────────────────

function ProfilePanel({
	initialName,
	email,
}: {
	initialName: string;
	email: string;
}) {
	const [name, setName] = useState(initialName);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const dirty = name.trim() !== initialName && name.trim().length > 0;
	const initial = (name || email).charAt(0).toUpperCase();

	async function handleSave(e: React.FormEvent) {
		e.preventDefault();
		if (!dirty) return;
		setSaving(true);
		setError(null);
		setSuccess(false);
		const { error: err } = await authClient.updateUser({ name: name.trim() });
		setSaving(false);
		if (err) {
			setError(err.message ?? "Impossible d'enregistrer le profil.");
			return;
		}
		setSuccess(true);
		setTimeout(() => setSuccess(false), 3000);
	}

	return (
		<div>
			<h1 className="settings-h1">Profil</h1>
			<p
				className="text-muted text-sm"
				style={{ margin: "0 0 8px" }}
			>
				Tes informations personnelles, visibles dans tes tableaux et cartes.
			</p>

			<form onSubmit={handleSave}>
				<div className="settings-section">
					{/* Avatar */}
					<div className="settings-row">
						<div className="settings-row-label">Avatar</div>
						<div className="row" style={{ gap: 14 }}>
							<div className="settings-avatar-init">{initial}</div>
							<div
								className="text-muted"
								style={{ fontSize: 13, paddingTop: 6 }}
							>
								Généré depuis l'initiale de ton nom.
							</div>
						</div>
					</div>

					{/* Nom */}
					<div className="settings-row">
						<div className="settings-row-label">Nom affiché</div>
						<Field
							id="profile-name"
							label=""
							value={name}
							onChange={setName}
							autoComplete="name"
							placeholder="Ton nom"
						/>
					</div>

					{/* Email */}
					<div className="settings-row">
						<div className="settings-row-label">Adresse email</div>
						<Field
							id="profile-email"
							label=""
							type="email"
							value={email}
							readOnly
							hint="L'email ne peut pas être modifié pour le moment."
						/>
					</div>
				</div>

				{/* Messages */}
				{error && (
					<Feedback kind="error">{error}</Feedback>
				)}
				{success && (
					<Feedback kind="success">Profil mis à jour avec succès.</Feedback>
				)}

				{/* Actions */}
				<div
					className="row"
					style={{
						marginTop: 24,
						paddingTop: 24,
						borderTop: "1px solid var(--border)",
						gap: 8,
						justifyContent: "flex-end",
					}}
				>
					<button
						type="button"
						className="btn btn--ghost"
						onClick={() => setName(initialName)}
					>
						Annuler
					</button>
					<button
						type="submit"
						className="btn btn--primary"
						disabled={!dirty || saving}
					>
						{saving ? "Enregistrement…" : "Enregistrer"}
					</button>
				</div>
			</form>
		</div>
	);
}

// ─── Panneau Sécurité ───────────────────────────────────────────────────────

function SecurityPanel() {
	const [current, setCurrent] = useState("");
	const [next, setNext] = useState("");
	const [confirm, setConfirm] = useState("");
	const [showPw, setShowPw] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const nextOk = next.length >= 8;
	const matchOk = next.length > 0 && next === confirm;
	const canSubmit = current.length > 0 && nextOk && matchOk;

	async function handleSave(e: React.FormEvent) {
		e.preventDefault();
		if (!canSubmit) return;
		setSaving(true);
		setError(null);
		setSuccess(false);
		const { error: err } = await authClient.changePassword({
			currentPassword: current,
			newPassword: next,
			revokeOtherSessions: true,
		});
		setSaving(false);
		if (err) {
			setError(
				err.message ??
					"Impossible de changer le mot de passe. Vérifie le mot de passe actuel.",
			);
			return;
		}
		setSuccess(true);
		setCurrent("");
		setNext("");
		setConfirm("");
		setTimeout(() => setSuccess(false), 3000);
	}

	return (
		<div>
			<h1 className="settings-h1">Sécurité</h1>
			<p className="text-muted text-sm" style={{ margin: "0 0 8px" }}>
				Change ton mot de passe. Les autres sessions seront déconnectées.
			</p>

			<form onSubmit={handleSave}>
				<div className="settings-section">
					{/* Mot de passe actuel */}
					<div className="settings-row">
						<div className="settings-row-label">
							Mot de passe actuel
						</div>
						<div className="settings-input-wrap">
							<input
								id="pw-current"
								type={showPw ? "text" : "password"}
								autoComplete="current-password"
								value={current}
								onChange={(e) => setCurrent(e.target.value)}
								placeholder="••••••••"
								className="input"
								style={{ width: "100%", paddingRight: 40 }}
							/>
							<button
								type="button"
								className="settings-pw-eye"
								onClick={() => setShowPw((v) => !v)}
								aria-label={showPw ? "Masquer" : "Afficher"}
							>
								<Icon name="eye" size={15} />
							</button>
						</div>
					</div>

					{/* Nouveau mot de passe */}
					<div className="settings-row">
						<div className="settings-row-label">
							Nouveau mot de passe
						</div>
						<input
							id="pw-next"
							type={showPw ? "text" : "password"}
							autoComplete="new-password"
							value={next}
							onChange={(e) => setNext(e.target.value)}
							placeholder="8 caractères minimum"
							className="input"
							style={{ width: "100%" }}
						/>
					</div>

					{/* Confirmation */}
					<div className="settings-row">
						<div className="settings-row-label">
							Confirme le nouveau mot de passe
						</div>
						<input
							id="pw-confirm"
							type={showPw ? "text" : "password"}
							autoComplete="new-password"
							value={confirm}
							onChange={(e) => setConfirm(e.target.value)}
							placeholder="Retape le mot de passe"
							className="input"
							style={{ width: "100%" }}
						/>
					</div>
				</div>

				{/* Indicateurs de validité */}
				<div className="settings-req-row">
					<Requirement ok={nextOk}>Au moins 8 caractères</Requirement>
					<Requirement ok={matchOk}>
						Les deux mots de passe correspondent
					</Requirement>
				</div>

				{/* Messages */}
				{error && (
					<div style={{ marginTop: 12 }}>
						<Feedback kind="error">{error}</Feedback>
					</div>
				)}
				{success && (
					<div style={{ marginTop: 12 }}>
						<Feedback kind="success">Mot de passe mis à jour.</Feedback>
					</div>
				)}

				<div
					className="row"
					style={{
						marginTop: 24,
						paddingTop: 24,
						borderTop: "1px solid var(--border)",
						justifyContent: "flex-end",
					}}
				>
					<button
						type="submit"
						className="btn btn--primary"
						disabled={!canSubmit || saving}
					>
						{saving ? "Mise à jour…" : "Mettre à jour le mot de passe"}
					</button>
				</div>
			</form>
		</div>
	);
}

// ─── Panneau Apparence (local uniquement) ────────────────────────────────────

type ThemeId = "system" | "light" | "dark";

const THEMES: { id: ThemeId; label: string }[] = [
	{ id: "system", label: "Système" },
	{ id: "light", label: "Clair" },
	{ id: "dark", label: "Sombre" },
];

function AppearancePanel() {
	const [theme, setTheme] = useState<ThemeId>("system");
	const [compactMode, setCompactMode] = useState(false);
	const [reducedMotion, setReducedMotion] = useState(false);

	return (
		<div>
			<h1 className="settings-h1">Apparence</h1>
			<p className="text-muted text-sm" style={{ margin: "0 0 8px" }}>
				Personnalise l'affichage de Flowboard. Ces préférences restent locales.
			</p>

			<div className="settings-section">
				{/* Thème */}
				<div className="settings-row">
					<div className="settings-row-label">
						Thème
						<div className="settings-row-hint">Apparence générale de l'interface</div>
					</div>
					<div
						className="row"
						style={{
							padding: 3,
							background: "var(--bg-soft)",
							borderRadius: 8,
							width: "fit-content",
							gap: 0,
						}}
					>
						{THEMES.map((t) => (
							<button
								key={t.id}
								type="button"
								onClick={() => setTheme(t.id)}
								style={{
									padding: "5px 16px",
									border: "none",
									borderRadius: 6,
									background:
										theme === t.id
											? "var(--surface)"
											: "transparent",
									boxShadow:
										theme === t.id ? "var(--shadow-xs)" : "none",
									fontSize: 13,
									fontWeight: 500,
									color:
										theme === t.id
											? "var(--text)"
											: "var(--text-muted)",
									cursor: "pointer",
									transition: "all 0.15s",
								}}
							>
								{t.label}
							</button>
						))}
					</div>
				</div>

				{/* Mode compact */}
				<div className="settings-row">
					<div className="settings-row-label">
						Mode compact
						<div className="settings-row-hint">
							Réduit l'espacement pour afficher plus de contenu
						</div>
					</div>
					<div className="row" style={{ gap: 12 }}>
						<Toggle
							on={compactMode}
							onToggle={() => setCompactMode((v) => !v)}
						/>
						<span className="text-muted text-sm">
							{compactMode ? "Activé" : "Désactivé"}
						</span>
					</div>
				</div>

				{/* Mouvement réduit */}
				<div className="settings-row">
					<div className="settings-row-label">
						Réduire les animations
						<div className="settings-row-hint">
							Pour les personnes sensibles aux mouvements
						</div>
					</div>
					<div className="row" style={{ gap: 12 }}>
						<Toggle
							on={reducedMotion}
							onToggle={() => setReducedMotion((v) => !v)}
						/>
						<span className="text-muted text-sm">
							{reducedMotion ? "Activé" : "Désactivé"}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

// ─── Panneau Notifications (local uniquement) ────────────────────────────────

type NotifKey =
	| "mention"
	| "assigned"
	| "due"
	| "daily"
	| "weekly"
	| "marketing";

interface NotifState {
	mention: boolean;
	assigned: boolean;
	due: boolean;
	daily: boolean;
	weekly: boolean;
	marketing: boolean;
}

const NOTIF_ROWS: { label: string; key: NotifKey }[] = [
	{ label: "Mention dans un commentaire", key: "mention" },
	{ label: "Carte assignée", key: "assigned" },
	{ label: "Carte arrivée à échéance", key: "due" },
	{ label: "Résumé quotidien", key: "daily" },
	{ label: "Résumé hebdomadaire", key: "weekly" },
	{ label: "Nouveautés produit", key: "marketing" },
];

function NotificationsPanel() {
	const [notifs, setNotifs] = useState<NotifState>({
		mention: true,
		assigned: true,
		due: true,
		daily: false,
		weekly: true,
		marketing: false,
	});

	function toggle(key: NotifKey) {
		setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));
	}

	return (
		<div>
			<h1 className="settings-h1">Notifications</h1>
			<p className="text-muted text-sm" style={{ margin: "0 0 8px" }}>
				Choisis quand on t'interrompt — et comment.
			</p>

			<div className="settings-section">
				{NOTIF_ROWS.map(({ label, key }) => (
					<div className="settings-row" key={key}>
						<div className="settings-row-label">{label}</div>
						<div className="row" style={{ gap: 12 }}>
							<Toggle on={notifs[key]} onToggle={() => toggle(key)} />
							<span className="text-muted text-sm">
								{notifs[key]
									? "Activé · email + dans l'app"
									: "Désactivé"}
							</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

// ─── Panneau Zone de danger ──────────────────────────────────────────────────

function DangerPanel({
	email,
	onDeleted,
}: {
	email: string;
	onDeleted: () => void;
}) {
	const [deleteOpen, setDeleteOpen] = useState(false);

	async function handleSignOut() {
		await authClient.signOut();
		window.location.href = "/";
	}

	return (
		<div>
			<h1 className="settings-h1" style={{ color: "var(--red)" }}>
				Zone de danger
			</h1>
			<p className="text-muted text-sm" style={{ margin: "0 0 8px" }}>
				Actions définitives. À utiliser avec précaution.
			</p>

			<div className="settings-section">
				{/* Déconnexion */}
				<div className="settings-danger-row" style={{ borderTop: "none" }}>
					<div>
						<div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>
							Se déconnecter
						</div>
						<div className="settings-row-hint">
							Ferme ta session sur cet appareil.
						</div>
					</div>
					<button
						type="button"
						className="btn btn--outline"
						onClick={() => void handleSignOut()}
					>
						<Icon name="arrow" size={14} />
						Se déconnecter
					</button>
				</div>

				{/* Suppression de compte */}
				<div className="settings-danger-row">
					<div>
						<div
							style={{
								fontSize: 14,
								fontWeight: 500,
								color: "var(--red)",
							}}
						>
							Supprimer mon compte
						</div>
						<div className="settings-row-hint">
							Efface ton compte et tes données. Action irréversible.
						</div>
					</div>
					<button
						type="button"
						className="btn btn--outline"
						style={{
							color: "var(--red)",
							borderColor: "oklch(0.78 0.10 25)",
						}}
						onClick={() => setDeleteOpen(true)}
					>
						<Icon name="trash" size={14} />
						Supprimer le compte…
					</button>
				</div>
			</div>

			<DeleteAccountDialog
				email={email}
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				onDeleted={onDeleted}
			/>
		</div>
	);
}

// ─── Dialog suppression de compte ───────────────────────────────────────────

function DeleteAccountDialog({
	email,
	open,
	onOpenChange,
	onDeleted,
}: {
	email: string;
	open: boolean;
	onOpenChange: (v: boolean) => void;
	onDeleted: () => void;
}) {
	const [confirmText, setConfirmText] = useState("");
	const [password, setPassword] = useState("");
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const canDelete = confirmText.trim() === email && password.length > 0;

	async function handleDelete() {
		if (!canDelete) return;
		setDeleting(true);
		setError(null);
		const { error: err } = await authClient.deleteUser({ password });
		setDeleting(false);
		if (err) {
			setError(
				err.message ?? "Suppression impossible. Vérifie ton mot de passe.",
			);
			return;
		}
		onDeleted();
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle style={{ color: "var(--red)" }}>
						Supprimer définitivement le compte
					</DialogTitle>
					<DialogDescription>
						Cette action est irréversible. Tes tableaux personnels et tes
						données seront perdus.
					</DialogDescription>
				</DialogHeader>

				<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
					<div>
						<label
							htmlFor="del-confirm"
							style={{
								display: "block",
								fontSize: 13,
								fontWeight: 500,
								marginBottom: 6,
								color: "var(--text)",
							}}
						>
							Tape ton email pour confirmer
						</label>
						<input
							id="del-confirm"
							className="input"
							style={{ width: "100%" }}
							value={confirmText}
							onChange={(e) => setConfirmText(e.target.value)}
							placeholder={email}
						/>
					</div>

					<div>
						<label
							htmlFor="del-password"
							style={{
								display: "block",
								fontSize: 13,
								fontWeight: 500,
								marginBottom: 6,
								color: "var(--text)",
							}}
						>
							Mot de passe
						</label>
						<input
							id="del-password"
							type="password"
							autoComplete="current-password"
							className="input"
							style={{ width: "100%" }}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="••••••••"
						/>
					</div>

					{error && <Feedback kind="error">{error}</Feedback>}
				</div>

				<DialogFooter style={{ gap: 8 }}>
					<button
						type="button"
						className="btn btn--ghost"
						onClick={() => onOpenChange(false)}
					>
						Annuler
					</button>
					<button
						type="button"
						className="btn"
						style={{
							background: "var(--red)",
							color: "white",
							opacity: !canDelete || deleting ? 0.5 : 1,
							cursor: !canDelete || deleting ? "not-allowed" : "pointer",
						}}
						disabled={!canDelete || deleting}
						onClick={() => void handleDelete()}
					>
						{deleting ? "Suppression…" : "Supprimer mon compte"}
					</button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
