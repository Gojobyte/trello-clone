// ============ GOALS · Lume Éclat (Phase 3d) ============
// Page OKR : pagehead serif italic + stats band + cartes objectifs.

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "#/features/app/AppShell";
import { Icon } from "#/features/app/Icon";
import { authClient } from "#/lib/auth-client";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

// ============ TYPES CONVEX ============

type ConvexKR = {
	_id: Id<"keyResults">;
	goalId: Id<"goals">;
	title: string;
	progress: number;
};

type ConvexGoal = {
	_id: Id<"goals">;
	title: string;
	quarter: string;
	color: string;
	status: "on_track" | "at_risk" | "off_track";
	_creationTime: number;
	keyResults: ConvexKR[];
};

// ============ PALETTE ============

const COLOR_OPTIONS = [
	{ id: "amber", value: "#D88B1A", label: "Ambre" },
	{ id: "plum", value: "#7C4DFF", label: "Prune" },
	{ id: "teal", value: "#2E9A8A", label: "Sarcelle" },
	{ id: "rose", value: "#C84F6A", label: "Rose" },
	{ id: "blue", value: "#4A6FD8", label: "Bleu" },
	{ id: "ember", value: "#E0573A", label: "Braise" },
	{ id: "emerald", value: "#10B981", label: "Émeraude" },
	{ id: "slate", value: "#64748B", label: "Ardoise" },
];

const STATUS_LABEL: Record<ConvexGoal["status"], string> = {
	on_track: "En ligne",
	at_risk: "À risque",
	off_track: "En dérive",
};

const QUARTERS = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"] as const;

// ============ ROUTE ============

export const Route = createFileRoute("/goals")({
	component: GoalsRoute,
});

function GoalsRoute() {
	return (
		<AppShell
			active={{ route: "goals" }}
			title="Objectifs"
			crumbs={["Atelier Marchand"]}
		>
			<GoalsContent />
		</AppShell>
	);
}

// ============ CONTENU ============

