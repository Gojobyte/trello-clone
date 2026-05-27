// ============ MY WORK · Lume Éclat (Phase 3a) ============
// Tabs : Inbox / Mon jour / Mes tâches / Vues
// Mon jour est la pièce maîtresse : pagehead + indicators + tasks + feed.

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "#/features/app/AppShell";
import { Icon } from "#/features/app/Icon";
import { authClient } from "#/lib/auth-client";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/my-work")({
	component: MyWorkRoute,
	validateSearch: (s: Record<string, unknown>) => ({
		tab: typeof s.tab === "string" ? s.tab : "today",
	}),
});

function MyWorkRoute() {
	const { tab } = Route.useSearch();
	const titleMap: Record<string, string> = {
		inbox: "Inbox",
		today: "Mon jour",
		tasks: "Mes tâches",
		views: "Vues",
	};
	return (
		<AppShell
			active={{ route: "my-work", mwTab: tab }}
			title={titleMap[tab] ?? "Mon jour"}
		>
			<MyWorkContent tab={tab} />
		</AppShell>
	);
}

// ============ TYPES ============

type ConvexCard = {
	_id: Id<"cards">;
	title: string;
	boardId: Id<"boards">;
	boardName: string;
	boardColor: string;
	listName: string;
	completed: boolean;
	dueDate: number | null;
	checklistDone: number;
	checklistTotal: number;
	labelCount: number;
};

type ConvexNotification = {
	_id: Id<"notifications">;
	_creationTime: number;
	userId: string;
	type: string;
	boardId?: Id<"boards">;
	cardId?: Id<"cards">;
	actorName: string;
	message: string;
	read: boolean;
	boardName?: string;
	cardTitle?: string;
};

type ConvexSavedView = {
	_id: Id<"savedViews">;
	name: string;
	icon: string;
	filterPriority?: string;
	filterDue?: string;
};

// ============ HELPERS ============

function fmtDueDate(ts: number | null): {
	label: string;
	when: "overdue" | "today" | "tomorrow" | "week" | "later";
} | null {
	if (!ts) return null;
	const now = Date.now();
	const diff = ts - now;
	const days = Math.floor(diff / 86400000);
	if (diff < 0) {
		const overdueDays = Math.abs(days);
		return {
			label: overdueDays === 0 ? "Aujourd'hui" : `${overdueDays}j de retard`,
			when: "overdue",
		};
	}
	if (days === 0) return { label: "Aujourd'hui", when: "today" };
	if (days === 1) return { label: "Demain", when: "tomorrow" };
	if (days <= 7) return { label: `Dans ${days}j`, when: "week" };
	const d = new Date(ts);
	return {
		label: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
		when: "later",
	};
}

function fmtRelative(ts: number): string {
	const diff = Date.now() - ts;
	if (diff < 60000) return "à l'instant";
	if (diff < 3600000) return `il y a ${Math.floor(diff / 60000)} min`;
	if (diff < 86400000) return `il y a ${Math.floor(diff / 3600000)}h`;
	const days = Math.floor(diff / 86400000);
	if (days === 1) return "hier";
	return `il y a ${days} j`;
}

// Long French date — « Mercredi 27 mai »
function fmtLongDate(ts: number): string {
	return new Date(ts)
		.toLocaleDateString("fr-FR", {
			weekday: "long",
			day: "numeric",
			month: "long",
		})
		.replace(/^./, (c) => c.toUpperCase());
}

