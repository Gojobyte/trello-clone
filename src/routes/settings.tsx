// ============ SETTINGS · Lume Éclat (Phase 3d) ============
// Layout 2 colonnes : nav latérale sticky + panneaux Éclat.
// Sections : Profil / Sécurité / Apparence / Notifications / Zone de danger.

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { AppShell } from "#/features/app/AppShell";
import { Icon } from "#/features/app/Icon";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

// ─── Types ──────────────────────────────────────────────────────────────────

type TabId = "profile" | "security" | "appearance" | "notifications" | "danger";

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
			<AppShell active={{ route: "settings" }} title="Réglages">
				<div className="tools-page">
					<div style={{ padding: 48, display: "grid", placeItems: "center" }}>
						<div
							style={{
								height: 4,
								width: 128,
								overflow: "hidden",
								borderRadius: "var(--r-full, 999px)",
								background: "var(--border-c)",
							}}
						>
							<div
								style={{
									height: "100%",
									width: "33%",
									borderRadius: "var(--r-full, 999px)",
									background: "var(--accent)",
									animation: "pulse 1.5s ease-in-out infinite",
								}}
							/>
						</div>
					</div>
				</div>
			</AppShell>
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
			<div className="tools-page">
				<header className="mw-pagehead">
					<div className="mw-greet">
						<h1 className="mw-greet-h1">Réglages.</h1>
					</div>
				</header>

				<section className="tools-body">
					<div className="settings-grid">
						<nav className="settings-nav" aria-label="Sections de réglages">
							<div className="settings-nav-title">Sections</div>
							{tabs.map((t) => (
								<button
									key={t.id}
									type="button"
									className={`settings-nav-item${tab === t.id ? " is-active" : ""}${t.id === "danger" ? " settings-nav-item--danger" : ""}`}
									onClick={() => setTab(t.id)}
								>
									<span className="settings-nav-dot" aria-hidden />
									{t.label}
								</button>
							))}
						</nav>

						<div className="settings-panels">
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
				</section>
			</div>
		</AppShell>
	);
}

// ─── Composants utilitaires ─────────────────────────────────────────────────

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
			className={`settings-feedback settings-feedback--${kind === "error" ? "err" : "ok"}`}
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

