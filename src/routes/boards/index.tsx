// ============ BOARDS INDEX · Lume Éclat (Phase 3d) ============
// Header sobre + filtres (workspace chips + sort) + grille de cartes Éclat,
// regroupées par espace de travail.

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "#/features/app/AppShell";
import { CreateBoardModal } from "#/features/app/CreateBoardModal";
import { Icon } from "#/features/app/Icon";
import { authClient } from "#/lib/auth-client";
import { hexFor } from "#/lib/board-backgrounds";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

export const Route = createFileRoute("/boards/")({ component: BoardsPage });

type SortId = "recent" | "name" | "starred";
type WorkspaceFilter = "all" | "favorites" | Id<"workspaces"> | "orphan";

function BoardsPage() {
	const navigate = useNavigate();
	const { data: session, isPending } = authClient.useSession();
	const isAuthed = !isPending && !!session?.user;

	useEffect(() => {
		if (!isPending && !session?.user) {
			navigate({ to: "/login" });
		}
	}, [isPending, session, navigate]);

	const boards = useQuery(api.boards.listMine, isAuthed ? {} : "skip");
	const workspaces = useQuery(api.workspaces.listMine, isAuthed ? {} : "skip");

	return (
		<AppShell
			active={{ route: "workspace" }}
			title="Tous les tableaux"
			crumbs={["Tableaux"]}
		>
			<BoardsContent boards={boards} workspaces={workspaces} />
		</AppShell>
	);
}