function GoalsContent() {
	const { data: session } = authClient.useSession();
	const goals = useQuery(api.goals.list, session?.user ? {} : "skip");
	const createGoal = useMutation(api.goals.create);

	const [quarter, setQuarter] = useState<string>("Q2 2026");
	const [openId, setOpenId] = useState<string | null>(null);
	const [showCreate, setShowCreate] = useState(false);

	if (goals === undefined) {
		return (
			<div className="tools-page">
				<div className="tools-loading">Chargement…</div>
			</div>
		);
	}

	const filtered = (goals as ConvexGoal[]).filter((g) => g.quarter === quarter);
	const goalPct = (g: ConvexGoal) =>
		g.keyResults.length === 0
			? 0
			: Math.round(
					g.keyResults.reduce((sum, kr) => sum + kr.progress, 0) /
						g.keyResults.length,
				);
	const onTrack = filtered.filter((g) => g.status === "on_track").length;
	const atRisk = filtered.filter((g) => g.status === "at_risk").length;
	const offTrack = filtered.filter((g) => g.status === "off_track").length;
	const krCount = filtered.reduce((a, g) => a + g.keyResults.length, 0);

	return (
		<div className="tools-page" style={{ ["--tools-stats-cols" as string]: 4 }}>
			{/* ── Header ── */}
			<header className="mw-pagehead">
				<div className="mw-greet">
					<div>
						<h1 className="mw-greet-h1">
							Objectifs <em className="serif-italic">trimestre</em>.
						</h1>
						<p className="tools-head-meta" style={{ marginTop: 8 }}>
							<span>{quarter}</span>
							<span className="dot" aria-hidden="true" />
							<span>
								{filtered.length} objectif{filtered.length !== 1 ? "s" : ""}
							</span>
							<span className="dot" aria-hidden="true" />
							<span>
								{krCount} résultat{krCount !== 1 ? "s" : ""} clé
								{krCount !== 1 ? "s" : ""}
							</span>
						</p>
					</div>
					<div
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: 10,
							flexWrap: "wrap",
						}}
					>
						<div className="goals-quarter" role="tablist">
							{QUARTERS.map((q) => (
								<button
									key={q}
									type="button"
									role="tab"
									aria-selected={quarter === q}
									className={`goals-quarter-btn${quarter === q ? " is-active" : ""}`}
									onClick={() => setQuarter(q)}
								>
									{q}
								</button>
							))}
						</div>
						<button
							type="button"
							className="mw-cta"
							onClick={() => setShowCreate(true)}
						>
							<Icon name="plus" size={14} />
							<span>Nouvel objectif</span>
						</button>
					</div>
				</div>
			</header>

			{/* ── Stats band ── */}
			<section className="tools-stats" aria-label="Indicateurs des objectifs">
				<article className="tools-stat">
					<span className="tools-stat-eyebrow">Total · {quarter}</span>
					<span className="tools-stat-value">
						{filtered.length}
						<span className="unit">objectifs</span>
					</span>
					<span className="tools-stat-meta">
						<b>{krCount}</b> résultats clés au total
					</span>
				</article>
				<article className="tools-stat" data-tone="green">
					<span className="tools-stat-eyebrow">En ligne</span>
					<span className="tools-stat-value">
						{onTrack}
						<span className="unit">on track</span>
					</span>
					<span className="tools-stat-meta">
						{filtered.length > 0
							? `${Math.round((onTrack / filtered.length) * 100)}% du trimestre`
							: "—"}
					</span>
				</article>
				<article className="tools-stat" data-tone="amber">
					<span className="tools-stat-eyebrow">À risque</span>
					<span className="tools-stat-value">
						{atRisk}
						<span className="unit">à surveiller</span>
					</span>
					<span className="tools-stat-meta">
						{atRisk === 0 ? "Rien à signaler" : "Vérifie les KR en souffrance"}
					</span>
				</article>
				<article className="tools-stat" data-tone="red">
					<span className="tools-stat-eyebrow">En dérive</span>
					<span className="tools-stat-value">
						{offTrack}
						<span className="unit">off track</span>
					</span>
					<span className="tools-stat-meta">
						{offTrack === 0
							? "Tout est sous contrôle"
							: "Replanifie ou abandonne"}
					</span>
				</article>
			</section>

			{/* ── Liste des objectifs ── */}
			<section className="tools-body" aria-label="Liste des objectifs">
				{filtered.length === 0 ? (
					<div className="tools-empty">
						<h2 className="tools-empty-h">
							Pas encore d'<em>objectifs</em>.
						</h2>
						<p className="tools-empty-sub">
							Définis tes ambitions pour {quarter} et casse-les en résultats
							clés mesurables.
						</p>
						<button
							type="button"
							className="mw-cta"
							onClick={() => setShowCreate(true)}
						>
							<Icon name="plus" size={14} />
							<span>Créer un objectif</span>
						</button>
					</div>
				) : (
					filtered.map((g) => (
						<GoalCard
							key={g._id}
							g={g}
							pct={goalPct(g)}
							open={openId === g._id}
							onToggle={() => setOpenId(openId === g._id ? null : g._id)}
						/>
					))
				)}
			</section>

			{showCreate && (
				<CreateGoalModal
					defaultQuarter={quarter}
					onClose={() => setShowCreate(false)}
					onCreate={async (data) => {
						await createGoal(data);
						toast.success("Objectif créé.");
						setShowCreate(false);
					}}
				/>
			)}
		</div>
	);
}

// ============ GOAL CARD ============

