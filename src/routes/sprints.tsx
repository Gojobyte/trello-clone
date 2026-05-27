// ============ SPRINTS · Lume Éclat (Phase 3d) ============
// Page sprints : pagehead + stats band + sprint actif (burndown) + listes.

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "#/features/app/AppShell";
import { Icon } from "#/features/app/Icon";
import { authClient } from "#/lib/auth-client";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

// ============ TYPES ============

type SprintStatus = "active" | "planned" | "completed";

type ConvexSprint = {
	_id: Id<"sprints">;
	_creationTime: number;
	name: string;
	goal: string;
	startDate: number;
	endDate: number;
	status: SprintStatus;
	committed: number;
	completed: number;
};

interface BurndownPoint {
	day: number;
	ideal: number;
	actual: number | null;
}

// ============ ROUTE ============

export const Route = createFileRoute("/sprints")({
	component: SprintsRoute,
});

function SprintsRoute() {
	return (
		<AppShell
			active={{ route: "sprints" }}
			title="Sprints"
			crumbs={["Atelier Marchand"]}
		>
			<SprintsContent />
		</AppShell>
	);
}

// ============ HELPERS ============

function fmtDateRange(start: number, end: number): string {
	const s = new Date(start).toLocaleDateString("fr-FR", {
		day: "numeric",
		month: "short",
	});
	const e = new Date(end).toLocaleDateString("fr-FR", {
		day: "numeric",
		month: "short",
	});
	return `${s} → ${e}`;
}

const STATUS_LABEL: Record<SprintStatus, string> = {
	active: "En cours",
	planned: "Planifié",
	completed: "Terminé",
};

// ============ BURNDOWN ============

