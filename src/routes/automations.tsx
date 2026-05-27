// ============ AUTOMATIONS · Lume Éclat (Phase 3d, group B) ============
// 2-col layout : liste de règles (toggle on/off) + panneau d'aide « comment ça marche ».

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "#/features/app/AppShell";
import { Icon } from "#/features/app/Icon";
import { authClient } from "#/lib/auth-client";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

// ============ CATALOGUES ============

interface CatalogEntry {
	code: string;
	label: string;
	icon: string;
}

const TRIGGERS: CatalogEntry[] = [
	{ code: "card.created", label: "Quand une carte est créée", icon: "plus" },
	{
		code: "card.completed",
		label: "Quand une carte est terminée",
		icon: "check",
	},
	{
		code: "card.moved",
		label: "Quand une carte change de liste",
		icon: "arrow",
	},
	{
		code: "due.approaching",
		label: "Quand une échéance approche",
		icon: "clock",
	},
	{
		code: "card.assigned",
		label: "Quand une carte est assignée",
		icon: "user",
	},
	{
		code: "comment.added",
		label: "Quand un commentaire est ajouté",
		icon: "chat",
	},
];

const ACTIONS: CatalogEntry[] = [
	{ code: "notify", label: "Envoyer une notification", icon: "bell" },
	{ code: "archive", label: "Archiver la carte", icon: "check" },
	{ code: "move.done", label: "Déplacer vers Terminé", icon: "arrow" },
	{ code: "assign", label: "Assigner un membre", icon: "user" },
	{ code: "label.add", label: "Ajouter une étiquette", icon: "flag" },
	{ code: "comment", label: "Ajouter un commentaire", icon: "chat" },
	{ code: "due.set", label: "Définir une échéance", icon: "clock" },
];

function triggerLabel(code: string): string {
	return TRIGGERS.find((t) => t.code === code)?.label ?? code;
}

function triggerIcon(code: string): string {
	return TRIGGERS.find((t) => t.code === code)?.icon ?? "bolt";
}

function actionLabel(code: string): string {
	return ACTIONS.find((a) => a.code === code)?.label ?? code;
}

function actionIcon(code: string): string {
	return ACTIONS.find((a) => a.code === code)?.icon ?? "bolt";
}

// ============ ROUTE ============

export const Route = createFileRoute("/automations")({
	component: AutomationsRoute,
});

function AutomationsRoute() {
	return (
		<AppShell
			active={{ route: "automations" }}
			title="Automatisations"
			crumbs={["Atelier Marchand"]}
		>
			<AutomationsContent />
		</AppShell>
	);
}

// ============ CONTENU ============