function GoalCard({
	g,
	pct,
	open,
	onToggle,
}: {
	g: ConvexGoal;
	pct: number;
	open: boolean;
	onToggle: () => void;
}) {
	const updateGoal = useMutation(api.goals.update);
	const removeGoal = useMutation(api.goals.remove);
	const addKeyResult = useMutation(api.goals.addKeyResult);
	const updateKeyResult = useMutation(api.goals.updateKeyResult);
	const removeKeyResult = useMutation(api.goals.removeKeyResult);

	const [newKr, setNewKr] = useState("");
	const [addingKr, setAddingKr] = useState(false);

	const progressTone =
		pct >= 80 ? "green" : g.status === "off_track" ? "red" : undefined;

	function cycleStatus(e: React.MouseEvent) {
		e.stopPropagation();
		const next: Record<ConvexGoal["status"], ConvexGoal["status"]> = {
			on_track: "at_risk",
			at_risk: "off_track",
			off_track: "on_track",
		};
		void updateGoal({ goalId: g._id, status: next[g.status] });
	}

	function handleDelete(e: React.MouseEvent) {
		e.stopPropagation();
		if (
			!confirm(
				`Supprimer l'objectif « ${g.title} » ? Cette action est irréversible.`,
			)
		)
			return;
		void removeGoal({ goalId: g._id }).then(() =>
			toast.success("Objectif supprimé."),
		);
	}

	function handleAddKr() {
		if (!newKr.trim()) return;
		void addKeyResult({ goalId: g._id, title: newKr.trim() }).then(() => {
			setNewKr("");
			setAddingKr(false);
			toast.success("Résultat clé ajouté.");
		});
	}

	return (
		<article className={`goal-card${open ? " is-open" : ""}`}>
			<div className="goal-head">
				<button
					type="button"
					className="goal-head-toggle"
					onClick={onToggle}
					aria-expanded={open}
					aria-label={`Ouvrir ${g.title}`}
				>
					<span
						className="goal-square"
						style={{ background: g.color }}
						aria-hidden="true"
					/>
					<span className="goal-title-wrap">
						<span className="goal-title">{g.title}</span>
						<span className="goal-meta">
							<span>{g.quarter}</span>
							<span className="sep" aria-hidden="true" />
							<span>
								{g.keyResults.length} KR{g.keyResults.length !== 1 ? "s" : ""}
							</span>
						</span>
					</span>
				</button>
				<button
					type="button"
					className="goal-status"
					data-state={g.status}
					onClick={cycleStatus}
					title="Changer le statut"
				>
					<span className="goal-status-dot" aria-hidden="true" />
					<span>{STATUS_LABEL[g.status]}</span>
				</button>
				<span className="goal-pct">{pct}%</span>
				<button
					type="button"
					className="goal-chev"
					aria-label={open ? "Replier" : "Déplier"}
					onClick={onToggle}
				>
					<Icon name="chevdown" size={14} stroke={1.6} />
				</button>
			</div>

			<div className="goal-progress" aria-hidden="true">
				<div
					className="goal-progress-fill"
					data-tone={progressTone}
					style={{ width: `${pct}%` }}
				/>
			</div>

			{open && (
				<div className="goal-body">
					{g.keyResults.length === 0 ? (
						<p
							style={{
								margin: "8px 0 0",
								fontSize: 12.5,
								color: "var(--text-subtle)",
								fontStyle: "italic",
							}}
						>
							Aucun résultat clé pour le moment.
						</p>
					) : (
						g.keyResults.map((kr) => (
							<KRRow
								key={kr._id}
								kr={kr}
								onUpdate={(progress) =>
									void updateKeyResult({ keyResultId: kr._id, progress })
								}
								onRemove={() => {
									void removeKeyResult({ keyResultId: kr._id }).then(() =>
										toast.success("Résultat clé supprimé."),
									);
								}}
							/>
						))
					)}

					{addingKr ? (
						<form
							className="kr-add-form"
							onSubmit={(e) => {
								e.preventDefault();
								handleAddKr();
							}}
						>
							<input
								className="kr-add-input"
								placeholder="Titre du résultat clé…"
								value={newKr}
								onChange={(e) => setNewKr(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Escape") {
										setAddingKr(false);
										setNewKr("");
									}
								}}
								/* biome-ignore lint/a11y/noAutofocus: form-toggled input expects focus */
								autoFocus
							/>
							<button type="submit" className="sprint-mini" data-tone="primary">
								Ajouter
							</button>
							<button
								type="button"
								className="sprint-mini"
								onClick={() => {
									setAddingKr(false);
									setNewKr("");
								}}
							>
								Annuler
							</button>
						</form>
					) : (
						<button
							type="button"
							className="kr-add"
							onClick={() => setAddingKr(true)}
						>
							<Icon name="plus" size={12} />
							<span>Ajouter un résultat clé</span>
						</button>
					)}

					<div
						style={{
							display: "flex",
							justifyContent: "flex-end",
							marginTop: 12,
						}}
					>
						<button
							type="button"
							className="sprint-mini"
							data-tone="danger"
							onClick={handleDelete}
						>
							<Icon name="trash" size={12} />
							<span>Supprimer l'objectif</span>
						</button>
					</div>
				</div>
			)}
		</article>
	);
}

// ============ KR ROW ============