function Burndown({ data, max }: { data: BurndownPoint[]; max: number }) {
	const W = 700;
	const H = 160;
	const pad = 30;
	const x = (i: number) =>
		pad + (i / Math.max(1, data.length - 1)) * (W - pad * 2);
	const y = (v: number) => H - pad - (v / Math.max(1, max)) * (H - pad * 2);
	const ideal = data
		.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.ideal)}`)
		.join(" ");
	const actualPts = data.filter((d) => d.actual !== null) as (BurndownPoint & {
		actual: number;
	})[];
	const actual = actualPts
		.map((d, i) => `${i === 0 ? "M" : "L"} ${x(d.day)} ${y(d.actual)}`)
		.join(" ");
	const lastActual = actualPts[actualPts.length - 1];

	return (
		<svg
			viewBox={`0 0 ${W} ${H}`}
			style={{ width: "100%", height: 160 }}
			aria-label="Burndown chart"
		>
			<title>Burndown — Idéal vs réalisé</title>
			{[0, 0.25, 0.5, 0.75, 1].map((p) => (
				<line
					key={p}
					x1={pad}
					y1={pad + (H - pad * 2) * p}
					x2={W - pad}
					y2={pad + (H - pad * 2) * p}
					stroke="var(--border-c)"
					strokeWidth="0.5"
				/>
			))}
			{data.map((d, i) =>
				i % 2 === 0 ? (
					<text
						key={`tick-${d.day}`}
						x={x(i)}
						y={H - 10}
						fontSize="9"
						fill="var(--text-subtle)"
						textAnchor="middle"
						fontFamily="var(--font-mono)"
					>
						J{d.day}
					</text>
				) : null,
			)}
			<path
				d={ideal}
				stroke="var(--border-strong)"
				strokeWidth="1.5"
				fill="none"
				strokeDasharray="4,4"
			/>
			{actual && (
				<path d={actual} stroke="var(--accent)" strokeWidth="2" fill="none" />
			)}
			{lastActual && (
				<path
					d={`${actual} L ${x(lastActual.day)} ${H - pad} L ${x(0)} ${H - pad} Z`}
					fill="var(--accent)"
					opacity="0.08"
				/>
			)}
			{actualPts.map((d) => (
				<circle
					key={`pt-${d.day}`}
					cx={x(d.day)}
					cy={y(d.actual)}
					r="3"
					fill="var(--accent)"
				/>
			))}
		</svg>
	);
}

// ============ CONTENU ============

function SprintsContent() {
	const { data: session } = authClient.useSession();
	const sprints = useQuery(api.sprints.list, session?.user ? {} : "skip") as
		| ConvexSprint[]
		| undefined;

	const createSprint = useMutation(api.sprints.create);
	const updateSprint = useMutation(api.sprints.update);
	const removeSprint = useMutation(api.sprints.remove);

	const [showModal, setShowModal] = useState(false);

	if (sprints === undefined) {
		return (
			<div className="tools-page">
				<div className="tools-loading">Chargement…</div>
			</div>
		);
	}

	const active = sprints.find((s) => s.status === "active") ?? null;
	const planned = sprints.filter((s) => s.status === "planned");
	const completed = sprints.filter((s) => s.status === "completed");

	// ── Burndown data dérivé du sprint actif ──
	const sprintDays = active
		? Math.max(1, Math.round((active.endDate - active.startDate) / 86_400_000))
		: 10;
	const daysPassed = active
		? Math.min(
				sprintDays,
				Math.max(0, Math.round((Date.now() - active.startDate) / 86_400_000)),
			)
		: 0;
	const totalCommitted = active?.committed ?? 0;
	const totalCompleted = active?.completed ?? 0;
	const pct =
		totalCommitted > 0
			? Math.round((totalCompleted / totalCommitted) * 100)
			: 0;

	const burndown: BurndownPoint[] = Array.from(
		{ length: sprintDays + 1 },
		(_, i) => ({
			day: i,
			ideal: totalCommitted - (totalCommitted / sprintDays) * i,
			actual:
				i === daysPassed
					? totalCommitted - totalCompleted
					: i === 0
						? totalCommitted
						: null,
		}),
	);

	async function handleCreate(args: {
		name: string;
		goal: string;
		startDate: number;
		endDate: number;
		committed: number;
		status: SprintStatus;
	}) {
		await createSprint(args);
		toast.success(`Sprint « ${args.name} » créé.`);
		setShowModal(false);
	}

	async function handleDelete(s: ConvexSprint) {
		if (!confirm(`Supprimer le sprint « ${s.name} » ?`)) return;
		await removeSprint({ sprintId: s._id });
		toast.success("Sprint supprimé.");
	}

	async function startPlanned(s: ConvexSprint) {
		await updateSprint({ sprintId: s._id, status: "active" });
		toast.success("Sprint démarré !");
	}

	return (
		<div className="tools-page" style={{ ["--tools-stats-cols" as string]: 3 }}>
			{/* ── Header ── */}
			<header className="mw-pagehead">
				<div className="mw-greet">
					<div>
						<h1 className="mw-greet-h1">
							Sprints <em className="serif-italic">en cours</em>.
						</h1>
						<p className="tools-head-meta" style={{ marginTop: 8 }}>
							<span>
								{sprints.length} sprint{sprints.length !== 1 ? "s" : ""}
							</span>
							<span className="dot" aria-hidden="true" />
							<span>Cycles 2 semaines</span>
						</p>
					</div>
					<button
						type="button"
						className="mw-cta"
						onClick={() => setShowModal(true)}
					>
						<Icon name="plus" size={14} />
						<span>Nouveau sprint</span>
					</button>
				</div>
			</header>

			{/* ── Stats band ── */}
			<section className="tools-stats" aria-label="Indicateurs des sprints">
				<article className="tools-stat" data-tone="accent">
					<span className="tools-stat-eyebrow">Sprint actif</span>
					<span className="tools-stat-value" style={{ fontSize: 22 }}>
						{active ? active.name : "Aucun"}
					</span>
					<span className="tools-stat-meta">
						{active
							? `${totalCompleted}/${totalCommitted} pts livrés`
							: "Démarre un sprint planifié"}
					</span>
				</article>
				<article className="tools-stat">
					<span className="tools-stat-eyebrow">Avancement</span>
					<span className="tools-stat-value">
						{pct}
						<span className="unit">% livré</span>
					</span>
					<span className="tools-stat-meta">
						{active ? `Jour ${daysPassed} / ${sprintDays}` : "—"}
					</span>
				</article>
				<article className="tools-stat" data-tone="amber">
					<span className="tools-stat-eyebrow">Jours restants</span>
					<span className="tools-stat-value">
						{active ? Math.max(0, sprintDays - daysPassed) : 0}
						<span className="unit">jours</span>
					</span>
					<span className="tools-stat-meta">
						{planned.length > 0
							? `${planned.length} sprint${planned.length > 1 ? "s" : ""} planifié${planned.length > 1 ? "s" : ""}`
							: "Aucun en file d'attente"}
					</span>
				</article>
			</section>

			{/* ── Sprint actif (carte + burndown) ── */}
			{active ? (
				<section className="tools-body" aria-label="Sprint actif">
					<div className="sprint-active">
						<div>
							<div className="sprint-active-head">
								<span className="sprint-active-eyebrow">
									<span className="ping" aria-hidden="true" />
									<span>
										{active.name} · Jour {daysPassed}/{sprintDays}
									</span>
								</span>
								<h2 className="sprint-active-title">
									{active.goal || active.name}
								</h2>
								<p className="sprint-active-sub">
									{fmtDateRange(active.startDate, active.endDate)}
								</p>
							</div>
							<div className="sprint-active-controls">
								<label
									style={{
										fontSize: 11.5,
										color: "var(--text-subtle)",
										fontFamily: "var(--font-mono)",
										letterSpacing: "0.06em",
										textTransform: "uppercase",
									}}
								>
									Engagés
									<input
										type="number"
										min={0}
										value={totalCommitted}
										onChange={(e) =>
											void updateSprint({
												sprintId: active._id,
												committed: Math.max(0, Number(e.target.value)),
											})
										}
										style={{
											marginLeft: 8,
											width: 60,
											padding: "3px 6px",
											fontFamily: "var(--font-mono)",
											fontSize: 12,
											background: "var(--bg-soft)",
											border: "1px solid var(--border-c)",
											borderRadius: "var(--r-sm)",
											color: "var(--text)",
										}}
									/>
								</label>
								<label
									style={{
										fontSize: 11.5,
										color: "var(--text-subtle)",
										fontFamily: "var(--font-mono)",
										letterSpacing: "0.06em",
										textTransform: "uppercase",
									}}
								>
									Livrés
									<input
										type="number"
										min={0}
										max={totalCommitted}
										value={totalCompleted}
										onChange={(e) =>
											void updateSprint({
												sprintId: active._id,
												completed: Math.max(0, Number(e.target.value)),
											})
										}
										style={{
											marginLeft: 8,
											width: 60,
											padding: "3px 6px",
											fontFamily: "var(--font-mono)",
											fontSize: 12,
											background: "var(--bg-soft)",
											border: "1px solid var(--border-c)",
											borderRadius: "var(--r-sm)",
											color: "var(--text)",
										}}
									/>
								</label>
								<button
									type="button"
									className="sprint-mini"
									onClick={() =>
										void updateSprint({
											sprintId: active._id,
											status: "completed",
										}).then(() => toast.success("Sprint clôturé."))
									}
								>
									<Icon name="check" size={12} />
									<span>Clôturer</span>
								</button>
								<button
									type="button"
									className="sprint-mini"
									data-tone="danger"
									onClick={() => void handleDelete(active)}
								>
									<Icon name="trash" size={12} />
									<span>Supprimer</span>
								</button>
							</div>
						</div>

						<div className="sprint-active-stats">
							<div className="sprint-active-stat">
								<span className="sprint-active-stat-eyebrow">Engagés</span>
								<span className="sprint-active-stat-value">
									{totalCommitted}
								</span>
								<span className="sprint-active-stat-meta">points</span>
							</div>
							<div className="sprint-active-stat">
								<span className="sprint-active-stat-eyebrow">Livrés</span>
								<span
									className="sprint-active-stat-value"
									style={{ color: "var(--green)" }}
								>
									{totalCompleted}
								</span>
								<span className="sprint-active-stat-meta">{pct}% terminé</span>
							</div>
							<div className="sprint-active-stat">
								<span className="sprint-active-stat-eyebrow">Restants</span>
								<span
									className="sprint-active-stat-value"
									style={{ color: "var(--accent-hover)" }}
								>
									{Math.max(0, totalCommitted - totalCompleted)}
								</span>
								<span className="sprint-active-stat-meta">
									{Math.max(0, sprintDays - daysPassed)} jours
								</span>
							</div>
						</div>
					</div>

					{/* Burndown */}
					<div className="sprint-burndown">
						<div className="sprint-burndown-head">
							<div>
								<h3 className="sprint-burndown-h">Burndown</h3>
								<p
									style={{
										margin: "4px 0 0",
										fontSize: 11,
										color: "var(--text-subtle)",
										fontFamily: "var(--font-mono)",
										letterSpacing: "0.04em",
									}}
								>
									Points restants · idéal vs réalisé
								</p>
							</div>
							<div className="sprint-burndown-legend">
								<span>
									<i aria-hidden="true" />
									<span>Idéal</span>
								</span>
								<span>
									<i data-tone="actual" aria-hidden="true" />
									<span>Réalisé</span>
								</span>
							</div>
						</div>
						<Burndown data={burndown} max={Math.max(totalCommitted, 1)} />
					</div>
				</section>
			) : sprints.length > 0 ? (
				<div className="tools-empty">
					<h2 className="tools-empty-h">
						Aucun sprint <em>actif</em>.
					</h2>
					<p className="tools-empty-sub">
						Démarre un sprint planifié ci-dessous pour activer ton burndown.
					</p>
				</div>
			) : null}

			{/* ── Sprints planifiés ── */}
			{planned.length > 0 && (
				<section className="tools-body" aria-label="Sprints planifiés">
					<div
						className="mw-group-head"
						style={{ marginBottom: 6, paddingBottom: 6 }}
					>
						<span className="mw-group-label">PLANIFIÉS</span>
						<span className="mw-group-count">
							{planned.length} en file d'attente
						</span>
						<span className="mw-group-rule" aria-hidden="true" />
					</div>
					{planned.map((s, i) => (
						<div key={s._id} className="sprint-row">
							<span className="sprint-row-num">
								{String(i + 1).padStart(2, "0")}
							</span>
							<div className="sprint-row-body">
								<span className="sprint-row-title">{s.goal || s.name}</span>
								<span className="sprint-row-meta">
									{s.name} · {fmtDateRange(s.startDate, s.endDate)}
								</span>
							</div>
							<span className="sprint-row-pts">{s.committed} pts</span>
							<span className="sprint-badge" data-state="planned">
								{STATUS_LABEL.planned}
							</span>
							<div style={{ display: "inline-flex", gap: 6 }}>
								<button
									type="button"
									className="sprint-mini"
									data-tone="primary"
									onClick={() => void startPlanned(s)}
								>
									<Icon name="arrow" size={12} />
									<span>Démarrer</span>
								</button>
								<button
									type="button"
									className="sprint-mini"
									data-tone="danger"
									onClick={() => void handleDelete(s)}
								>
									<Icon name="trash" size={12} />
								</button>
							</div>
						</div>
					))}
				</section>
			)}

			{/* ── Sprints terminés ── */}
			{completed.length > 0 && (
				<section className="tools-body" aria-label="Sprints terminés">
					<div
						className="mw-group-head"
						style={{ marginBottom: 6, paddingBottom: 6 }}
					>
						<span className="mw-group-label">HISTORIQUE</span>
						<span className="mw-group-count">
							{completed.length} terminé{completed.length > 1 ? "s" : ""}
						</span>
						<span className="mw-group-rule" aria-hidden="true" />
					</div>
					<div className="sprint-history">
						{completed.map((s) => {
							const donePct =
								s.committed > 0
									? Math.round((s.completed / s.committed) * 100)
									: 0;
							const tone =
								donePct >= 90 ? "green" : donePct >= 75 ? "amber" : "red";
							return (
								<div key={s._id} className="sprint-history-row">
									<span className="sprint-history-name">{s.name}</span>
									<div className="sprint-history-body">
										<span className="sprint-history-title">
											{s.goal || s.name}
										</span>
										<span className="sprint-history-dates">
											{fmtDateRange(s.startDate, s.endDate)}
										</span>
									</div>
									<div className="sprint-history-progress">
										<div className="sprint-history-progress-head">
											<span>
												{s.completed}/{s.committed} pts
											</span>
											<span className="pct" data-tone={tone}>
												{donePct}%
											</span>
										</div>
										<div className="sprint-history-progress-bar">
											<i
												data-tone={tone}
												style={{ width: `${Math.min(100, donePct)}%` }}
											/>
										</div>
									</div>
									<button
										type="button"
										className="sprint-mini"
										data-tone="danger"
										onClick={() => void handleDelete(s)}
										aria-label="Supprimer ce sprint"
									>
										<Icon name="trash" size={12} />
									</button>
								</div>
							);
						})}
					</div>
				</section>
			)}

			{/* ── État vide global ── */}
			{sprints.length === 0 && (
				<div className="tools-empty">
					<h2 className="tools-empty-h">
						Pas encore de <em>sprints</em>.
					</h2>
					<p className="tools-empty-sub">
						Planifie ton premier cycle de 2 semaines pour démarrer le suivi de
						vélocité et le burndown.
					</p>
					<button
						type="button"
						className="mw-cta"
						onClick={() => setShowModal(true)}
					>
						<Icon name="plus" size={14} />
						<span>Planifier un sprint</span>
					</button>
				</div>
			)}

			{showModal && (
				<NewSprintModal
					onClose={() => setShowModal(false)}
					onCreate={handleCreate}
				/>
			)}
		</div>
	);
}

// ============ MODALE ============

function NewSprintModal({
	onClose,
	onCreate,
}: {
	onClose: () => void;
	onCreate: (args: {
		name: string;
		goal: string;
		startDate: number;
		endDate: number;
		committed: number;
		status: SprintStatus;
	}) => Promise<void>;
}) {
	const [name, setName] = useState("");
	const [goal, setGoal] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [committed, setCommitted] = useState(20);
	const [status, setStatus] = useState<SprintStatus>("planned");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim() || !startDate || !endDate) return;
		setLoading(true);
		try {
			await onCreate({
				name: name.trim(),
				goal: goal.trim(),
				startDate: new Date(startDate).getTime(),
				endDate: new Date(endDate).getTime(),
				committed,
				status,
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
				aria-label="Nouveau sprint"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
				onSubmit={handleSubmit}
			>
				<h2 className="tools-modal-h">Nouveau sprint</h2>

				<div className="tools-modal-field">
					<label className="tools-modal-label" htmlFor="sp-name">
						Nom du sprint *
					</label>
					<input
						id="sp-name"
						type="text"
						placeholder="Ex. : Sprint 24"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
						/* biome-ignore lint/a11y/noAutofocus: modal opens with focus expected */
						autoFocus
					/>
				</div>

				<div className="tools-modal-field">
					<label className="tools-modal-label" htmlFor="sp-goal">
						Objectif
					</label>
					<input
						id="sp-goal"
						type="text"
						placeholder="Ex. : Lancer les fonctionnalités premium"
						value={goal}
						onChange={(e) => setGoal(e.target.value)}
					/>
				</div>

				<div className="tools-modal-grid2">
					<div className="tools-modal-field">
						<label className="tools-modal-label" htmlFor="sp-start">
							Début *
						</label>
						<input
							id="sp-start"
							type="date"
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
							required
						/>
					</div>
					<div className="tools-modal-field">
						<label className="tools-modal-label" htmlFor="sp-end">
							Fin *
						</label>
						<input
							id="sp-end"
							type="date"
							value={endDate}
							onChange={(e) => setEndDate(e.target.value)}
							required
						/>
					</div>
				</div>

				<div className="tools-modal-grid2">
					<div className="tools-modal-field">
						<label className="tools-modal-label" htmlFor="sp-committed">
							Points engagés
						</label>
						<input
							id="sp-committed"
							type="number"
							min={0}
							value={committed}
							onChange={(e) => setCommitted(Number(e.target.value))}
						/>
					</div>
					<div className="tools-modal-field">
						<label className="tools-modal-label" htmlFor="sp-status">
							Statut
						</label>
						<select
							id="sp-status"
							value={status}
							onChange={(e) => setStatus(e.target.value as SprintStatus)}
						>
							<option value="planned">Planifié</option>
							<option value="active">En cours</option>
							<option value="completed">Terminé</option>
						</select>
					</div>
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
						disabled={loading || !name.trim() || !startDate || !endDate}
					>
						{loading ? "Création…" : "Créer le sprint"}
					</button>
				</div>
			</form>
		</div>
	);
}