function BoardsContent({
	boards,
	workspaces,
}: {
	boards: Array<Doc<"boards"> & { _isMember?: boolean }> | undefined;
	workspaces: Array<Doc<"workspaces"> & { _isMember?: true }> | undefined;
}) {
	const [filter, setFilter] = useState<WorkspaceFilter>("all");
	const [sort, setSort] = useState<SortId>("recent");
	const [query, setQuery] = useState("");
	const [createOpen, setCreateOpen] = useState(false);

	const list = boards ?? [];
	const wsList = workspaces ?? [];

	const filtered = useMemo(() => {
		let result = list.slice();
		if (filter === "favorites") {
			result = result.filter((b) => b.starred);
		} else if (filter === "orphan") {
			result = result.filter((b) => !b.workspaceId);
		} else if (filter !== "all") {
			result = result.filter((b) => b.workspaceId === filter);
		}
		if (query) {
			const q = query.toLowerCase();
			result = result.filter((b) => b.name.toLowerCase().includes(q));
		}
		if (sort === "name") {
			result.sort((a, b) => a.name.localeCompare(b.name, "fr"));
		} else if (sort === "starred") {
			result.sort(
				(a, b) =>
					Number(b.starred ?? false) - Number(a.starred ?? false) ||
					b._creationTime - a._creationTime,
			);
		} else {
			result.sort((a, b) => b._creationTime - a._creationTime);
		}
		return result;
	}, [list, filter, sort, query]);

	// Regroupement par workspace
	const grouped = useMemo(() => {
		const map = new Map<
			string,
			{
				wsId: string | null;
				wsName: string;
				wsColor: string;
				boards: typeof filtered;
			}
		>();
		for (const b of filtered) {
			const wsId = b.workspaceId ?? null;
			const key = wsId ?? "__orphan__";
			if (!map.has(key)) {
				const ws = wsList.find((w) => w._id === wsId);
				map.set(key, {
					wsId,
					wsName: ws?.name ?? "Sans espace",
					wsColor: ws?.color ?? "slate",
					boards: [],
				});
			}
			map.get(key)?.boards.push(b);
		}
		return Array.from(map.values()).sort((a, b) => {
			if (a.wsId === null) return 1;
			if (b.wsId === null) return -1;
			return a.wsName.localeCompare(b.wsName, "fr");
		});
	}, [filtered, wsList]);

	const starredCount = list.filter((b) => b.starred).length;
	const orphanCount = list.filter((b) => !b.workspaceId).length;

	return (
		<div className="tools-page">
			<header className="mw-pagehead">
				<div className="mw-greet">
					<h1 className="mw-greet-h1">
						Mes <em className="serif-italic">tableaux</em>.
					</h1>
					<button
						type="button"
						className="mw-cta btn btn--accent"
						onClick={() => setCreateOpen(true)}
					>
						<Icon name="plus" size={13} stroke={2} />
						Nouveau tableau
					</button>
				</div>
				<div
					className="acc-eyebrow"
					style={{ marginTop: 10, display: "flex", gap: 16, flexWrap: "wrap" }}
				>
					<span>{list.length} tableaux</span>
					<span style={{ color: "var(--accent-text)" }}>
						{starredCount} favoris
					</span>
					<span>{wsList.length} espaces</span>
				</div>
			</header>

			<section className="tools-body">
				<div className="boards-toolbar">
					<div className="boards-filters">
						<button
							type="button"
							onClick={() => setFilter("all")}
							className={`boards-chip${filter === "all" ? " is-active" : ""}`}
						>
							<span className="boards-chip-dot" />
							Tous
							<span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
								{list.length}
							</span>
						</button>
						<button
							type="button"
							onClick={() => setFilter("favorites")}
							className={`boards-chip${filter === "favorites" ? " is-active" : ""}`}
						>
							<Icon name="star" size={11} />
							Favoris
							<span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
								{starredCount}
							</span>
						</button>
						{wsList.map((w) => (
							<button
								key={w._id}
								type="button"
								onClick={() => setFilter(w._id)}
								className={`boards-chip${filter === w._id ? " is-active" : ""}`}
							>
								<span
									className="boards-chip-dot"
									style={{ background: hexFor(w.color ?? "slate") }}
								/>
								{w.name}
							</button>
						))}
						{orphanCount > 0 && (
							<button
								type="button"
								onClick={() => setFilter("orphan")}
								className={`boards-chip${filter === "orphan" ? " is-active" : ""}`}
							>
								<span className="boards-chip-dot" />
								Sans espace
								<span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
									{orphanCount}
								</span>
							</button>
						)}
					</div>

					<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
						<div className="boards-search">
							<Icon name="search" size={13} stroke={1.6} />
							<input
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Rechercher un tableau…"
							/>
						</div>
						<div className="boards-sort">
							<span>Trier&nbsp;:</span>
							<select
								value={sort}
								onChange={(e) => setSort(e.target.value as SortId)}
							>
								<option value="recent">Récents</option>
								<option value="name">Nom</option>
								<option value="starred">Favoris d'abord</option>
							</select>
						</div>
					</div>
				</div>

				{boards === undefined ? (
					<div
						className="text-subtle text-sm"
						style={{ padding: "40px 0", textAlign: "center" }}
					>
						Chargement des tableaux…
					</div>
				) : list.length === 0 ? (
					<EmptyBoards onCreate={() => setCreateOpen(true)} />
				) : grouped.length === 0 ? (
					<NoMatch onClear={() => setQuery("")} />
				) : (
					grouped.map((g) => (
						<div key={g.wsId ?? "orphan"} className="boards-section">
							<div className="boards-section-head">
								<span className="boards-section-eyebrow">
									<span
										className="boards-chip-dot"
										style={{ background: hexFor(g.wsColor) }}
									/>
									{g.wsName}
									<span className="boards-section-count">
										{g.boards.length}
									</span>
								</span>
								{g.wsId && (
									<Link
										to="/workspaces/$workspaceId"
										params={{ workspaceId: g.wsId as Id<"workspaces"> }}
										className="text-sm"
										style={{ color: "var(--text-muted)" }}
									>
										Voir l'espace →
									</Link>
								)}
							</div>

							{g.boards.length === 0 ? (
								<div className="boards-empty">
									<p className="boards-empty-title">Pas encore de tableaux.</p>
									<p className="boards-empty-desc">
										Crée un nouveau tableau dans cet espace.
									</p>
								</div>
							) : (
								<div className="board-grid">
									{g.boards.map((b) => (
										<BoardCard key={b._id} board={b} wsName={g.wsName} />
									))}
									<button
										type="button"
										onClick={() => setCreateOpen(true)}
										className="board-card-new"
									>
										<div className="board-card-new-icon">
											<Icon name="plus" size={16} stroke={1.8} />
										</div>
										<span style={{ fontSize: 13, fontWeight: 500 }}>
											Nouveau tableau
										</span>
									</button>
								</div>
							)}
						</div>
					))
				)}
			</section>

			{createOpen && <CreateBoardModal onClose={() => setCreateOpen(false)} />}
		</div>
	);
}

