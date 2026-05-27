// ============ WORKLOAD · Lume Éclat (Phase 3d, group B) ============
// Vue de charge par membre : page header + 3 stats + liste collapsable.

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useState } from "react";
import { AppShell } from "#/features/app/AppShell";
import { Icon } from "#/features/app/Icon";
import { authClient } from "#/lib/auth-client";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/workload")({
	component: WorkloadRoute,
});

function WorkloadRoute() {
	return (
		<AppShell
			active={{ route: "workload" }}
			title="Charge équipe"
			crumbs={["Atelier Marchand"]}
		>
			<WorkloadContent />
		</AppShell>
	);
}

// ============ HELPERS ============

function nameToColor(name: string): string {
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
	}
	const hue = ((hash % 360) + 360) % 360;
	return `oklch(0.62 0.14 ${hue})`;
}

function initialOf(name: string): string {
	return name.trim().charAt(0).toUpperCase() || "?";
}

type MemberRow = {
	userId: string;
	name: string;
	open: number;
	overdue: number;
	dueThisWeek: number;
	completed: number;
};

// ============ CONTENT ============

function WorkloadContent() {
	const { data: session } = authClient.useSession();
	const data = useQuery(api.workload.summary, session?.user ? {} : "skip");
	const [expanded, setExpanded] = useState<string | null>(null);

	if (data === undefined) {
		return (
			<div className="tools-page">
				<header className="mw-pagehead">
					<div className="mw-pagehead-dotgrid" aria-hidden="true" />
					<div className="mw-greet">
						<div>
							<h1 className="mw-greet-h1">
								Charge <em className="serif-italic">équipe</em>.
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
				<div className="tools-body">
					<p className="text-muted text-sm">Chargement…</p>
				</div>
			</div>
		);
	}

	const { members, unassignedOpen, totalCards } = data;
	const sorted: MemberRow[] = [...members].sort((a, b) => b.open - a.open);
	const totalOverdue = sorted.reduce((s, m) => s + m.overdue, 0);

	// Worst-case width for proportional bar (each row normalized to its own total)
	const maxLoad = Math.max(
		1,
		...sorted.map((m) => m.open + m.overdue + m.dueThisWeek + m.completed),
		unassignedOpen,
	);

	const isEmpty =
		sorted.length === 0 && totalCards === 0 && unassignedOpen === 0;

	return (
		<div className="tools-page">
			<header className="mw-pagehead">
				<div className="mw-pagehead-dotgrid" aria-hidden="true" />
				<div className="mw-greet">
					<div>
						<h1 className="mw-greet-h1">
							Charge <em className="serif-italic">équipe</em>.
						</h1>
						<p className="mw-sub">
							<span className="mw-sub-live">
								<span className="ping" />
								données en direct
							</span>
							<span aria-hidden="true">·</span>
							<span>
								{sorted.length} membre{sorted.length !== 1 ? "s" : ""}
							</span>
						</p>
					</div>
					<div className="tools-page-actions">
						<button type="button" className="btn btn--outline">
							<Icon name="filter" size={13} /> Filtrer
						</button>
						<button type="button" className="btn btn--outline">
							<Icon name="arrowdown" size={13} /> Export CSV
						</button>
					</div>
				</div>
			</header>

			{/* Stats : 3 widgets sobres */}
			<section className="tools-stats" aria-label="Indicateurs">
				<article className="tools-stat">
					<span className="tools-stat-eyebrow">Cartes · total</span>
					<span className="tools-stat-val">{totalCards}</span>
					<span className="tools-stat-meta">tous tableaux confondus</span>
				</article>
				<article
					className="tools-stat"
					data-tone={unassignedOpen > 0 ? "red" : undefined}
				>
					<span className="tools-stat-eyebrow">Non assignées</span>
					<span className="tools-stat-val">{unassignedOpen}</span>
					<span className="tools-stat-meta">
						{unassignedOpen > 0 ? "à attribuer rapidement" : "rien en attente"}
					</span>
				</article>
				<article
					className="tools-stat"
					data-tone={totalOverdue > 0 ? "red" : "green"}
				>
					<span className="tools-stat-eyebrow">En retard</span>
					<span className="tools-stat-val">{totalOverdue}</span>
					<span className="tools-stat-meta">
						{totalOverdue > 0 ? "à prioriser" : "tout est dans les temps"}
					</span>
				</article>
			</section>

			<div className="tools-body">
				{isEmpty ? (
					<div className="workload-empty">
						<div className="workload-empty-title">
							<em className="serif-italic">Aucune charge</em> à afficher.
						</div>
						<p className="workload-empty-sub">
							Crée des tableaux et assigne des cartes à des membres pour voir
							leur charge ici.
						</p>
					</div>
				) : (
					<>
						<div className="workload-toolbar">
							<span className="workload-toolbar-eyebrow">PAR MEMBRE</span>
							<span className="workload-toolbar-spacer" />
							<span className="text-subtle text-xs font-mono">
								{sorted.length} membre{sorted.length !== 1 ? "s" : ""}
							</span>
						</div>

						<div className="workload-list">
							{/* Non-assigné en tête */}
							{unassignedOpen > 0 && (
								<UnassignedRow count={unassignedOpen} maxLoad={maxLoad} />
							)}

							{sorted.map((m) => (
								<WorkloadRow
									key={m.userId}
									member={m}
									maxLoad={maxLoad}
									isExpanded={expanded === m.userId}
									onToggle={() =>
										setExpanded((prev) => (prev === m.userId ? null : m.userId))
									}
								/>
							))}
						</div>
					</>
				)}
			</div>
		</div>
	);
}