function AutomationsContent() {
	const { data: session } = authClient.useSession();
	const rules = useQuery(api.automations.list, session?.user ? {} : "skip");
	const createRule = useMutation(api.automations.create);
	const removeRule = useMutation(api.automations.remove);

	const [modalOpen, setModalOpen] = useState(false);

	function openModal() {
		setModalOpen(true);
	}

	async function handleCreate(
		name: string,
		trigger: string,
		actions: string[],
	) {
		await createRule({ name, trigger, actions });
		toast.success("Règle créée avec succès");
		setModalOpen(false);
	}

	async function handleRemove(ruleId: Id<"automationRules">, name: string) {
		if (!window.confirm(`Supprimer la règle « ${name} » ?`)) return;
		await removeRule({ ruleId });
		toast.success("Règle supprimée");
	}

	if (rules === undefined) {
		return (
			<div className="tools-page">
				<header className="mw-pagehead">
					<div className="mw-pagehead-dotgrid" aria-hidden="true" />
					<div className="mw-greet">
						<div>
							<h1 className="mw-greet-h1">
								Automatisations <em className="serif-italic">avec règles</em>.
							</h1>
							<p className="mw-sub">
								<span className="mw-sub-live">
									<span className="ping" />
									chargement…
								</span>
							</p>
						</div>
					</div>
				</header>
			</div>
		);
	}

	const activeCount = rules.filter((r) => r.enabled).length;
	const totalRuns = rules.reduce((acc, r) => acc + r.runCount, 0);

	return (
		<div className="tools-page">
			{/* Page header */}
			<header className="mw-pagehead">
				<div className="mw-pagehead-dotgrid" aria-hidden="true" />
				<div className="mw-greet">
					<div>
						<h1 className="mw-greet-h1">
							Automatisations <em className="serif-italic">avec règles</em>.
						</h1>
						<p className="mw-sub">
							<span className="mw-sub-live">
								<span className="ping" />
								{activeCount} active{activeCount !== 1 ? "s" : ""}
							</span>
							<span aria-hidden="true">·</span>
							<span>
								{rules.length} règle{rules.length !== 1 ? "s" : ""} configurée
								{rules.length !== 1 ? "s" : ""}
							</span>
							<span aria-hidden="true">·</span>
							<span>{totalRuns} exécutions</span>
						</p>
					</div>
					<div className="tools-page-actions">
						<button type="button" className="mw-cta" onClick={openModal}>
							<Icon name="plus" size={14} />
							<span>Nouvelle règle</span>
						</button>
					</div>
				</div>
			</header>

			<div className="tools-body">
				{rules.length === 0 ? (
					<div className="rule-empty">
						<h2 className="rule-empty-title">
							Encore <em className="serif-italic">aucune règle</em>.
						</h2>
						<p className="rule-empty-sub">
							Les règles d'automatisation déclenchent des actions quand un
							événement survient sur tes cartes — gain de temps garanti.
						</p>
						<button
							type="button"
							className="rule-empty-cta"
							onClick={openModal}
						>
							<Icon name="plus" size={14} />
							Créer ma première règle
						</button>
					</div>
				) : (
					<div className="rule-layout">
						{/* Colonne gauche : liste de règles */}
						<div className="rule-list">
							{rules.map((rule) => (
								<RuleCard
									key={rule._id}
									rule={rule}
									onRemove={() => handleRemove(rule._id, rule.name)}
								/>
							))}
						</div>

						{/* Colonne droite : aide */}
						<aside className="rule-help" aria-label="Comment ça marche">
							<span className="rule-help-eyebrow">COMMENT ÇA MARCHE</span>
							<h2 className="rule-help-title">
								Un déclencheur, une ou plusieurs{" "}
								<em className="serif-italic">actions</em>.
							</h2>
							<div className="rule-steps">
								<div className="rule-step">
									<span className="rule-step-num">1</span>
									<div className="rule-step-body">
										<span className="rule-step-title">
											Choisis un déclencheur
										</span>
										<span className="rule-step-desc">
											Création, complétion, déplacement, échéance, mention…
										</span>
									</div>
								</div>
								<div className="rule-step">
									<span className="rule-step-num">2</span>
									<div className="rule-step-body">
										<span className="rule-step-title">Définis les actions</span>
										<span className="rule-step-desc">
											Notifier, archiver, déplacer, assigner, étiqueter,
											commenter ou définir une échéance.
										</span>
									</div>
								</div>
								<div className="rule-step">
									<span className="rule-step-num">3</span>
									<div className="rule-step-body">
										<span className="rule-step-title">Active la règle</span>
										<span className="rule-step-desc">
											Bascule l'interrupteur pour mettre la règle en service
											sans toucher au code.
										</span>
									</div>
								</div>
							</div>
							<a className="rule-help-link" href="/docs">
								Documentation complète <Icon name="arrow" size={11} />
							</a>
						</aside>
					</div>
				)}
			</div>

			{modalOpen && (
				<CreateRuleModal
					onCreate={handleCreate}
					onClose={() => setModalOpen(false)}
				/>
			)}
		</div>
	);
}

// ============ RULE CARD ============

interface ConvexRule {
	_id: Id<"automationRules">;
	name: string;
	trigger: string;
	actions: string[];
	enabled: boolean;
	runCount: number;
	_creationTime: number;
}

