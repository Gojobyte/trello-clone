import {
	closestCorners,
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	horizontalListSortingStrategy,
	SortableContext,
} from "@dnd-kit/sortable";
import {
	createFileRoute,
	Link,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import {
	Calendar as CalendarIcon,
	Columns3,
	Filter,
	Grid3x3,
	LayoutDashboard,
	List as ListIcon,
	MoreHorizontal,
	Plus,
	Rows3,
	Star,
	StretchHorizontal,
	Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { AppShell } from "#/features/app/AppShell";
import { BoardFooter, type BoardViewMode } from "#/features/board/BoardFooter";
import { BoardMenu } from "#/features/board/BoardMenu";
import { CardItem } from "#/features/board/card/CardItem";
import { FilterPopoverContent } from "#/features/board/FilterPopoverContent";
import {
	AddListColumn,
	ListColumn,
	SortableListColumn,
} from "#/features/board/list/ListColumn";
import { MemberAvatar } from "#/features/board/shared/MemberAvatar";
import { ShareBoardDialog } from "#/features/board/shared/ShareBoardDialog";
import { CalendarView } from "#/features/board/views/CalendarView";
import { TableView } from "#/features/board/views/TableView";
import { TimelineView } from "#/features/board/views/TimelineView";
import { authClient } from "#/lib/auth-client";
import { gradientFor, photoFor } from "#/lib/board-backgrounds";
import { midPosition } from "#/lib/board-helpers";
import { pushRecentBoard } from "#/lib/use-recent-boards";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

export const Route = createFileRoute("/boards/$boardId")({
	component: BoardDetailPage,
	validateSearch: (s: Record<string, unknown>): { view?: string } => ({
		view: typeof s.view === "string" ? s.view : undefined,
	}),
});

// Mappe les sous-vues de la sidebar (design gestion-pro) vers les modes du board.
function mapViewParam(v: string | undefined): BoardViewMode {
	switch (v) {
		case "calendar":
			return "calendar";
		case "timeline":
		case "dashboard":
			return "table";
		default:
			return "kanban";
	}
}

function BoardDetailPage() {
	const { boardId } = useParams({ from: "/boards/$boardId" });
	const { view: viewParam } = Route.useSearch();
	const navigate = useNavigate();
	const { data: session, isPending } = authClient.useSession();

	useEffect(() => {
		if (!isPending && !session?.user) {
			navigate({ to: "/login" });
		}
	}, [isPending, session, navigate]);

	// Track la visite pour la section "Récemment consultés" de /boards
	useEffect(() => {
		if (boardId) pushRecentBoard(boardId);
	}, [boardId]);

	const data = useQuery(api.boards.get, {
		boardId: boardId as Id<"boards">,
	});

	if (isPending || !session?.user) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[#1d2125]">
				<div className="h-10 w-32 animate-pulse rounded bg-white/10" />
			</div>
		);
	}

	if (data === undefined) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[#1d2125]">
				<p className="text-sm text-white/70">Chargement du tableau...</p>
			</div>
		);
	}

	if (data === null) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#1d2125] text-white">
				<p className="text-lg font-semibold">Tableau introuvable</p>
				<Button asChild>
					<Link to="/boards">Retour à mes tableaux</Link>
				</Button>
			</div>
		);
	}

	return (
		<BoardView
			data={data}
			initialView={mapViewParam(viewParam)}
			viewParam={viewParam}
		/>
	);
}

type BoardData = {
	board: Doc<"boards">;
	lists: Array<Doc<"lists">>;
	cards: Array<Doc<"cards">>;
};

// ─── Helpers Phase 3b : densité + vue d'affichage ──────────────
type Density = "compact" | "normal" | "detailed";
type SubViewId = "board" | "calendar" | "timeline" | "dashboard";

const DENSITY_KEY = "flowboard.board.density";

function readDensity(): Density {
	if (typeof window === "undefined") return "normal";
	try {
		const v = localStorage.getItem(DENSITY_KEY);
		if (v === "compact" || v === "normal" || v === "detailed") return v;
	} catch {
		/* ignore */
	}
	return "normal";
}

function boardViewToSubView(
	view: BoardViewMode,
	rawParam: string | undefined,
): SubViewId {
	if (rawParam === "timeline" || rawParam === "dashboard") return rawParam;
	if (view === "calendar") return "calendar";
	if (view === "table") return "timeline";
	return "board";
}