// ============ ROWS ============

function WorkloadRow({
	member,
	maxLoad,
	isExpanded,
	onToggle,
}: {
	member: MemberRow;
	maxLoad: number;
	isExpanded: boolean;
	onToggle: () => void;
}) {
	const total =
		member.open + member.overdue + member.dueThisWeek + member.completed;
	const scale = total > 0 ? Math.max(0.15, total / maxLoad) : 0;

	// Each segment width in % of the bar; the bar itself only fills `scale` of track.
	function pct(n: number): number {
		if (total === 0) return 0;
		return Math.round((n / total) * 100);
	}
	const overduePct = pct(member.overdue);
	const openPct = pct(member.open);
	const weekPct = pct(member.dueThisWeek);
	const completedPct = pct(member.completed);

	return (
		<button
			type="button"
			className={`workload-row${isExpanded ? " is-expanded" : ""}`}
			onClick={onToggle}
			aria-expanded={isExpanded}
		>
			<div className="workload-name">
				<span
					className="workload-avatar"
					style={{ background: nameToColor(member.name) }}
					aria-hidden="true"
				>
					{initialOf(member.name)}
				</span>
				<span className="workload-name-text">{member.name}</span>
			</div>

			<div
				className="workload-bar"
				role="img"
				style={{ width: `${Math.round(scale * 100)}%` }}
				aria-label={`${total} cartes assignées`}
			>
				{member.overdue > 0 && (
					<span
						className="workload-segment"
						data-kind="overdue"
						style={{ width: `${overduePct}%` }}
					/>
				)}
				{member.open > 0 && (
					<span
						className="workload-segment"
						data-kind="open"
						style={{ width: `${openPct}%` }}
					/>
				)}
				{member.dueThisWeek > 0 && (
					<span
						className="workload-segment"
						data-kind="week"
						style={{ width: `${weekPct}%` }}
					/>
				)}
				{member.completed > 0 && (
					<span
						className="workload-segment"
						data-kind="completed"
						style={{ width: `${completedPct}%` }}
					/>
				)}
			</div>

			<div className="workload-stats">
				<span>
					<b>{member.open}</b> ouvertes
				</span>
				<span className="dot" aria-hidden="true" />
				<span data-tone={member.overdue > 0 ? "red" : undefined}>
					<b>{member.overdue}</b> en retard
				</span>
				<span className="dot" aria-hidden="true" />
				<span data-tone={member.dueThisWeek > 0 ? "amber" : undefined}>
					<b>{member.dueThisWeek}</b> cette sem.
				</span>
			</div>

			{isExpanded && (
				<div className="workload-details">
					<div className="workload-detail-row">
						<span className="workload-detail-label">Ouvertes</span>
						<span className="workload-detail-val">
							{member.open} carte{member.open !== 1 ? "s" : ""} actives
						</span>
						<span className="workload-detail-meta">à suivre</span>
					</div>
					<div className="workload-detail-row">
						<span className="workload-detail-label">En retard</span>
						<span
							className="workload-detail-val"
							style={{ color: member.overdue > 0 ? "var(--red)" : undefined }}
						>
							{member.overdue} carte{member.overdue !== 1 ? "s" : ""}
						</span>
						<span className="workload-detail-meta">
							{member.overdue > 0 ? "à prioriser" : "rien en retard"}
						</span>
					</div>
					<div className="workload-detail-row">
						<span className="workload-detail-label">Cette semaine</span>
						<span className="workload-detail-val">{member.dueThisWeek}</span>
						<span className="workload-detail-meta">échéances 7j</span>
					</div>
					<div className="workload-detail-row">
						<span className="workload-detail-label">Terminées</span>
						<span
							className="workload-detail-val"
							style={{
								color: member.completed > 0 ? "var(--green)" : undefined,
							}}
						>
							{member.completed}
						</span>
						<span className="workload-detail-meta">archivées plus tard</span>
					</div>
				</div>
			)}
		</button>
	);
}

function UnassignedRow({ count, maxLoad }: { count: number; maxLoad: number }) {
	const scale = Math.max(0.15, count / maxLoad);
	return (
		<div className="workload-row is-unassigned">
			<div className="workload-name">
				<span
					className="workload-avatar workload-avatar--ghost"
					aria-hidden="true"
				>
					?
				</span>
				<span className="workload-name-text workload-name-text--muted">
					Non assigné
				</span>
			</div>
			<div
				className="workload-bar"
				style={{ width: `${Math.round(scale * 100)}%` }}
			>
				<span
					className="workload-segment"
					data-kind="overdue"
					style={{ width: "100%", opacity: 0.6 }}
				/>
			</div>
			<div className="workload-stats">
				<span data-tone="red">
					<b>{count}</b> à attribuer
				</span>
			</div>
		</div>
	);
}