function Requirement({
	ok,
	children,
}: {
	ok: boolean;
	children: React.ReactNode;
}) {
	return (
		<span className={`settings-req${ok ? " is-ok" : ""}`}>
			<Icon
				name="check"
				size={13}
				stroke={3}
				style={{ color: ok ? "var(--green)" : "var(--border-strong)" }}
			/>
			<span>{children}</span>
		</span>
	);
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
	return (
		<button
			type="button"
			className={`acc-toggle${on ? " is-on" : ""}`}
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
		<form onSubmit={handleSave} className="settings-panel">
			<div className="settings-panel-head">
				<h2 className="settings-panel-title">Profil</h2>
				<p className="settings-panel-desc">
					Tes informations personnelles, visibles dans tes tableaux et cartes.
				</p>
			</div>

			<div className="settings-panel-body">
				<div className="settings-field-row">
					<div className="settings-field-label">
						Avatar
						<div className="settings-field-hint">Généré depuis l'initiale.</div>
					</div>
					<div style={{ display: "flex", alignItems: "center", gap: 14 }}>
						<div className="settings-avatar">{initial}</div>
						<div className="settings-field-hint">
							Une vraie photo de profil arrivera plus tard.
						</div>
					</div>
				</div>

				<div className="settings-field-row">
					<div className="settings-field-label">Nom affiché</div>
					<div className="settings-field">
						<input
							id="profile-name"
							className="input"
							autoComplete="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Ton nom"
						/>
					</div>
				</div>

				<div className="settings-field-row">
					<div className="settings-field-label">Adresse email</div>
					<div className="settings-field">
						<input
							id="profile-email"
							className="input"
							type="email"
							value={email}
							readOnly
							style={{
								background: "var(--bg-soft)",
								color: "var(--text-muted)",
							}}
						/>
						<div className="settings-field-hint">
							L'email ne peut pas être modifié pour le moment.
						</div>
					</div>
				</div>

				{error && <Feedback kind="error">{error}</Feedback>}
				{success && (
					<Feedback kind="success">Profil mis à jour avec succès.</Feedback>
				)}
			</div>

			<div className="settings-panel-foot">
				<button
					type="button"
					className="btn btn--ghost"
					onClick={() => setName(initialName)}
					disabled={!dirty || saving}
				>
					Annuler
				</button>
				<button
					type="submit"
					className="btn btn--accent"
					disabled={!dirty || saving}
				>
					{saving ? "Enregistrement…" : "Enregistrer"}
				</button>
			</div>
		</form>
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
		<form onSubmit={handleSave} className="settings-panel">
			<div className="settings-panel-head">
				<h2 className="settings-panel-title">Sécurité</h2>
				<p className="settings-panel-desc">
					Change ton mot de passe. Les autres sessions seront déconnectées.
				</p>
			</div>

			<div className="settings-panel-body">
				<div className="settings-field-row">
					<div className="settings-field-label">Mot de passe actuel</div>
					<div className="settings-input-wrap">
						<input
							id="pw-current"
							type={showPw ? "text" : "password"}
							autoComplete="current-password"
							value={current}
							onChange={(e) => setCurrent(e.target.value)}
							placeholder="••••••••"
							className="input"
							style={{ paddingRight: 40 }}
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

				<div className="settings-field-row">
					<div className="settings-field-label">Nouveau mot de passe</div>
					<input
						id="pw-next"
						type={showPw ? "text" : "password"}
						autoComplete="new-password"
						value={next}
						onChange={(e) => setNext(e.target.value)}
						placeholder="8 caractères minimum"
						className="input"
					/>
				</div>

				<div className="settings-field-row">
					<div className="settings-field-label">Confirme le mot de passe</div>
					<input
						id="pw-confirm"
						type={showPw ? "text" : "password"}
						autoComplete="new-password"
						value={confirm}
						onChange={(e) => setConfirm(e.target.value)}
						placeholder="Retape le mot de passe"
						className="input"
					/>
				</div>

				<div className="settings-field-row">
					<div className="settings-field-label">Critères</div>
					<div className="settings-req-row">
						<Requirement ok={nextOk}>Au moins 8 caractères</Requirement>
						<Requirement ok={matchOk}>
							Les mots de passe correspondent
						</Requirement>
					</div>
				</div>

				{error && <Feedback kind="error">{error}</Feedback>}
				{success && (
					<Feedback kind="success">Mot de passe mis à jour.</Feedback>
				)}
			</div>

			<div className="settings-panel-foot">
				<button
					type="submit"
					className="btn btn--accent"
					disabled={!canSubmit || saving}
				>
					{saving ? "Mise à jour…" : "Mettre à jour"}
				</button>
			</div>
		</form>
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
		<div className="settings-panel">
			<div className="settings-panel-head">
				<h2 className="settings-panel-title">Apparence</h2>
				<p className="settings-panel-desc">
					Personnalise l'affichage de Flowboard. Ces préférences restent
					locales.
				</p>
			</div>

			<div className="settings-panel-body">
				<div className="settings-field-row">
					<div className="settings-field-label">
						Thème
						<div className="settings-field-hint">
							Apparence générale de l'interface
						</div>
					</div>
					<div className="acc-segmented">
						{THEMES.map((t) => (
							<button
								key={t.id}
								type="button"
								onClick={() => setTheme(t.id)}
								className={`acc-segmented-item${theme === t.id ? " is-active" : ""}`}
							>
								{t.label}
							</button>
						))}
					</div>
				</div>

				<div className="settings-field-row">
					<div className="settings-field-label">
						Mode compact
						<div className="settings-field-hint">
							Réduit l'espacement pour afficher plus de contenu.
						</div>
					</div>
					<div style={{ display: "flex", gap: 12, alignItems: "center" }}>
						<Toggle
							on={compactMode}
							onToggle={() => setCompactMode((v) => !v)}
						/>
						<span className="text-muted text-sm">
							{compactMode ? "Activé" : "Désactivé"}
						</span>
					</div>
				</div>

				<div className="settings-field-row">
					<div className="settings-field-label">
						Réduire les animations
						<div className="settings-field-hint">
							Pour les personnes sensibles aux mouvements.
						</div>
					</div>
					<div style={{ display: "flex", gap: 12, alignItems: "center" }}>
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

const NOTIF_ROWS: { label: string; key: NotifKey; hint: string }[] = [
	{
		label: "Mention dans un commentaire",
		key: "mention",
		hint: "Quand quelqu'un te cite avec @",
	},
	{
		label: "Carte assignée",
		key: "assigned",
		hint: "Quand on t'attribue une carte",
	},
	{
		label: "Carte arrivée à échéance",
		key: "due",
		hint: "Le jour J et la veille",
	},
	{
		label: "Résumé quotidien",
		key: "daily",
		hint: "Email à 8h, du lundi au vendredi",
	},
	{
		label: "Résumé hebdomadaire",
		key: "weekly",
		hint: "Email tous les lundis",
	},
	{
		label: "Nouveautés produit",
		key: "marketing",
		hint: "Au maximum une fois par mois",
	},
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
		<div className="settings-panel">
			<div className="settings-panel-head">
				<h2 className="settings-panel-title">Notifications</h2>
				<p className="settings-panel-desc">
					Choisis quand on t'interrompt — et comment.
				</p>
			</div>

			<div className="settings-panel-body">
				{NOTIF_ROWS.map(({ label, key, hint }) => (
					<div className="settings-field-row" key={key}>
						<div className="settings-field-label">
							{label}
							<div className="settings-field-hint">{hint}</div>
						</div>
						<div style={{ display: "flex", gap: 12, alignItems: "center" }}>
							<Toggle on={notifs[key]} onToggle={() => toggle(key)} />
							<span className="text-muted text-sm">
								{notifs[key] ? "Activé · email + in-app" : "Désactivé"}
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
		<div className="danger-zone">
			<div className="settings-panel-head">
				<h2 className="settings-panel-title">Zone de danger</h2>
				<p className="settings-panel-desc">
					Actions définitives. À utiliser avec précaution.
				</p>
			</div>

			<div className="danger-row">
				<div>
					<div className="danger-row-title">Se déconnecter</div>
					<div className="danger-row-desc">
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

			<div className="danger-row">
				<div>
					<div className="danger-row-title is-red">Supprimer mon compte</div>
					<div className="danger-row-desc">
						Efface ton compte et tes données. Action irréversible.
					</div>
				</div>
				<button
					type="button"
					className="btn btn--danger"
					onClick={() => setDeleteOpen(true)}
				>
					<Icon name="trash" size={14} />
					Supprimer…
				</button>
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
							className="label"
							style={{ color: "var(--text)" }}
						>
							Tape ton email pour confirmer
						</label>
						<input
							id="del-confirm"
							className="input"
							value={confirmText}
							onChange={(e) => setConfirmText(e.target.value)}
							placeholder={email}
						/>
					</div>

					<div>
						<label
							htmlFor="del-password"
							className="label"
							style={{ color: "var(--text)" }}
						>
							Mot de passe
						</label>
						<input
							id="del-password"
							type="password"
							autoComplete="current-password"
							className="input"
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
						className="btn btn--danger-solid"
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