function subViewToBoardMode(v: SubViewId): BoardViewMode {
	if (v === "calendar") return "calendar";
	if (v === "timeline" || v === "dashboard") return "table";
	return "kanban";
}

// Calcule une nouvelle position pour insérer entre prev et next
function BoardView({
	data,
	initialView,
	viewParam,
}: {
	data: BoardData;
	initialView: BoardViewMode;
	viewParam: string | undefined;
}) {
	const navigate = useNavigate();
	const { board, lists: serverLists, cards: serverCards } = data;
	const photo = photoFor(board.backgroundImage);
	const gradientClass = gradientFor(board.color);

	const reorderCard = useMutation(api.cards.reorder);
	const reorderList = useMutation(api.lists.reorder);

	// État local optimiste pendant le drag
	const [localLists, setLocalLists] =
		useState<Array<Doc<"lists">>>(serverLists);
	const [localCards, setLocalCards] =
		useState<Array<Doc<"cards">>>(serverCards);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [activeType, setActiveType] = useState<"card" | "list" | null>(null);

	// Filtres
	const [filterQuery, setFilterQuery] = useState("");
	const [filterLabelIds, setFilterLabelIds] = useState<Array<Id<"labels">>>([]);
	const [colorBlind, setColorBlind] = useState(false);

	// Mode d'affichage du board (initialisé depuis le paramètre d'URL ?view=)
	const [view, setView] = useState<BoardViewMode>(initialView);

	// Vue actuelle de la sidebar/topbar (board|calendar|timeline|dashboard).
	// Mappée vers `view` pour le rendu (kanban/calendar/table).
	const [subView, setSubView] = useState<SubViewId>(() =>
		boardViewToSubView(initialView, viewParam),
	);

	// Densité des cartes (compact|normal|detailed) — persisté en localStorage.
	const [density, setDensity] = useState<Density>(() => readDensity());
	useEffect(() => {
		try {
			localStorage.setItem(DENSITY_KEY, density);
		} catch {
			/* ignore */
		}
	}, [density]);

	// Sync URL ?view= quand on change la vue depuis le sub-header
	const switchView = useCallback(
		(v: SubViewId) => {
			setSubView(v);
			setView(subViewToBoardMode(v));
			navigate({
				to: "/boards/$boardId",
				params: { boardId: board._id },
				search: { view: v },
				replace: true,
			});
		},
		[board._id, navigate],
	);

	// Ajout de carte rapide via le CTA "+ Carte" — cible la première liste
	const createCard = useMutation(api.cards.create);
	const handleQuickAdd = useCallback(async () => {
		const first = [...localLists].sort((a, b) => a.position - b.position)[0];
		if (!first) return;
		await createCard({
			listId: first._id,
			title: "Nouvelle carte",
		});
	}, [localLists, createCard]);

	// Synchroniser depuis Convex quand on n'est pas en drag
	useEffect(() => {
		if (activeId === null) setLocalLists(serverLists);
	}, [serverLists, activeId]);
	useEffect(() => {
		if (activeId === null) setLocalCards(serverCards);
	}, [serverCards, activeId]);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			// 8px de déplacement avant que le drag s'active (sinon clic simple)
			activationConstraint: { distance: 8 },
		}),
	);

	function findCard(id: string) {
		return localCards.find((c) => c._id === id);
	}

	function handleDragStart(e: DragStartEvent) {
		setActiveId(e.active.id as string);
		setActiveType((e.active.data.current?.type as "card" | "list") ?? null);
	}

	function handleDragOver(e: {
		active: {
			id: string | number;
			data: { current: Record<string, unknown> | undefined };
		};
		over: {
			id: string | number;
			data: { current: Record<string, unknown> | undefined };
		} | null;
	}) {
		const { active, over } = e;
		if (!over || active.id === over.id) return;

		const aType = active.data.current?.type as string | undefined;
		if (aType !== "card") return;

		const activeCard = findCard(active.id as string);
		if (!activeCard) return;

		const oType = over.data.current?.type as string | undefined;

		// Drag d'une carte vers une LISTE vide (zone droppable de la liste)
		if (oType === "list") {
			const targetListId = over.id as Id<"lists">;
			if (activeCard.listId !== targetListId) {
				setLocalCards((cards) =>
					cards.map((c) =>
						c._id === active.id ? { ...c, listId: targetListId } : c,
					),
				);
			}
			return;
		}

		// Drag d'une carte sur une autre CARTE (potentiellement dans une autre liste)
		if (oType === "card") {
			const overCard = findCard(over.id as string);
			if (!overCard) return;
			if (activeCard.listId !== overCard.listId) {
				setLocalCards((cards) =>
					cards.map((c) =>
						c._id === active.id ? { ...c, listId: overCard.listId } : c,
					),
				);
			}
		}
	}

	async function handleDragEnd(e: DragEndEvent) {
		const { active, over } = e;
		if (!over) {
			setActiveId(null);
			setActiveType(null);
			return;
		}

		const aType = active.data.current?.type as string | undefined;
		const oType = over.data.current?.type as string | undefined;

		// === Réordonner une LISTE ===
		if (aType === "list" && oType === "list") {
			if (active.id === over.id) {
				setActiveId(null);
				setActiveType(null);
				return;
			}
			const sorted = [...localLists].sort((a, b) => a.position - b.position);
			const oldIndex = sorted.findIndex((l) => l._id === active.id);
			const newIndex = sorted.findIndex((l) => l._id === over.id);
			if (oldIndex < 0 || newIndex < 0) {
				setActiveId(null);
				setActiveType(null);
				return;
			}
			const reordered = arrayMove(sorted, oldIndex, newIndex);
			const prev = reordered[newIndex - 1];
			const next = reordered[newIndex + 1];
			const newPos = midPosition(prev?.position, next?.position);

			// Update local AVANT la mutation : applique la nouvelle position
			setLocalLists(
				reordered.map((l) =>
					l._id === active.id ? { ...l, position: newPos } : l,
				),
			);

			try {
				await reorderList({
					listId: active.id as Id<"lists">,
					position: newPos,
				});
			} finally {
				// On reset activeId APRÈS la mutation pour empêcher
				// useEffect de resync avec serverLists avant que le push back arrive.
				setActiveId(null);
				setActiveType(null);
			}
			return;
		}

		// === Réordonner / Déplacer une CARTE ===
		if (aType === "card") {
			const activeCard = findCard(active.id as string);
			if (!activeCard) {
				setActiveId(null);
				setActiveType(null);
				return;
			}

			let targetListId: Id<"lists"> = activeCard.listId;
			let newPos: number;

			if (oType === "list") {
				// Drop sur une liste vide → en bas
				targetListId = over.id as Id<"lists">;
				const cardsInTarget = localCards
					.filter((c) => c.listId === targetListId && c._id !== activeCard._id)
					.sort((a, b) => a.position - b.position);
				const lastPos =
					cardsInTarget.length > 0
						? cardsInTarget[cardsInTarget.length - 1].position
						: undefined;
				newPos = midPosition(lastPos, undefined);
			} else if (oType === "card") {
				const overCard = findCard(over.id as string);
				if (!overCard) {
					setActiveId(null);
					setActiveType(null);
					return;
				}
				targetListId = overCard.listId;
				const sorted = localCards
					.filter((c) => c.listId === targetListId)
					.sort((a, b) => a.position - b.position);
				const oldIndex = sorted.findIndex((c) => c._id === active.id);
				const newIndex = sorted.findIndex((c) => c._id === over.id);
				let finalCards = sorted;
				if (oldIndex >= 0 && newIndex >= 0) {
					finalCards = arrayMove(sorted, oldIndex, newIndex);
				}
				const idx = finalCards.findIndex((c) => c._id === active.id);
				const prev = finalCards[idx - 1];
				const next = finalCards[idx + 1];
				newPos = midPosition(prev?.position, next?.position);
			} else {
				setActiveId(null);
				setActiveType(null);
				return;
			}

			// Update local AVANT mutation avec les valeurs finales
			setLocalCards((cards) =>
				cards.map((c) =>
					c._id === active.id
						? { ...c, listId: targetListId, position: newPos }
						: c,
				),
			);

			try {
				await reorderCard({
					cardId: active.id as Id<"cards">,
					listId: targetListId,
					position: newPos,
				});
			} finally {
				setActiveId(null);
				setActiveType(null);
			}
		}
	}

	const backgroundStyle: React.CSSProperties = photo
		? {
				backgroundImage: `url('${photo.url}')`,
				backgroundSize: "cover",
				backgroundPosition: "center",
			}
		: {};

	const sortedLists = [...localLists].sort((a, b) => a.position - b.position);

	// Filtrage des cartes
	const queryLower = filterQuery.trim().toLowerCase();
	const filteredCards = localCards.filter((c) => {
		if (queryLower && !c.title.toLowerCase().includes(queryLower)) return false;
		if (filterLabelIds.length > 0) {
			const cardLabels = c.labelIds ?? [];
			// "OR" : la carte doit avoir au moins un des labels sélectionnés
			if (!filterLabelIds.some((id) => cardLabels.includes(id))) return false;
		}
		return true;
	});
	const hasActiveFilters = queryLower !== "" || filterLabelIds.length > 0;
	const listIds = sortedLists.map((l) => l._id);

	const activeCard =
		activeType === "card" && activeId ? findCard(activeId) : null;
	const activeList =
		activeType === "list" && activeId
			? localLists.find((l) => l._id === activeId)
			: null;

	return (
		<AppShell
			active={{ route: "boards", boardId: board._id, boardView: subView }}
			title={board.name}
		>
			<div
				className={`board-page relative flex h-full flex-col overflow-hidden ${colorBlind ? "colorblind" : ""}`}
			>
				{/* Image de fond (ou dégradé) — limitée à la zone main, sous le shell */}
				<div
					className={`absolute inset-0 ${photo ? "" : `bg-gradient-to-br ${gradientClass}`}`}
					style={backgroundStyle}
				/>
				{/* Voile sombre subtil pour lisibilité */}
				<div className="absolute inset-0 bg-black/10" />

				{/* Sub-header Lume Éclat (Phase 3b — remplace l'ancien BoardSubHeader) */}
				<KanbanSubHeader
					board={board}
					cardCount={filteredCards.length}
					subView={subView}
					onSwitchView={switchView}
					density={density}
					onDensityChange={setDensity}
					filterQuery={filterQuery}
					setFilterQuery={setFilterQuery}
					filterLabelIds={filterLabelIds}
					setFilterLabelIds={setFilterLabelIds}
					colorBlind={colorBlind}
					setColorBlind={setColorBlind}
					hasActiveFilters={hasActiveFilters}
					onQuickAdd={() => void handleQuickAdd()}
					canQuickAdd={localLists.length > 0}
				/>

				{/* Rendu selon le mode de vue */}
				{view === "table" && (
					<TableView
						cards={filteredCards}
						lists={sortedLists}
						boardId={board._id}
					/>
				)}
				{view === "calendar" && (
					<CalendarView cards={filteredCards} lists={sortedLists} />
				)}
				{view === "timeline" && <TimelineView cards={filteredCards} />}

				{/* Vue Kanban (par défaut) */}
				{view === "kanban" && (
					<DndContext
						sensors={sensors}
						collisionDetection={closestCorners}
						onDragStart={handleDragStart}
						onDragOver={handleDragOver}
						onDragEnd={handleDragEnd}
					>
						<main className="relative z-10 flex-1 overflow-x-auto overflow-y-hidden px-3 pb-24 pt-2">
							<SortableContext
								items={listIds}
								strategy={horizontalListSortingStrategy}
							>
								{/* `pr-3` après la dernière liste = gap droit visuel (style Trello) */}
								<div
									className={`board is-density-${density} flex h-full items-start gap-3 pr-3`}
								>
									{sortedLists.map((list) => (
										<SortableListColumn
											key={list._id}
											list={list}
											cards={filteredCards.filter((c) => c.listId === list._id)}
										/>
									))}
									<AddListColumn
										boardId={board._id}
										hasLists={sortedLists.length > 0}
									/>
								</div>
							</SortableContext>
						</main>

						{/* Overlay visuel pendant le drag */}
						<DragOverlay>
							{activeCard && (
								<div className="rotate-2 opacity-90">
									<CardItem card={activeCard} />
								</div>
							)}
							{activeList && (
								<div className="opacity-90">
									<ListColumn
										list={activeList}
										cards={localCards.filter(
											(c) => c.listId === activeList._id,
										)}
									/>
								</div>
							)}
						</DragOverlay>
					</DndContext>
				)}

				{/* Footer flottant style Trello (Boîte de réception, Agenda, Tableau, Changer) */}
				<BoardFooter view={view} setView={setView} />
			</div>
		</AppShell>
	);
}

