import { useMutation, useQuery } from "convex/react";
import {
	Archive,
	CheckCircle2,
	ChevronDown,
	Circle,
	Copy,
	Pencil,
} from "lucide-react";
import {
	type KeyboardEvent as ReactKeyboardEvent,
	type MouseEvent as ReactMouseEvent,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { dueDateState, formatDueDate } from "#/lib/board-helpers";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { CardDetailModal } from "../card/CardDetailModal";
import { MemberAvatar } from "../shared/MemberAvatar";

type SortKey = "title" | "list" | "dueDate";
type SortDir = "asc" | "desc";
type GroupBy = "none" | "status";

// Couleur du swatch d'étiquette — mapping des couleurs Trello vers la palette
// Lume (accents amber, blue, teal, red). Utilisé pour le point sur la chip.
const LABEL_SWATCH: Record<string, string> = {
	green: "var(--teal-400)",
	yellow: "var(--amber-200)",
	orange: "var(--amber-400)",
	red: "var(--ember-400)",
	purple: "var(--plum-500)",
	sky: "var(--teal-500)",
	lime: "var(--amber-300)",
	pink: "var(--rose-400)",
};

// Vue Tableau — toutes les cartes du board en table dense (style Lume Éclat)
// Header sticky, première colonne pinned, édition inline du titre, group by status.
export function TableView({
	cards,
	lists,
	boardId,
}: {
	cards: Array<Doc<"cards">>;
	lists: Array<Doc<"lists">>;
	boardId: Id<"boards">;
}) {
	const boardLabels = useQuery(api.labels.listForBoard, { boardId });
	const boardMembers = useQuery(api.boardMembers.listMembers, { boardId });
	const updateCard = useMutation(api.cards.update);
	const duplicateCard = useMutation(api.cards.duplicate);
	const removeCard = useMutation(api.cards.remove);

	const [openCardId, setOpenCardId] = useState<Id<"cards"> | null>(null);
	const [sortKey, setSortKey] = useState<SortKey>("title");
	const [sortDir, setSortDir] = useState<SortDir>("asc");
	const [groupBy, setGroupBy] = useState<GroupBy>("none");
	const [editingId, setEditingId] = useState<Id<"cards"> | null>(null);
	const [editingValue, setEditingValue] = useState("");
	const [scrolled, setScrolled] = useState(false);
	const scrollRef = useRef<HTMLDivElement | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);

	// Index O(1) pour lookup des relations
	const listById = useMemo(
		() => new Map(lists.map((l) => [l._id, l])),
		[lists],
	);
	const labelById = useMemo(
		() => new Map((boardLabels ?? []).map((l) => [l._id, l])),
		[boardLabels],
	);
	const memberByUserId = useMemo(
		() => new Map((boardMembers ?? []).map((m) => [m.userId, m])),
		[boardMembers],
	);

	// Tri principal
	const sorted = useMemo(() => {
		const arr = [...cards];
		arr.sort((a, b) => {
			let cmp = 0;
			if (sortKey === "title") cmp = a.title.localeCompare(b.title);
			else if (sortKey === "list")
				cmp = (listById.get(a.listId)?.name ?? "").localeCompare(
					listById.get(b.listId)?.name ?? "",
				);
			else if (sortKey === "dueDate")
				cmp =
					(a.dueDate ?? Number.POSITIVE_INFINITY) -
					(b.dueDate ?? Number.POSITIVE_INFINITY);
			return sortDir === "asc" ? cmp : -cmp;
		});
		return arr;
	}, [cards, sortKey, sortDir, listById]);

	// Groupage par liste (équivalent du "status" du prototype Lume)
	const groups = useMemo(() => {
		if (groupBy === "none") {
			return [{ key: "all", name: "", cards: sorted }];
		}
		const byList = new Map<string, Array<Doc<"cards">>>();
		for (const c of sorted) {
			const arr = byList.get(c.listId) ?? [];
			arr.push(c);
			byList.set(c.listId, arr);
		}
		// Préserve l'ordre des listes du board
		return lists
			.filter((l) => byList.has(l._id))
			.map((l) => ({
				key: l._id,
				name: l.name,
				cards: byList.get(l._id) ?? [],
			}));
	}, [sorted, groupBy, lists]);

	// Auto-focus l'input d'édition inline
	useEffect(() => {
		if (editingId && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [editingId]);

	// Détecte le scroll horizontal pour afficher l'ombre de la colonne pinned
	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		const onScroll = () => setScrolled(el.scrollLeft > 4);
		el.addEventListener("scroll", onScroll, { passive: true });
		return () => el.removeEventListener("scroll", onScroll);
	}, []);

	function toggleSort(key: SortKey) {
		if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
		else {
			setSortKey(key);
			setSortDir("asc");
		}
	}

	function startEdit(card: Doc<"cards">, e: ReactMouseEvent) {
		e.stopPropagation();
		setEditingId(card._id);
		setEditingValue(card.title);
	}

	async function commitEdit() {
		if (!editingId) return;
		const next = editingValue.trim();
		const original = cards.find((c) => c._id === editingId);
		setEditingId(null);
		if (!original || next === "" || next === original.title) return;
		try {
			await updateCard({ cardId: editingId, title: next });
		} catch (err) {
			console.error("Failed to update card title", err);
		}
	}

	function cancelEdit() {
		setEditingId(null);
	}

	function onEditKey(e: ReactKeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter") {
			e.preventDefault();
			void commitEdit();
		} else if (e.key === "Escape") {
			e.preventDefault();
			cancelEdit();
		}
	}

	const openCard = openCardId ? cards.find((c) => c._id === openCardId) : null;

	function sortIndicatorClass(key: SortKey) {
		if (sortKey !== key) return "";
		return sortDir === "asc" ? "is-sorted" : "is-sorted is-sorted-desc";
	}

	// Couleur du dot du group header (basée sur l'index pour rester déterministe)
	function groupSwatch(key: string) {
		if (key === "all") return "var(--accent)";
		const idx = lists.findIndex((l) => l._id === key);
		const palette = [
			"var(--amber-300)",
			"var(--teal-400)",
			"var(--plum-500)",
			"var(--ember-400)",
			"var(--rose-400)",
		];
		return palette[idx >= 0 ? idx % palette.length : 0];
	}

	const totalCards = cards.length;

	return (
		<main className="relative z-10 flex flex-1 flex-col overflow-hidden">
			<div className="table-wrap">
				<div className="table-wrap-head">
					<h2 className="table-wrap-title">
						<span>
							{totalCards} <em>carte{totalCards > 1 ? "s" : ""}</em>
						</span>
						<span className="table-wrap-meta">
							{groupBy === "none" ? "non groupé" : "groupé · statut"}
						</span>
					</h2>
					<fieldset className="tbl-grp-toggle" aria-label="Grouper par">
						<button
							type="button"
							className={groupBy === "none" ? "is-active" : ""}
							onClick={() => setGroupBy("none")}
						>
							Aucun
						</button>
						<button
							type="button"
							className={groupBy === "status" ? "is-active" : ""}
							onClick={() => setGroupBy("status")}
						>
							Statut
						</button>
					</fieldset>
				</div>

				<div
					ref={scrollRef}
					className={`table-scroll${scrolled ? " is-scrolled" : ""}`}
				>
					<table className="tbl">
						<thead>
							<tr>
								<th
									className={`pinned is-sortable ${sortIndicatorClass("title")}`}
									onClick={() => toggleSort("title")}
									onKeyDown={(e) => {
										if (e.key === "Enter") toggleSort("title");
									}}
								>
									<span className="th-inner">
										Tâche
										<ChevronDown className="sort-ind" strokeWidth={2.5} />
									</span>
									<span className="resize" aria-hidden="true" />
								</th>
								<th
									className={`is-sortable ${sortIndicatorClass("list")}`}
									onClick={() => toggleSort("list")}
									onKeyDown={(e) => {
										if (e.key === "Enter") toggleSort("list");
									}}
								>
									<span className="th-inner">
										Statut
										<ChevronDown className="sort-ind" strokeWidth={2.5} />
									</span>
									<span className="resize" aria-hidden="true" />
								</th>
								<th>
									<span className="th-inner">Assignés</span>
									<span className="resize" aria-hidden="true" />
								</th>
								<th>
									<span className="th-inner">Étiquettes</span>
									<span className="resize" aria-hidden="true" />
								</th>
								<th
									className={`is-sortable ${sortIndicatorClass("dueDate")}`}
									onClick={() => toggleSort("dueDate")}
									onKeyDown={(e) => {
										if (e.key === "Enter") toggleSort("dueDate");
									}}
								>
									<span className="th-inner">
										Échéance
										<ChevronDown className="sort-ind" strokeWidth={2.5} />
									</span>
									<span className="resize" aria-hidden="true" />
								</th>
								<th>
									<span className="th-inner">Priorité</span>
								</th>
							</tr>
						</thead>
						<tbody>
							{totalCards === 0 && (
								<tr className="tbl-empty">
									<td colSpan={6}>
										<span className="icon">·</span>
										Aucune carte à afficher.
									</td>
								</tr>
							)}

							{groups.map((group) => (
								<GroupSection
									key={group.key}
									group={group}
									showHeader={groupBy !== "none"}
									swatch={groupSwatch(group.key)}
									listById={listById}
									labelById={labelById}
									memberByUserId={memberByUserId}
									editingId={editingId}
									editingValue={editingValue}
									setEditingValue={setEditingValue}
									inputRef={inputRef}
									onTitleClick={startEdit}
									onCommit={() => {
										void commitEdit();
									}}
									onEditKey={onEditKey}
									onOpen={(id) => setOpenCardId(id)}
									onToggleDone={(card) => {
										void updateCard({
											cardId: card._id,
											completed: !card.completed,
										});
									}}
									onDuplicate={(card) => {
										void duplicateCard({ cardId: card._id });
									}}
									onArchive={(card) => {
										void removeCard({ cardId: card._id });
									}}
								/>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{openCard && (
				<CardDetailModal
					card={openCard}
					open={openCardId !== null}
					onOpenChange={(open) => {
						if (!open) setOpenCardId(null);
					}}
				/>
			)}
		</main>
	);
}

// ──────────────────────────────────────────────────────────────
// Section d'un groupe (header eyebrow + rangées)
// ──────────────────────────────────────────────────────────────
type Group = {
	key: string;
	name: string;
	cards: Array<Doc<"cards">>;
};

type BoardMember = NonNullable<
	ReturnType<typeof useQuery<typeof api.boardMembers.listMembers>>
>[number];

function GroupSection({
	group,
	showHeader,
	swatch,
	listById,
	labelById,
	memberByUserId,
	editingId,
	editingValue,
	setEditingValue,
	inputRef,
	onTitleClick,
	onCommit,
	onEditKey,
	onOpen,
	onToggleDone,
	onDuplicate,
	onArchive,
}: {
	group: Group;
	showHeader: boolean;
	swatch: string;
	listById: Map<Id<"lists">, Doc<"lists">>;
	labelById: Map<Id<"labels">, Doc<"labels">>;
	memberByUserId: Map<string, BoardMember>;
	editingId: Id<"cards"> | null;
	editingValue: string;
	setEditingValue: (v: string) => void;
	inputRef: React.RefObject<HTMLInputElement | null>;
	onTitleClick: (card: Doc<"cards">, e: ReactMouseEvent) => void;
	onCommit: () => void;
	onEditKey: (e: ReactKeyboardEvent<HTMLInputElement>) => void;
	onOpen: (id: Id<"cards">) => void;
	onToggleDone: (card: Doc<"cards">) => void;
	onDuplicate: (card: Doc<"cards">) => void;
	onArchive: (card: Doc<"cards">) => void;
}) {
	return (
		<>
			{showHeader && (
				<tr className="tbl-group-head">
					<td colSpan={6}>
						<span className="grp">
							<span className="grp-dot" style={{ background: swatch }} />
							<span className="grp-label">{group.name || "—"}</span>
							<span className="grp-count">
								{group.cards.length} carte
								{group.cards.length > 1 ? "s" : ""}
							</span>
						</span>
					</td>
				</tr>
			)}
			{group.cards.map((card) => {
				const list = listById.get(card.listId);
				const isEditing = editingId === card._id;
				const dueState = card.dueDate
					? dueDateState(card.dueDate, card.dueDateCompleted ?? false)
					: null;
				const assigned = (card.memberIds ?? [])
					.map((id) => memberByUserId.get(id))
					.filter((m): m is BoardMember => Boolean(m));
				const visibleLabels = (card.labelIds ?? [])
					.map((id) => labelById.get(id))
					.filter((l): l is Doc<"labels"> => Boolean(l));
				const labelsShown = visibleLabels.slice(0, 2);
				const labelsExtra = visibleLabels.length - labelsShown.length;

				return (
					<tr
						key={card._id}
						className={card.completed ? "is-done" : ""}
						onClick={() => {
							if (!isEditing) onOpen(card._id);
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !isEditing) onOpen(card._id);
						}}
					>
						{/* Title (pinned) */}
						<td className="pinned title-cell">
							<div className="title-inner">
								<button
									type="button"
									className="row-status-icon-btn"
									onClick={(e) => {
										e.stopPropagation();
										onToggleDone(card);
									}}
									aria-label={
										card.completed
											? "Marquer comme non terminé"
											: "Marquer comme terminé"
									}
									style={{
										background: "transparent",
										border: "none",
										padding: 0,
										cursor: "pointer",
										display: "inline-flex",
									}}
								>
									{card.completed ? (
										<CheckCircle2 className="row-status-icon is-done" />
									) : (
										<Circle className="row-status-icon" />
									)}
								</button>
								{isEditing ? (
									<input
										ref={inputRef}
										className="row-title-input"
										value={editingValue}
										onChange={(e) => setEditingValue(e.target.value)}
										onBlur={onCommit}
										onKeyDown={onEditKey}
										onClick={(e) => e.stopPropagation()}
									/>
								) : (
									<button
										type="button"
										className="row-title"
										onClick={(e) => onTitleClick(card, e)}
										title={card.title}
									>
										{card.title}
									</button>
								)}
							</div>

							{/* Actions hover */}
							{!isEditing && (
								<div className="row-actions">
									<button
										type="button"
										title="Éditer"
										aria-label="Éditer"
										onClick={(e) => onTitleClick(card, e)}
									>
										<Pencil />
									</button>
									<button
										type="button"
										title="Dupliquer"
										aria-label="Dupliquer"
										onClick={(e) => {
											e.stopPropagation();
											onDuplicate(card);
										}}
									>
										<Copy />
									</button>
									<button
										type="button"
										title="Archiver"
										aria-label="Archiver"
										onClick={(e) => {
											e.stopPropagation();
											onArchive(card);
										}}
									>
										<Archive />
									</button>
								</div>
							)}
						</td>

						{/* Status (list pill) */}
						<td>
							<span className="status-pill">
								<span className="dot" />
								{list?.name ?? "—"}
							</span>
						</td>

						{/* Assignees */}
						<td>
							{assigned.length === 0 ? (
								<span className="assignee-empty">—</span>
							) : (
								<span className="assignee-stack">
									{assigned.slice(0, 3).map((m) => (
										<MemberAvatar
											key={m._id}
											name={m.userName}
											size={22}
											ring
										/>
									))}
									{assigned.length > 3 && (
										<span className="av-more">+{assigned.length - 3}</span>
									)}
								</span>
							)}
						</td>

						{/* Labels */}
						<td>
							{labelsShown.length === 0 ? (
								<span className="cell-empty">—</span>
							) : (
								<span className="labels-cell">
									{labelsShown.map((l) => (
										<span
											key={l._id}
											className="lbl"
											style={
												{
													"--lbl-c": LABEL_SWATCH[l.color] ?? "var(--accent)",
												} as React.CSSProperties
											}
										>
											{l.text || l.color}
										</span>
									))}
									{labelsExtra > 0 && (
										<span className="lbl-more">+{labelsExtra}</span>
									)}
								</span>
							)}
						</td>

						{/* Due */}
						<td>
							{card.dueDate && dueState ? (
								<span className={`due-cell is-${dueState}`}>
									{formatDueDate(card.dueDate)}
								</span>
							) : (
								<span className="cell-empty">—</span>
							)}
						</td>

						{/* Priority — placeholder car non présent dans le schéma actuel */}
						<td>
							<span className="prio-cell is-medium">
								<span className="dot" />
								Normale
							</span>
						</td>
					</tr>
				);
			})}
		</>
	);
}