// Initiales d'un nom (2 lettres max)
function initialsOf(name?: string | null): string {
	if (!name) return "?";
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Couleur d'avatar dérivée d'un nom (hash simple, 6 couleurs Lume)
const AV_COLORS = ["amber", "plum", "teal", "rose", "blue", "ember"] as const;
function colorOf(seed: string | null | undefined): (typeof AV_COLORS)[number] {
	if (!seed) return "amber";
	let hash = 0;
	for (const c of seed) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
	return AV_COLORS[hash % AV_COLORS.length];
}

// Priorité heuristique : pas de champ dédié, on estime via labelCount.
function priorityOf(card: ConvexCard): "urgent" | "high" | "medium" | "low" {
	if (card.labelCount >= 3) return "urgent";
	if (card.labelCount === 2) return "high";
	if (card.labelCount === 1) return "medium";
	return "low";
}

// Mock heatmap (7 jours) — Convex n'a pas encore de source dédiée.
const HEATMAP_DAYS = [
	{ day: "lun", o: 0.18 },
	{ day: "mar", o: 0.45 },
	{ day: "mer", o: 0.3 },
	{ day: "jeu", o: 0.75 },
	{ day: "ven", o: 0.6 },
	{ day: "sam", o: 0.88 },
	{ day: "dim", o: 0.95 },
];

// ============ MAIN CONTENT ============

function MyWorkContent({ tab }: { tab: string }) {
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();

	const cards = useQuery(api.myWork.myCards, session?.user ? {} : "skip") as
		| ConvexCard[]
		| undefined;

	const notifications = useQuery(
		api.notifications.listMine,
		session?.user ? {} : "skip",
	) as ConvexNotification[] | undefined;

	const markAllAsRead = useMutation(api.notifications.markAllAsRead);

	const userName = session?.user?.name ?? session?.user?.email ?? "toi";
	const firstName = userName.split(/\s+/)[0] ?? userName;
	const userInitials = initialsOf(session?.user?.name ?? session?.user?.email);
	const userColor = colorOf(session?.user?.id ?? session?.user?.email ?? "u");

	const now = Date.now();
	const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

	const overdue = (cards ?? []).filter(
		(c) => !c.completed && c.dueDate !== null && c.dueDate < now,
	);
	const dueToday = (cards ?? []).filter((c) => {
		if (c.completed || c.dueDate === null || c.dueDate < now) return false;
		return c.dueDate - now <= 86400000;
	});

	const tabs: Array<{
		id: string;
		label: string;
		count: number;
		accent?: boolean;
	}> = [
		{ id: "today", label: "Mon jour", count: overdue.length + dueToday.length },
		{ id: "inbox", label: "Inbox", count: unreadCount, accent: true },
		{
			id: "tasks",
			label: "Mes tâches",
			count: cards?.filter((c) => !c.completed).length ?? 0,
		},
		{ id: "views", label: "Vues", count: 0 },
	];

	const active = ["inbox", "today", "tasks", "views"].includes(tab)
		? tab
		: "today";

	const totalToday = overdue.length + dueToday.length;

	// CTA "Nouvelle tâche" → ouvre la palette via simulation de raccourci.
	function openPalette() {
		// TODO: brancher un store global pour ouvrir la palette directement.
		const ev = new KeyboardEvent("keydown", {
			key: "k",
			ctrlKey: true,
			metaKey: true,
			bubbles: true,
		});
		window.dispatchEvent(ev);
	}

	return (
		<div className="mw-shell">
			{/* ═══ Page header (greeting + CTA), commun à tous les onglets ═══ */}
			<header className="mw-pagehead">
				<div className="mw-pagehead-dotgrid" aria-hidden="true" />
				<div className="mw-greet">
					<div>
						<h1 className="mw-greet-h1">
							Bonjour, <em className="serif-italic">{firstName}</em>.
						</h1>
						<p className="mw-sub">
							<span className="mw-sub-live">
								<span className="ping" />
								{fmtLongDate(now)}
							</span>
							<span aria-hidden="true">·</span>
							<span>
								{cards === undefined
									? "…"
									: `${cards.length} tâche${cards.length !== 1 ? "s" : ""}`}
							</span>
						</p>
					</div>
					<button type="button" className="mw-cta" onClick={openPalette}>
						<Icon name="plus" size={14} />
						<span>Nouvelle tâche</span>
						<span className="mw-cta-kbd">C</span>
					</button>
				</div>

				{/* Tabs segmented */}
				<nav className="mw-tabs" aria-label="Sections My Work">
					{tabs.map((t) => (
						<button
							key={t.id}
							type="button"
							className={`mw-tab${active === t.id ? " is-active" : ""}`}
							onClick={() =>
								navigate({ to: "/my-work", search: { tab: t.id } })
							}
						>
							<span>{t.label}</span>
							{t.count > 0 && (
								<span
									className={`mw-tab-count${t.accent && active !== t.id ? " is-accent" : ""}`}
								>
									{t.count}
								</span>
							)}
						</button>
					))}
					<span className="mw-tabs-spacer" />
					{active === "inbox" && unreadCount > 0 && (
						<button
							type="button"
							className="mw-tabs-action"
							onClick={() => {
								markAllAsRead()
									.then(() =>
										toast.success(
											"Toutes les notifications marquées comme lues",
										),
									)
									.catch(() => toast.error("Erreur lors de la mise à jour"));
							}}
						>
							<Icon name="check" size={12} /> Tout marquer lu
						</button>
					)}
				</nav>
			</header>

			{/* ═══ Layout principal : main + activity panel ═══ */}
			<div className={`mw-layout${active === "today" ? " has-panel" : ""}`}>
				<main className="mw-main">
					{active === "today" && (
						<TodayView
							cards={cards}
							totalToday={totalToday}
							userInitials={userInitials}
							userColor={userColor}
						/>
					)}
					{active === "inbox" && <InboxView notifications={notifications} />}
					{active === "tasks" && (
						<TasksView
							cards={cards}
							userInitials={userInitials}
							userColor={userColor}
						/>
					)}
					{active === "views" && <ViewsTab cards={cards} />}
				</main>

				{active === "today" && (
					<aside className="mw-panel" aria-label="Activité récente">
						<ActivityPanel notifications={notifications} />
					</aside>
				)}
			</div>
		</div>
	);
}

// ============ TODAY (Mon jour — pièce maîtresse) ============

function TodayView({
	cards,
	totalToday,
	userInitials,
	userColor,
}: {
	cards: ConvexCard[] | undefined;
	totalToday: number;
	userInitials: string;
	userColor: string;
}) {
	if (cards === undefined) {
		return <p className="mw-loading">Chargement…</p>;
	}

	const now = Date.now();

	const todayCards = cards.filter((c) => {
		if (c.dueDate === null) return false;
		if (c.dueDate < now) return true; // overdue
		return c.dueDate - now <= 86400000; // due within 24h
	});

	const weekCards = cards.filter((c) => {
		if (c.dueDate === null) return false;
		const diff = c.dueDate - now;
		return diff > 86400000 && diff <= 7 * 86400000;
	});

	const laterCards = cards.filter((c) => {
		if (c.dueDate === null) return true;
		return c.dueDate - now > 7 * 86400000;
	});

	// Indicators
	const ringPct = Math.min(100, Math.round((cards.length / 30) * 100));
	const highPrio = cards.filter((c) => {
		const p = priorityOf(c);
		return p === "urgent" || p === "high";
	}).length;
	const focusCount = Math.max(
		highPrio,
		totalToday > 0 ? Math.min(3, totalToday) : 0,
	);

	return (
		<>
			{/* ─── Indicators ─── */}
			<section className="mw-inds" aria-label="Indicateurs">
				{/* Widget A : ring */}
				<article className="mw-ind">
					<div
						className="mw-ring"
						style={{ "--pct": ringPct } as React.CSSProperties}
					>
						<span className="mw-ring-val">{ringPct}%</span>
					</div>
					<div className="mw-ind-body">
						<span className="mw-ind-eyebrow">Charge · capacité</span>
						<span className="mw-ind-headline">
							{cards.length}
							<span className="mw-ind-unit">/ 30 tâches</span>
						</span>
						<span className="mw-ind-meta">
							<b>{totalToday}</b> pour aujourd'hui
						</span>
					</div>
				</article>

				{/* Widget B : heatmap */}
				<article className="mw-ind">
					<div className="mw-heat" role="img" aria-label="7 derniers jours">
						{HEATMAP_DAYS.map((d) => (
							<span
								key={d.day}
								className="mw-heat-cell"
								style={{ opacity: d.o }}
							/>
						))}
					</div>
					<div className="mw-ind-body">
						<span className="mw-ind-eyebrow">Streak · sans retard</span>
						<span
							className="mw-ind-headline"
							style={{ color: "var(--accent-hover)" }}
						>
							8<span className="mw-ind-unit">jours</span>
						</span>
						<span className="mw-ind-meta">
							<b>L M M J V S D</b> · cette semaine
						</span>
					</div>
				</article>

				{/* Widget C : bars */}
				<article className="mw-ind">
					<div className="mw-bars" role="img" aria-label="Top priorités">
						<span
							className="mw-bar"
							style={{ "--w": "80%" } as React.CSSProperties}
						/>
						<span
							className="mw-bar"
							style={{ "--w": "45%" } as React.CSSProperties}
						/>
						<span
							className="mw-bar"
							style={{ "--w": "20%" } as React.CSSProperties}
						/>
					</div>
					<div className="mw-ind-body">
						<span className="mw-ind-eyebrow">Focus · priorité haute</span>
						<span className="mw-ind-headline">
							{focusCount}
							<span className="mw-ind-unit">en cours</span>
						</span>
						<span className="mw-ind-meta">
							<b>{Math.min(1, focusCount)}</b> bientôt terminée
						</span>
					</div>
				</article>
			</section>

			{/* ─── Task groups ─── */}
			<section className="mw-body" aria-label="Tâches">
				<TaskGroup
					label="Aujourd'hui"
					cards={todayCards}
					activeDot
					userInitials={userInitials}
					userColor={userColor}
				/>
				<TaskGroup
					label="Cette semaine"
					cards={weekCards}
					userInitials={userInitials}
					userColor={userColor}
				/>
				<TaskGroup
					label="Plus tard"
					cards={laterCards}
					later
					userInitials={userInitials}
					userColor={userColor}
				/>
			</section>
		</>
	);
}

function TaskGroup({
	label,
	cards,
	activeDot,
	later,
	userInitials,
	userColor,
}: {
	label: string;
	cards: ConvexCard[];
	activeDot?: boolean;
	later?: boolean;
	userInitials: string;
	userColor: string;
}) {
	return (
		<div className={`mw-group${later ? " mw-group--later" : ""}`}>
			<div className="mw-group-head">
				{activeDot && <span className="mw-group-dot" aria-hidden="true" />}
				<span className="mw-group-label">{label.toUpperCase()}</span>
				<span className="mw-group-count">
					{cards.length} tâche{cards.length !== 1 ? "s" : ""}
				</span>
				<span className="mw-group-rule" aria-hidden="true" />
			</div>
			{cards.length === 0 ? (
				<div className="mw-empty">Rien ici</div>
			) : (
				<ul className="mw-rows">
					{cards.map((c) => (
						<CardRow
							key={c._id}
							card={c}
							userInitials={userInitials}
							userColor={userColor}
						/>
					))}
				</ul>
			)}
		</div>
	);
}

function CardRow({
	card,
	userInitials,
	userColor,
}: {
	card: ConvexCard;
	userInitials: string;
	userColor: string;
}) {
	const navigate = useNavigate();
	const updateCard = useMutation(api.cards.update);
	const due = fmtDueDate(card.dueDate);
	const prio = priorityOf(card);
	const boardDotColor = colorOf(card.boardName);

	function toggle(e: React.MouseEvent) {
		e.stopPropagation();
		updateCard({ cardId: card._id, completed: !card.completed }).catch(() =>
			toast.error("Erreur lors de la mise à jour"),
		);
	}

	function open() {
		navigate({ to: "/boards/$boardId", params: { boardId: card.boardId } });
	}

	return (
		<li className={`mw-row${card.completed ? " is-done" : ""}`}>
			<button
				type="button"
				className={`mw-check${card.completed ? " is-done" : ""}`}
				aria-label={card.completed ? "Décocher" : "Cocher"}
				onClick={toggle}
			/>
			<span className="mw-prio" data-prio={prio} aria-hidden="true" />
			<button
				type="button"
				className="mw-title"
				onClick={open}
				title={card.title}
			>
				{card.title}
			</button>
			<span className="mw-board-pill">
				<span className="sb-board-dot" data-color={boardDotColor} />
				<span>{card.boardName}</span>
			</span>
			{due ? (
				<span className="mw-date" data-when={due.when}>
					{due.label}
				</span>
			) : (
				<span className="mw-date">—</span>
			)}
			<span className="mw-av" data-color={userColor}>
				{userInitials}
			</span>
			<div className="mw-row-actions" aria-hidden="true">
				<button
					type="button"
					className="mw-row-act"
					aria-label="Ouvrir"
					onClick={(e) => {
						e.stopPropagation();
						open();
					}}
				>
					<Icon name="eye" size={14} />
				</button>
				<button
					type="button"
					className="mw-row-act"
					aria-label="Archiver"
					onClick={(e) => {
						e.stopPropagation();
						// TODO: branche archive mutation
					}}
				>
					<Icon name="trash" size={14} />
				</button>
			</div>
		</li>
	);
}

// ============ ACTIVITY PANEL ============

function ActivityPanel({
	notifications,
}: {
	notifications: ConvexNotification[] | undefined;
}) {
	const items = (notifications ?? []).slice(0, 6);
	return (
		<>
			<div className="mw-panel-head">
				<span className="mw-panel-eyebrow">Activité</span>
				<button type="button" className="mw-panel-link">
					Voir tout
				</button>
			</div>
			{notifications === undefined ? (
				<p className="mw-loading">Chargement…</p>
			) : items.length === 0 ? (
				<p className="mw-empty mw-empty--panel">Aucune activité récente</p>
			) : (
				<ul className="mw-feed">
					{items.map((n) => {
						const color = colorOf(n.actorName);
						return (
							<li key={n._id} className="feed-item">
								<span className="feed-av" data-color={color}>
									{initialsOf(n.actorName)}
								</span>
								<div className="feed-body">
									<p className="feed-text">
										<b>{n.actorName || "Quelqu'un"}</b> {n.message}
										{n.cardTitle ? (
											<>
												{" "}
												<span className="feed-pill">{n.cardTitle}</span>
											</>
										) : null}
									</p>
									<div className="feed-ts">{fmtRelative(n._creationTime)}</div>
								</div>
							</li>
						);
					})}
				</ul>
			)}
			<div className="mw-panel-foot">
				<span className="ping" />
				<span className="mw-panel-foot-text">Tu es à jour</span>
			</div>
		</>
	);
}

// ============ INBOX ============

const INBOX_KIND_META: Record<
	string,
	{ icon: string; label: string; tone: string }
> = {
	"mention.comment": { icon: "chat", label: "Mention", tone: "var(--accent)" },
	"card.assigned": { icon: "user", label: "Assignée", tone: "var(--text)" },
	"card.unassigned": {
		icon: "user",
		label: "Désassignée",
		tone: "var(--text-subtle)",
	},
	"invitation.received": {
		icon: "team",
		label: "Invitation",
		tone: "var(--text)",
	},
	due: { icon: "clock", label: "Échéance", tone: "var(--accent)" },
	comment: { icon: "chat", label: "Commentaire", tone: "var(--text-subtle)" },
	done: { icon: "check", label: "Terminée", tone: "var(--text)" },
};

function kindMeta(type: string): { icon: string; label: string; tone: string } {
	return (
		INBOX_KIND_META[type] ?? {
			icon: "spark",
			label: type,
			tone: "var(--text-subtle)",
		}
	);
}

function InboxView({
	notifications,
}: {
	notifications: ConvexNotification[] | undefined;
}) {
	const [filter, setFilter] = useState("all");
	const markAsRead = useMutation(api.notifications.markAsRead);

	if (notifications === undefined) {
		return <p className="mw-loading">Chargement…</p>;
	}

	if (notifications.length === 0) {
		return (
			<div className="mw-empty-state">
				<Icon name="check" size={28} stroke={1.2} />
				<p>Inbox vide · tout est à jour</p>
			</div>
		);
	}

	const counts = {
		all: notifications.length,
		unread: notifications.filter((n) => !n.read).length,
		mention: notifications.filter((n) => n.type === "mention.comment").length,
		assigned: notifications.filter(
			(n) => n.type === "card.assigned" || n.type === "invitation.received",
		).length,
		activity: notifications.filter(
			(n) => n.type === "done" || n.type === "comment",
		).length,
	};
	const filters: Array<[string, string, number]> = [
		["all", "Tout", counts.all],
		["unread", "Non lus", counts.unread],
		["mention", "Mentions", counts.mention],
		["assigned", "Assignations", counts.assigned],
		["activity", "Activité", counts.activity],
	];

	const visible = notifications.filter((n) => {
		if (filter === "all") return true;
		if (filter === "unread") return !n.read;
		if (filter === "mention") return n.type === "mention.comment";
		if (filter === "assigned")
			return n.type === "card.assigned" || n.type === "invitation.received";
		if (filter === "activity") return n.type === "done" || n.type === "comment";
		return true;
	});

	// Group by recency
	const now = Date.now();
	const todayN: ConvexNotification[] = [];
	const weekN: ConvexNotification[] = [];
	const olderN: ConvexNotification[] = [];
	for (const n of visible) {
		const diff = now - n._creationTime;
		if (diff < 86400000) todayN.push(n);
		else if (diff < 7 * 86400000) weekN.push(n);
		else olderN.push(n);
	}

	return (
		<>
			<div className="mw-chips">
				{filters.map(([id, label, count]) => (
					<button
						key={id}
						type="button"
						className={`mw-chip${filter === id ? " is-active" : ""}`}
						onClick={() => setFilter(id)}
					>
						<span>{label}</span>
						<span className="mw-chip-count">{count}</span>
					</button>
				))}
			</div>

			<div className="mw-body" style={{ padding: 0 }}>
				<InboxGroup
					label="Aujourd'hui"
					items={todayN}
					activeDot
					onRead={(id) =>
						markAsRead({ notificationId: id }).catch(() =>
							toast.error("Erreur lors de la mise à jour"),
						)
					}
				/>
				<InboxGroup
					label="Cette semaine"
					items={weekN}
					onRead={(id) =>
						markAsRead({ notificationId: id }).catch(() =>
							toast.error("Erreur lors de la mise à jour"),
						)
					}
				/>
				<InboxGroup
					label="Plus ancien"
					items={olderN}
					later
					onRead={(id) =>
						markAsRead({ notificationId: id }).catch(() =>
							toast.error("Erreur lors de la mise à jour"),
						)
					}
				/>
			</div>
		</>
	);
}

function InboxGroup({
	label,
	items,
	activeDot,
	later,
	onRead,
}: {
	label: string;
	items: ConvexNotification[];
	activeDot?: boolean;
	later?: boolean;
	onRead: (id: Id<"notifications">) => void;
}) {
	if (items.length === 0) return null;
	return (
		<div className={`mw-group${later ? " mw-group--later" : ""}`}>
			<div className="mw-group-head">
				{activeDot && <span className="mw-group-dot" aria-hidden="true" />}
				<span className="mw-group-label">{label.toUpperCase()}</span>
				<span className="mw-group-count">
					{items.length} {items.length > 1 ? "événements" : "événement"}
				</span>
				<span className="mw-group-rule" aria-hidden="true" />
			</div>
			<div className="mw-rows">
				{items.map((n) => {
					const k = kindMeta(n.type);
					return (
						<button
							key={n._id}
							type="button"
							className={`mw-row mw-row--inbox${!n.read ? " is-unread" : ""}`}
							onClick={() => {
								if (!n.read) onRead(n._id);
							}}
						>
							<span
								className={`mw-check${n.read ? " is-done" : ""}`}
								aria-hidden="true"
							/>
							<span
								className="mw-prio"
								style={{ background: k.tone, boxShadow: "none" }}
								aria-hidden="true"
							/>
							<span className="mw-title">
								<b>{n.actorName || "Quelqu'un"}</b>{" "}
								<span style={{ color: "var(--text-muted)" }}>{n.message}</span>
							</span>
							{n.boardName ? (
								<span className="mw-board-pill">
									<span
										className="sb-board-dot"
										data-color={colorOf(n.boardName)}
									/>
									<span>{n.boardName}</span>
								</span>
							) : (
								<span className="mw-board-pill" style={{ opacity: 0 }}>
									<span>·</span>
								</span>
							)}
							<span className="mw-date">{fmtRelative(n._creationTime)}</span>
							<span className="mw-av" data-color={colorOf(n.actorName)}>
								{initialsOf(n.actorName)}
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}

// ============ TASKS (toutes les cartes en .mw-row) ============

function TasksView({
	cards,
	userInitials,
	userColor,
}: {
	cards: ConvexCard[] | undefined;
	userInitials: string;
	userColor: string;
}) {
	const [filter, setFilter] = useState<"all" | "open" | "done">("open");

	if (cards === undefined) {
		return <p className="mw-loading">Chargement…</p>;
	}

	const filtered = cards.filter((c) => {
		if (filter === "all") return true;
		if (filter === "open") return !c.completed;
		return c.completed;
	});

	const filters: Array<[typeof filter, string, number]> = [
		["all", "Toutes", cards.length],
		["open", "En cours", cards.filter((c) => !c.completed).length],
		["done", "Terminées", cards.filter((c) => c.completed).length],
	];

	return (
		<>
			<div className="mw-chips">
				{filters.map(([id, label, count]) => (
					<button
						key={id}
						type="button"
						className={`mw-chip${filter === id ? " is-active" : ""}`}
						onClick={() => setFilter(id)}
					>
						<span>{label}</span>
						<span className="mw-chip-count">{count}</span>
					</button>
				))}
			</div>

			<div className="mw-body" style={{ padding: 0 }}>
				<div className="mw-group">
					<div className="mw-group-head">
						<span className="mw-group-label">
							{filter === "open"
								? "EN COURS"
								: filter === "done"
									? "TERMINÉES"
									: "TOUTES LES TÂCHES"}
						</span>
						<span className="mw-group-count">
							{filtered.length} tâche{filtered.length !== 1 ? "s" : ""}
						</span>
						<span className="mw-group-rule" aria-hidden="true" />
					</div>
					{filtered.length === 0 ? (
						<div className="mw-empty">Aucune carte à afficher</div>
					) : (
						<ul className="mw-rows">
							{filtered.map((c) => (
								<CardRow
									key={c._id}
									card={c}
									userInitials={userInitials}
									userColor={userColor}
								/>
							))}
						</ul>
					)}
				</div>
			</div>
		</>
	);
}

// ============ VIEWS (vues sauvegardées) ============

function ViewsTab({ cards }: { cards: ConvexCard[] | undefined }) {
	const { data: session } = authClient.useSession();
	const navigate = useNavigate();

	const savedViews = useQuery(
		api.savedViews.list,
		session?.user ? {} : "skip",
	) as ConvexSavedView[] | undefined;

	const createView = useMutation(api.savedViews.create);
	const removeView = useMutation(api.savedViews.remove);

	const [showModal, setShowModal] = useState(false);
	const [newName, setNewName] = useState("");
	const [newDue, setNewDue] = useState("any");
	const [creating, setCreating] = useState(false);

	function handleCreateView() {
		if (!newName.trim()) return;
		setCreating(true);
		createView({
			name: newName.trim(),
			icon: "spark",
			filterDue: newDue !== "any" ? newDue : undefined,
		})
			.then(() => {
				toast.success("Vue créée");
				setShowModal(false);
				setNewName("");
				setNewDue("any");
			})
			.catch(() => toast.error("Erreur lors de la création"))
			.finally(() => setCreating(false));
	}

	function handleRemove(viewId: Id<"savedViews">, e: React.MouseEvent) {
		e.stopPropagation();
		removeView({ viewId })
			.then(() => toast.success("Vue supprimée"))
			.catch(() => toast.error("Erreur lors de la suppression"));
	}

	function viewIconEmoji(icon: string): string {
		const map: Record<string, string> = {
			spark: "✦",
			star: "★",
			bolt: "⚡",
			fire: "🔥",
			pin: "📌",
			eye: "👁",
			flag: "⚑",
		};
		return map[icon] ?? "✦";
	}

	function viewDescription(v: ConvexSavedView): string {
		const parts: string[] = [];
		if (v.filterDue === "overdue") parts.push("En retard");
		else if (v.filterDue === "today") parts.push("Aujourd'hui");
		else if (v.filterDue === "week") parts.push("Cette semaine");
		else if (v.filterDue) parts.push(`Échéance : ${v.filterDue}`);
		if (v.filterPriority) parts.push(`Priorité : ${v.filterPriority}`);
		if (parts.length === 0) return "Toutes les cartes";
		return parts.join(" · ");
	}

	function applyView(_v: ConvexSavedView) {
		// TODO: brancher une page Vues dédiée. Pour l'instant, on bascule
		// simplement vers Mes tâches — la vue applique son filtre côté
		// backend dans une future itération.
		navigate({ to: "/my-work", search: { tab: "tasks" } });
	}

	return (
		<>
			<div className="mw-views-head">
				<span className="mw-views-count">
					{savedViews === undefined
						? "Chargement…"
						: `${savedViews.length} vue${savedViews.length !== 1 ? "s" : ""} sauvegardée${savedViews.length !== 1 ? "s" : ""}`}
				</span>
				<span style={{ flex: 1 }} />
				<span className="mw-views-meta">
					{cards === undefined ? "" : `${cards.length} cartes au total`}
				</span>
			</div>

			<div className="mw-views-grid">
				{savedViews?.map((v) => (
					<div key={v._id} className="mw-view-card-wrap">
						<button
							type="button"
							className="mw-view-card"
							onClick={() => applyView(v)}
						>
							<span className="mw-view-icon">{viewIconEmoji(v.icon)}</span>
							<span className="mw-view-name">{v.name}</span>
							<span className="mw-view-desc">{viewDescription(v)}</span>
						</button>
						<button
							type="button"
							className="mw-view-trash"
							aria-label="Supprimer la vue"
							onClick={(e) => handleRemove(v._id, e)}
						>
							<Icon name="trash" size={12} />
						</button>
					</div>
				))}

				<button
					type="button"
					className="mw-view-card mw-view-card--new"
					onClick={() => setShowModal(true)}
				>
					<span className="mw-view-icon mw-view-icon--new">
						<Icon name="plus" size={20} />
					</span>
					<span className="mw-view-name">Nouvelle vue</span>
					<span className="mw-view-desc">Filtre, priorité, échéance…</span>
				</button>
			</div>

			{showModal && (
				// biome-ignore lint/a11y/noStaticElementInteractions: backdrop click is supplementary
				<div
					className="modal-backdrop"
					onClick={() => setShowModal(false)}
					onKeyDown={(e) => {
						if (e.key === "Escape") setShowModal(false);
					}}
				>
					<div
						className="modal"
						role="dialog"
						aria-modal="true"
						aria-label="Créer une vue"
						onClick={(e) => e.stopPropagation()}
						onKeyDown={(e) => e.stopPropagation()}
					>
						<div style={{ marginBottom: 16 }}>
							<h3 style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>
								Nouvelle vue
							</h3>
						</div>
						<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
							<div>
								<label
									htmlFor="view-name"
									style={{
										fontSize: 12,
										color: "var(--text-muted)",
										display: "block",
										marginBottom: 4,
									}}
								>
									Nom
								</label>
								<input
									id="view-name"
									className="input"
									type="text"
									placeholder="Ex : Mes cartes urgentes"
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
									style={{ width: "100%" }}
								/>
							</div>
							<div>
								<label
									htmlFor="view-due"
									style={{
										fontSize: 12,
										color: "var(--text-muted)",
										display: "block",
										marginBottom: 4,
									}}
								>
									Filtre d'échéance
								</label>
								<select
									id="view-due"
									className="input"
									value={newDue}
									onChange={(e) => setNewDue(e.target.value)}
									style={{ width: "100%" }}
								>
									<option value="any">Toutes les cartes</option>
									<option value="overdue">En retard</option>
									<option value="today">Aujourd'hui</option>
									<option value="week">Cette semaine</option>
								</select>
							</div>
						</div>
						<div
							className="row"
							style={{ gap: 8, marginTop: 20, justifyContent: "flex-end" }}
						>
							<button
								type="button"
								className="btn btn--ghost"
								onClick={() => setShowModal(false)}
							>
								Annuler
							</button>
							<button
								type="button"
								className="btn btn--primary"
								onClick={handleCreateView}
								disabled={creating || !newName.trim()}
							>
								{creating ? "Création…" : "Créer"}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