function RuleCard({
	rule,
	onRemove,
}: {
	rule: ConvexRule;
	onRemove: () => void;
}) {
	const update = useMutation(api.automations.update);
	const [menuOpen, setMenuOpen] = useState(false);

	async function handleToggle(e: React.MouseEvent) {
		e.stopPropagation();
		try {
			await update({ ruleId: rule._id, enabled: !rule.enabled });
		} catch {
			toast.error("Impossible de basculer la règle");
		}
	}

	return (
		<article className={`rule-card${rule.enabled ? "" : " is-off"}`}>
			<header className="rule-card-head">
				<div className="rule-card-name">
					<div className="rule-card-name-row">
						<span>{rule.name}</span>
						<span className={`rule-card-status${rule.enabled ? " is-on" : ""}`}>
							{rule.enabled ? "active" : "en pause"}
						</span>
					</div>
				</div>
				<button
					type="button"
					className={`rule-toggle${rule.enabled ? " is-on" : ""}`}
					onClick={handleToggle}
					aria-pressed={rule.enabled}
					aria-label={rule.enabled ? "Désactiver" : "Activer"}
				/>
				<div style={{ position: "relative" }}>
					<button
						type="button"
						className="rule-menu-btn"
						aria-label="Menu"
						onClick={() => setMenuOpen((v) => !v)}
					>
						<Icon name="more" size={14} />
					</button>
					{menuOpen && (
						<>
							{/* Backdrop pour fermer au clic ailleurs */}
							<button
								type="button"
								aria-label="Fermer le menu"
								onClick={() => setMenuOpen(false)}
								style={{
									position: "fixed",
									inset: 0,
									background: "transparent",
									border: "none",
									zIndex: 9,
									cursor: "default",
								}}
							/>
							<div
								style={{
									position: "absolute",
									top: "100%",
									right: 0,
									marginTop: 4,
									background: "var(--surface)",
									border: "1px solid var(--border-c)",
									borderRadius: "var(--r-md)",
									boxShadow: "var(--shadow-md)",
									padding: 4,
									zIndex: 10,
									minWidth: 160,
								}}
							>
								<button
									type="button"
									onClick={() => {
										setMenuOpen(false);
										onRemove();
									}}
									style={{
										width: "100%",
										background: "transparent",
										border: "none",
										padding: "6px 10px",
										borderRadius: "var(--r-sm)",
										fontSize: 12.5,
										color: "var(--red)",
										textAlign: "left",
										cursor: "pointer",
										display: "flex",
										alignItems: "center",
										gap: 8,
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.background = "var(--surface-hover)";
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.background = "transparent";
									}}
								>
									<Icon name="trash" size={12} /> Supprimer
								</button>
							</div>
						</>
					)}
				</div>
			</header>

			<div className="rule-card-body">
				<span className="rule-chip rule-chip--label">QUAND</span>
				<span className="rule-chip rule-chip--trigger">
					<Icon name={triggerIcon(rule.trigger)} size={11} />
					{triggerLabel(rule.trigger)}
				</span>
				<span className="rule-arrow">→</span>
				{rule.actions.map((code, i, arr) => {
					const occurrence = arr.slice(0, i).filter((c) => c === code).length;
					const key = `${code}-${occurrence}`;
					return (
						<Fragment key={key}>
							<span className="rule-chip">
								<Icon name={actionIcon(code)} size={11} />
								{actionLabel(code)}
							</span>
							{i < arr.length - 1 && <span className="rule-arrow">+</span>}
						</Fragment>
					);
				})}
			</div>

			<footer className="rule-card-foot">
				<span className="rule-runs">
					Exécutée <b>{rule.runCount}</b> fois
				</span>
				<span className="rule-runs" style={{ color: "var(--text-subtle)" }}>
					#{rule._id.toString().slice(-6)}
				</span>
			</footer>
		</article>
	);
}

// ============ MODALE DE CRÉATION ============