function KRRow({
	kr,
	onUpdate,
	onRemove,
}: {
	kr: ConvexKR;
	onUpdate: (progress: number) => void;
	onRemove: () => void;
}) {
	const [local, setLocal] = useState(kr.progress);

	return (
		<div className="kr-row">
			<span className="kr-title">{kr.title}</span>
			<div>
				<div className="kr-bar" aria-hidden="true">
					<div className="kr-bar-fill" style={{ width: `${local}%` }} />
				</div>
				<input
					type="range"
					min={0}
					max={100}
					step={5}
					value={local}
					className="kr-bar-range"
					onChange={(e) => setLocal(Number(e.target.value))}
					onMouseUp={() => onUpdate(local)}
					onTouchEnd={() => onUpdate(local)}
					aria-label={`Progression : ${local}%`}
				/>
			</div>
			<span className="kr-pct">{local}%</span>
			<button
				type="button"
				className="kr-del"
				onClick={onRemove}
				aria-label="Supprimer ce résultat clé"
			>
				<Icon name="trash" size={13} />
			</button>
		</div>
	);
}

// ============ MODALE DE CRÉATION ============

type CreateGoalData = {
	title: string;
	quarter: string;
	color: string;
	keyResults?: string[];
};

function CreateGoalModal({
	defaultQuarter,
	onClose,
	onCreate,
}: {
	defaultQuarter: string;
	onClose: () => void;
	onCreate: (data: CreateGoalData) => Promise<void>;
}) {
	const [title, setTitle] = useState("");
	const [quarter, setQuarter] = useState(defaultQuarter);
	const [color, setColor] = useState(COLOR_OPTIONS[0].value);
	const [krs, setKrs] = useState([
		{ id: "kr-1", value: "" },
		{ id: "kr-2", value: "" },
		{ id: "kr-3", value: "" },
	]);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!title.trim()) {
			toast.error("Le titre est obligatoire.");
			return;
		}
		setLoading(true);
		try {
			const keyResults = krs.map((k) => k.value.trim()).filter(Boolean);
			await onCreate({
				title: title.trim(),
				quarter: quarter.trim(),
				color,
				keyResults: keyResults.length > 0 ? keyResults : undefined,
			});
		} finally {
			setLoading(false);
		}
	}

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: backdrop click is supplementary
		<div
			className="tools-modal-backdrop"
			onClick={onClose}
			onKeyDown={(e) => {
				if (e.key === "Escape") onClose();
			}}
		>
			<form
				className="tools-modal"
				aria-label="Nouvel objectif"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
				onSubmit={handleSubmit}
			>
				<h2 className="tools-modal-h">Nouvel objectif</h2>

				<div className="tools-modal-field">
					<label className="tools-modal-label" htmlFor="goal-title">
						Titre
					</label>
					<input
						id="goal-title"
						placeholder="Ex. : Lancer Flowboard v3"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						/* biome-ignore lint/a11y/noAutofocus: modal opens with focus expected */
						autoFocus
					/>
				</div>

				<div className="tools-modal-field">
					<label className="tools-modal-label" htmlFor="goal-quarter">
						Trimestre
					</label>
					<input
						id="goal-quarter"
						placeholder="Q2 2026"
						value={quarter}
						onChange={(e) => setQuarter(e.target.value)}
					/>
				</div>

				<div className="tools-modal-field">
					<span className="tools-modal-label">Couleur</span>
					<div className="tools-modal-swatches">
						{COLOR_OPTIONS.map((c) => (
							<button
								type="button"
								key={c.id}
								className={`tools-modal-swatch${color === c.value ? " is-selected" : ""}`}
								style={{ background: c.value }}
								onClick={() => setColor(c.value)}
								aria-label={c.label}
							/>
						))}
					</div>
				</div>

				<div className="tools-modal-field">
					<span className="tools-modal-label">Résultats clés (optionnels)</span>
					{krs.map((k, i) => (
						<input
							key={k.id}
							placeholder={`Résultat clé ${i + 1}…`}
							value={k.value}
							onChange={(e) => {
								const next = [...krs];
								next[i] = { ...next[i], value: e.target.value };
								setKrs(next);
							}}
							style={{ marginTop: i === 0 ? 0 : 6 }}
						/>
					))}
				</div>

				<div className="tools-modal-actions">
					<button
						type="button"
						className="tools-modal-btn tools-modal-btn--ghost"
						onClick={onClose}
						disabled={loading}
					>
						Annuler
					</button>
					<button
						type="submit"
						className="tools-modal-btn tools-modal-btn--primary"
						disabled={loading || !title.trim()}
					>
						{loading ? "Création…" : "Créer"}
					</button>
				</div>
			</form>
		</div>
	);
}