function BoardCard({
	board,
	wsName,
}: {
	board: Doc<"boards"> & { _isMember?: boolean };
	wsName: string;
}) {
	const stripColor = hexFor(board.color);
	const emoji = board.name.charAt(0).toUpperCase();

	return (
		<Link
			to="/boards/$boardId"
			params={{ boardId: board._id }}
			className="board-card-lume"
		>
			<div
				className="board-card-strip"
				style={{
					background: `linear-gradient(135deg, ${stripColor}, ${stripColor}cc)`,
				}}
			>
				<div className="board-card-emoji">{emoji}</div>
				<button
					type="button"
					className={`board-card-star${board.starred ? " is-on" : ""}`}
					aria-label={
						board.starred ? "Retirer des favoris" : "Ajouter aux favoris"
					}
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
					}}
				>
					<Icon name="star" size={13} stroke={2} />
				</button>
			</div>

			<div className="board-card-body">
				<div className="board-card-name">{board.name}</div>
				<div className="board-card-meta">{wsName}</div>
			</div>

			<div className="board-card-foot">
				<div className="board-card-foot-meta">
					{board._isMember ? (
						<span className="board-card-stat">
							<Icon name="team" size={11} stroke={1.6} />
							Partagé
						</span>
					) : (
						<span className="board-card-stat">
							<Icon name="board" size={11} stroke={1.6} />
							Tableau
						</span>
					)}
				</div>
				<span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
					{formatDistanceToNow(board._creationTime, {
						addSuffix: true,
						locale: fr,
					})}
				</span>
			</div>
		</Link>
	);
}

function EmptyBoards({ onCreate }: { onCreate: () => void }) {
	return (
		<div
			style={{
				border: "1px dashed var(--border-strong)",
				borderRadius: "var(--r-lg, 12px)",
				padding: "48px 24px",
				textAlign: "center",
				background: "var(--bg-soft)",
			}}
		>
			<div
				style={{
					width: 48,
					height: 48,
					borderRadius: 12,
					background: "var(--accent-soft)",
					color: "var(--accent-text)",
					display: "grid",
					placeItems: "center",
					margin: "0 auto 16px",
				}}
			>
				<Icon name="board" size={22} />
			</div>
			<div
				style={{
					fontFamily: "var(--font-serif)",
					fontStyle: "italic",
					fontSize: 22,
					color: "var(--text)",
					marginBottom: 6,
				}}
			>
				Crée ton premier tableau.
			</div>
			<p
				className="text-muted text-sm"
				style={{ margin: "0 auto 18px", maxWidth: 360 }}
			>
				Un tableau organise ton travail en colonnes et en cartes. C'est ici que
				tout commence.
			</p>
			<button type="button" className="btn btn--accent" onClick={onCreate}>
				<Icon name="plus" size={13} /> Nouveau tableau
			</button>
		</div>
	);
}

function NoMatch({ onClear }: { onClear: () => void }) {
	return (
		<div
			style={{
				border: "1px dashed var(--border-c)",
				borderRadius: "var(--r-lg, 12px)",
				padding: "40px 24px",
				textAlign: "center",
				background: "var(--bg-soft)",
			}}
		>
			<p
				style={{
					fontFamily: "var(--font-serif)",
					fontStyle: "italic",
					fontSize: 18,
					color: "var(--text-muted)",
					margin: 0,
				}}
			>
				Rien ne correspond.
			</p>
			<button
				type="button"
				className="btn btn--ghost"
				style={{ marginTop: 10 }}
				onClick={onClear}
			>
				Effacer la recherche
			</button>
		</div>
	);
}