function CreateRuleModal({
	onCreate,
	onClose,
}: {
	onCreate: (name: string, trigger: string, actions: string[]) => Promise<void>;
	onClose: () => void;
}) {
	const [name, setName] = useState("");
	const [trigger, setTrigger] = useState(TRIGGERS[0].code);
	const [selectedActions, setSelectedActions] = useState<string[]>([]);
	const [saving, setSaving] = useState(false);

	function toggleAction(code: string) {
		setSelectedActions((prev) =>
			prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
		);
	}

	async function handleSubmit() {
		if (!name.trim()) {
			toast.error("Le nom de la règle est requis");
			return;
		}
		if (selectedActions.length === 0) {
			toast.error("Sélectionne au moins une action");
			return;
		}
		setSaving(true);
		try {
			await onCreate(name.trim(), trigger, selectedActions);
		} finally {
			setSaving(false);
		}
	}

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: backdrop click is supplementary
		<div
			className="modal-backdrop"
			onClick={(e) => e.target === e.currentTarget && onClose()}
			onKeyDown={(e) => {
				if (e.key === "Escape") onClose();
			}}
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 200,
				background: "rgba(0,0,0,0.45)",
				backdropFilter: "blur(2px)",
				display: "grid",
				placeItems: "center",
			}}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-label="Nouvelle règle"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
				style={{
					background: "var(--surface)",
					border: "1px solid var(--border-c)",
					borderRadius: "var(--r-2xl, 16px)",
					padding: 28,
					width: 480,
					maxWidth: "calc(100vw - 32px)",
					boxShadow: "var(--shadow-lg)",
					display: "flex",
					flexDirection: "column",
					gap: 18,
				}}
			>
				<h3
					style={{
						fontSize: 17,
						fontWeight: 500,
						letterSpacing: "-0.01em",
						margin: 0,
					}}
				>
					Nouvelle règle d'automatisation
				</h3>

				<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
					<label
						htmlFor="rule-name"
						style={{
							fontSize: 11,
							fontWeight: 500,
							color: "var(--text-muted)",
							textTransform: "uppercase",
							letterSpacing: "0.06em",
						}}
					>
						Nom de la règle
					</label>
					<input
						id="rule-name"
						placeholder="Ex : Archiver les cartes terminées"
						value={name}
						onChange={(e) => setName(e.target.value)}
						// biome-ignore lint/a11y/noAutofocus: modale d'édition explicite, focus utile
						autoFocus
						style={{
							width: "100%",
							padding: "9px 12px",
							background: "var(--bg-soft)",
							border: "1px solid var(--border-c)",
							borderRadius: "var(--r-md)",
							fontSize: 14,
							color: "var(--text)",
							outline: "none",
							boxSizing: "border-box",
						}}
					/>
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
					<label
						htmlFor="rule-trigger"
						style={{
							fontSize: 11,
							fontWeight: 500,
							color: "var(--text-muted)",
							textTransform: "uppercase",
							letterSpacing: "0.06em",
						}}
					>
						Déclencheur
					</label>
					<select
						id="rule-trigger"
						value={trigger}
						onChange={(e) => setTrigger(e.target.value)}
						style={{
							width: "100%",
							padding: "9px 12px",
							background: "var(--bg-soft)",
							border: "1px solid var(--border-c)",
							borderRadius: "var(--r-md)",
							fontSize: 14,
							color: "var(--text)",
							outline: "none",
							boxSizing: "border-box",
						}}
					>
						{TRIGGERS.map((t) => (
							<option key={t.code} value={t.code}>
								{t.label}
							</option>
						))}
					</select>
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
					<span
						style={{
							fontSize: 11,
							fontWeight: 500,
							color: "var(--text-muted)",
							textTransform: "uppercase",
							letterSpacing: "0.06em",
						}}
					>
						Actions (sélection multiple)
					</span>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: 6,
						}}
					>
						{ACTIONS.map((a) => {
							const selected = selectedActions.includes(a.code);
							return (
								<button
									type="button"
									key={a.code}
									onClick={() => toggleAction(a.code)}
									style={{
										display: "flex",
										alignItems: "center",
										gap: 8,
										padding: "8px 10px",
										borderRadius: "var(--r-sm)",
										border: `1px solid ${selected ? "var(--accent)" : "var(--border-c)"}`,
										background: selected ? "var(--accent-soft)" : "transparent",
										color: selected ? "var(--accent-text)" : "var(--text)",
										fontSize: 13,
										cursor: "pointer",
										textAlign: "left",
									}}
								>
									<Icon name={a.icon} size={12} />
									{a.label}
								</button>
							);
						})}
					</div>
				</div>

				<div
					style={{
						display: "flex",
						justifyContent: "flex-end",
						gap: 8,
					}}
				>
					<button
						type="button"
						className="btn btn--ghost"
						onClick={onClose}
						disabled={saving}
					>
						Annuler
					</button>
					<button
						type="button"
						className="mw-cta"
						onClick={handleSubmit}
						disabled={saving}
					>
						{saving ? "Enregistrement…" : "Créer la règle"}
					</button>
				</div>
			</div>
		</div>
	);
}