// ════════════════════════════════════════════════════════════════
// Sub-header Lume Éclat (Phase 3b) — sticky, 56px, sous le topbar
// ════════════════════════════════════════════════════════════════
function KanbanSubHeader({
	board,
	cardCount,
	subView,
	onSwitchView,
	density,
	onDensityChange,
	filterQuery,
	setFilterQuery,
	filterLabelIds,
	setFilterLabelIds,
	colorBlind,
	setColorBlind,
	hasActiveFilters,
	onQuickAdd,
	canQuickAdd,
}: {
	board: Doc<"boards">;
	cardCount: number;
	subView: SubViewId;
	onSwitchView: (v: SubViewId) => void;
	density: Density;
	onDensityChange: (d: Density) => void;
	filterQuery: string;
	setFilterQuery: (v: string) => void;
	filterLabelIds: Array<Id<"labels">>;
	setFilterLabelIds: (v: Array<Id<"labels">>) => void;
	colorBlind: boolean;
	setColorBlind: (v: boolean) => void;
	hasActiveFilters: boolean;
	onQuickAdd: () => void;
	canQuickAdd: boolean;
}) {
	const toggleStar = useMutation(api.boards.toggleStar);
	const renameBoard = useMutation(api.boards.rename);
	const boardLabels = useQuery(api.labels.listForBoard, { boardId: board._id });
	const members = useQuery(api.boardMembers.listMembers, {
		boardId: board._id,
	});
	const [filterOpen, setFilterOpen] = useState(false);
	const [shareOpen, setShareOpen] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [editingName, setEditingName] = useState(false);
	const [nameDraft, setNameDraft] = useState(board.name);
	useEffect(() => setNameDraft(board.name), [board.name]);
	const starred = board.starred ?? false;
	const memberCount = members?.length ?? 0;
	const filterCount = filterLabelIds.length + (filterQuery.trim() ? 1 : 0);
	const firstInitial = (board.name || "?").charAt(0).toUpperCase();

	async function saveName() {
		const trimmed = nameDraft.trim();
		if (trimmed && trimmed !== board.name) {
			await renameBoard({ boardId: board._id, name: trimmed });
		} else {
			setNameDraft(board.name);
		}
		setEditingName(false);
	}

	const views: Array<{
		id: SubViewId;
		label: string;
		icon: React.ComponentType<{ className?: string }>;
	}> = useMemo(
		() => [
			{ id: "board", label: "Board", icon: Columns3 },
			{ id: "calendar", label: "Calendrier", icon: CalendarIcon },
			{ id: "timeline", label: "Timeline", icon: StretchHorizontal },
			{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
		],
		[],
	);

	return (
		<div className="kb-subhead">
			{/* ── LEFT ── */}
			<div className="kb-subhead-left">
				<span className="kb-board-icon" aria-hidden="true">
					{firstInitial}
				</span>
				{editingName ? (
					<input
						className="kb-board-title-input"
						value={nameDraft}
						onChange={(e) => setNameDraft(e.target.value)}
						onBlur={() => void saveName()}
						onKeyDown={(e) => {
							if (e.key === "Enter") void saveName();
							if (e.key === "Escape") {
								setNameDraft(board.name);
								setEditingName(false);
							}
						}}
						// biome-ignore lint/a11y/noAutofocus: focus immédiat en mode édition
						autoFocus
					/>
				) : (
					<button
						type="button"
						className="kb-board-title kb-board-title--btn"
						title="Renommer le tableau"
						onClick={() => setEditingName(true)}
					>
						{board.name}
					</button>
				)}
				<button
					type="button"
					onClick={() => void toggleStar({ boardId: board._id })}
					className={`kb-star ${starred ? "is-on" : ""}`}
					aria-pressed={starred}
					aria-label={starred ? "Retirer des favoris" : "Marquer comme favori"}
				>
					<Star />
				</button>
				<span className="kb-board-meta">
					{cardCount} {cardCount > 1 ? "cartes" : "carte"}
				</span>
			</div>

			{/* ── CENTER : view switcher ── */}
			<div className="kb-views" role="tablist" aria-label="Mode d'affichage">
				{views.map((v) => {
					const Ico = v.icon;
					const active = subView === v.id;
					return (
						<button
							key={v.id}
							type="button"
							role="tab"
							aria-selected={active}
							className={`kb-view-btn ${active ? "is-active" : ""}`}
							onClick={() => onSwitchView(v.id)}
						>
							<Ico />
							<span>{v.label}</span>
						</button>
					);
				})}
			</div>

			{/* ── RIGHT : density + filters + members + CTA ── */}
			<div className="kb-subhead-right">
				<div
					className="kb-density"
					role="group"
					aria-label="Densité d'affichage"
				>
					<button
						type="button"
						className={`kb-density-btn ${density === "compact" ? "is-active" : ""}`}
						onClick={() => onDensityChange("compact")}
						aria-label="Compact"
						aria-pressed={density === "compact"}
					>
						<ListIcon />
					</button>
					<button
						type="button"
						className={`kb-density-btn ${density === "normal" ? "is-active" : ""}`}
						onClick={() => onDensityChange("normal")}
						aria-label="Normal"
						aria-pressed={density === "normal"}
					>
						<Rows3 />
					</button>
					<button
						type="button"
						className={`kb-density-btn ${density === "detailed" ? "is-active" : ""}`}
						onClick={() => onDensityChange("detailed")}
						aria-label="Détaillé"
						aria-pressed={density === "detailed"}
					>
						<Grid3x3 />
					</button>
				</div>

				<Popover open={filterOpen} onOpenChange={setFilterOpen}>
					<PopoverTrigger asChild>
						<button
							type="button"
							className={`kb-ghost ${hasActiveFilters ? "is-active" : ""}`}
							aria-label="Filtres"
						>
							<Filter />
							<span>Filtres</span>
							{hasActiveFilters && (
								<span className="kb-ghost-count">{filterCount}</span>
							)}
						</button>
					</PopoverTrigger>
					<PopoverContent
						className="w-80 p-3"
						align="end"
						side="bottom"
						sideOffset={8}
					>
						<FilterPopoverContent
							query={filterQuery}
							setQuery={setFilterQuery}
							labelIds={filterLabelIds}
							setLabelIds={setFilterLabelIds}
							boardLabels={boardLabels ?? []}
							colorBlind={colorBlind}
							setColorBlind={setColorBlind}
						/>
					</PopoverContent>
				</Popover>

				{memberCount > 0 && (
					<div className="kb-members">
						{(members ?? []).slice(0, 4).map((m) => (
							<MemberAvatar
								key={m._id}
								name={m.userName}
								size={26}
								title={m.userName}
							/>
						))}
						{memberCount > 4 && (
							<span
								className="kb-member--more"
								title={`+${memberCount - 4} autres membres`}
							>
								+{memberCount - 4}
							</span>
						)}
					</div>
				)}

				<button
					type="button"
					className="kb-ghost"
					onClick={() => setShareOpen(true)}
					aria-label="Partager le tableau"
				>
					<Users />
					<span>Partager</span>
				</button>
				<ShareBoardDialog
					boardId={board._id}
					open={shareOpen}
					onOpenChange={setShareOpen}
				/>

				<Popover open={menuOpen} onOpenChange={setMenuOpen}>
					<PopoverTrigger asChild>
						<button
							type="button"
							className="kb-ghost kb-ghost--icon"
							aria-label="Menu du tableau"
						>
							<MoreHorizontal />
						</button>
					</PopoverTrigger>
					<PopoverContent
						className="w-[360px] overflow-hidden p-0 shadow-xl"
						align="end"
						side="bottom"
						sideOffset={8}
					>
						<BoardMenu board={board} onClose={() => setMenuOpen(false)} />
					</PopoverContent>
				</Popover>

				<button
					type="button"
					className="kb-cta"
					onClick={onQuickAdd}
					disabled={!canQuickAdd}
					title={
						canQuickAdd
							? "Ajouter une carte à la première liste"
							: "Créez d'abord une liste"
					}
				>
					<Plus />
					<span>Carte</span>
				</button>
			</div>
		</div>
	);
}

// Modale Partager : liste membres + invitations pending + inviter par email
