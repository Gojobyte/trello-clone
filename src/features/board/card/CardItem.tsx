import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery } from "convex/react";
import {
	AlertCircle,
	AlignLeft,
	Archive,
	ArrowRight,
	CheckCircle2,
	CheckSquare,
	Circle,
	Clock,
	Copy,
	Image as ImageIcon,
	Pencil,
	Tag,
	Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
} from "#/components/ui/popover";
import { Textarea } from "#/components/ui/textarea";
import { gradientFor, photoFor } from "#/lib/board-backgrounds";
import { DUE_DATE_STYLES, labelStyle } from "#/lib/board-constants";
import { dueDateState, formatDueDate } from "#/lib/board-helpers";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import {
	CardDetailModal,
	type CardPanel,
	CoverPanel,
	DatesPanel,
	LabelPicker,
	MovePanel,
} from "./CardDetailModal";
import { CardMemberAvatars } from "./CardMemberAvatars";

export function SortableCardItem({ card }: { card: Doc<"cards"> }) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: card._id,
		data: { type: "card" },
	});

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.3 : 1,
	};

	return (
		<CardItem
			card={card}
			dragRef={setNodeRef}
			dragStyle={style}
			dragAttributes={attributes as unknown as Record<string, unknown>}
			dragListeners={listeners}
		/>
	);
}

export function CardItem({
	card,
	dragRef,
	dragStyle,
	dragAttributes,
	dragListeners,
}: {
	card: Doc<"cards">;
	dragRef?: (el: HTMLElement | null) => void;
	dragStyle?: React.CSSProperties;
	dragAttributes?: Record<string, unknown>;
	dragListeners?: Record<string, unknown>;
}) {
	const updateCard = useMutation(api.cards.update);
	const boardLabels = useQuery(api.labels.listForBoard, {
		boardId: card.boardId,
	});
	const checklistItems = useQuery(api.checklistItems.listForCard, {
		cardId: card._id,
	});

	const [showDetail, setShowDetail] = useState(false);
	const [showQuickEdit, setShowQuickEdit] = useState(false);
	const [titleDraft, setTitleDraft] = useState(card.title);

	useEffect(() => {
		setTitleDraft(card.title);
	}, [card.title]);

	async function handleToggleCompleted(e: React.MouseEvent) {
		e.stopPropagation();
		await updateCard({ cardId: card._id, completed: !card.completed });
	}

	async function saveTitleInline() {
		const t = titleDraft.trim();
		if (t && t !== card.title) {
			await updateCard({ cardId: card._id, title: t });
		} else {
			setTitleDraft(card.title);
		}
	}

	const attachedLabels = (boardLabels ?? []).filter((l) =>
		card.labelIds?.includes(l._id),
	);
	const hasDescription = Boolean(card.description);
	const totalItems = checklistItems?.length ?? 0;
	const checkedItems = checklistItems?.filter((i) => i.checked).length ?? 0;
	const hasChecklist = totalItems > 0;
	const completed = card.completed ?? false;
	const coverPhoto = card.coverImage ? photoFor(card.coverImage) : undefined;
	const hasCover = Boolean(card.coverColor || coverPhoto);

	// Aging — carte créée il y a >5j et non terminée. Convex expose
	// _creationTime automatiquement ; on n'a pas de `lastActivity` pour
	// l'instant (TODO : tracker l'activité côté backend).
	const AGING_THRESHOLD_MS = 5 * 24 * 60 * 60 * 1000;
	const isAging =
		!completed &&
		!card.archived &&
		Date.now() - card._creationTime > AGING_THRESHOLD_MS;

	const checklistPct =
		totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

	return (
		<>
			<Popover
				open={showQuickEdit}
				onOpenChange={(open) => {
					if (!open) void saveTitleInline();
					setShowQuickEdit(open);
				}}
			>
				<PopoverAnchor asChild>
					<div
						ref={dragRef}
						style={dragStyle}
						{...dragAttributes}
						{...dragListeners}
						onClick={() => {
							if (!showQuickEdit) setShowDetail(true);
						}}
						onKeyDown={(e) => {
							if ((e.key === "Enter" || e.key === " ") && !showQuickEdit) {
								e.preventDefault();
								setShowDetail(true);
							}
						}}
						role="button"
						tabIndex={0}
						className={`kcard kb-card group relative cursor-pointer overflow-hidden rounded-lg bg-white shadow-[0_1px_1px_#091e4240,0_0_1px_#091e424f] transition-shadow hover:shadow-[0_4px_8px_-2px_#091e4240,0_0_1px_#091e424f] ${isAging ? "is-aging" : ""}`}
					>
						{hasCover && (
							<div
								className={`kcard-cover h-20 w-full ${card.coverColor ? `bg-gradient-to-br ${gradientFor(card.coverColor)}` : ""}`}
								style={
									coverPhoto
										? {
												backgroundImage: `url('${coverPhoto.thumbnail}')`,
												backgroundSize: "cover",
												backgroundPosition: "center",
											}
										: undefined
								}
							/>
						)}

						<div className="px-3 py-2">
							{attachedLabels.length > 0 && (
								<div className="kcard-labels-row mb-1.5 flex flex-wrap gap-1">
									{attachedLabels.map((label) => {
										const s = labelStyle(label.color);
										return (
											<span
												key={label._id}
												data-label-color={label.color}
												className={`inline-flex h-5 max-w-[160px] items-center truncate rounded-[3px] px-2 text-[12px] font-medium ${s.bg} ${s.fg}`}
												title={label.text ?? label.color}
											>
												{label.text ?? ""}
											</span>
										);
									})}
								</div>
							)}

							<div className="flex items-start gap-1.5">
								<button
									type="button"
									onClick={(e) => void handleToggleCompleted(e)}
									className={`mt-0.5 shrink-0 rounded-full transition-opacity ${
										completed
											? "opacity-100"
											: "opacity-0 group-hover:opacity-100"
									}`}
									aria-label={
										completed
											? "Marquer comme inachevée"
											: "Marquer comme terminée"
									}
								>
									{completed ? (
										<CheckCircle2 className="h-4 w-4 text-[#22A06B]" />
									) : (
										<Circle className="h-4 w-4 text-[#6B6E76]" />
									)}
								</button>
								{showQuickEdit ? (
									<Textarea
										value={titleDraft}
										onChange={(e) => setTitleDraft(e.target.value)}
										onClick={(e) => e.stopPropagation()}
										onKeyDown={(e) => {
											if (e.key === "Enter" && !e.shiftKey) {
												e.preventDefault();
												void saveTitleInline();
												setShowQuickEdit(false);
											}
											if (e.key === "Escape") {
												setTitleDraft(card.title);
												setShowQuickEdit(false);
											}
										}}
										// biome-ignore lint/a11y/noAutofocus: focus immédiat en mode édition rapide
										autoFocus
										rows={2}
										className={`kcard-title flex-1 resize-none border-0 bg-transparent p-0 text-sm font-medium text-[#172b4d] shadow-none focus-visible:ring-0 ${completed ? "line-through opacity-60" : ""}`}
									/>
								) : (
									<span
										className={`kcard-title block flex-1 text-left text-sm text-[#172B4D] ${
											completed ? "line-through opacity-60" : ""
										}`}
									>
										{card.title}
									</span>
								)}
							</div>

							{hasDescription && (
								<p className="kcard-desc">{card.description}</p>
							)}

							{(hasDescription ||
								hasChecklist ||
								card.dueDate ||
								(card.memberIds?.length ?? 0) > 0) && (
								<div className="kcard-meta-row mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#6B6E76]">
									{card.dueDate &&
										(() => {
											const state = dueDateState(
												card.dueDate,
												card.dueDateCompleted ?? false,
											);
											const style = DUE_DATE_STYLES[state];
											const Icon =
												state === "completed"
													? CheckCircle2
													: state === "overdue"
														? AlertCircle
														: Clock;
											return (
												<button
													type="button"
													onClick={(e) => {
														e.preventDefault();
														e.stopPropagation();
														void updateCard({
															cardId: card._id,
															dueDateCompleted: !(
																card.dueDateCompleted ?? false
															),
														});
													}}
													className={`inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5 text-[11px] font-semibold transition-colors hover:brightness-95 ${style.bg} ${style.fg}`}
													title={`${new Date(card.dueDate).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}\nCliquer pour ${card.dueDateCompleted ? "marquer comme non terminée" : "marquer comme terminée"}`}
													aria-label="Modifier l'état d'échéance"
												>
													<Icon className="h-3 w-3 shrink-0" />
													<span>{formatDueDate(card.dueDate)}</span>
												</button>
											);
										})()}
									{hasDescription && (
										<span title="Cette carte a une description">
											<AlignLeft className="h-3.5 w-3.5" />
										</span>
									)}
									{hasChecklist && (
										<span
											className={`inline-flex items-center gap-1 ${
												checkedItems === totalItems
													? "rounded bg-[#DCFFF1] px-1 text-[#216E4E]"
													: ""
											}`}
											title="Checklist"
										>
											<CheckSquare className="h-3.5 w-3.5" />
											<span>
												{checkedItems}/{totalItems}
											</span>
										</span>
									)}
									{(card.memberIds?.length ?? 0) > 0 && (
										<CardMemberAvatars
											boardId={card.boardId}
											memberIds={card.memberIds ?? []}
										/>
									)}
								</div>
							)}

							{hasChecklist && (
								<div
									className="kcard-checkbar"
									style={{ "--p": `${checklistPct}%` } as React.CSSProperties}
									aria-hidden="true"
								>
									<span />
								</div>
							)}
						</div>

						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								setShowQuickEdit(true);
							}}
							onPointerDown={(e) => {
								e.stopPropagation();
							}}
							className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded bg-white/90 text-[#6B6E76] opacity-0 shadow-sm transition-opacity hover:bg-white hover:text-[#172B4D] group-hover:opacity-100"
							aria-label="Modifier la carte"
						>
							<Pencil className="h-3 w-3" />
						</button>
					</div>
				</PopoverAnchor>
				<PopoverContent
					side="right"
					align="start"
					sideOffset={8}
					onOpenAutoFocus={(e) => e.preventDefault()}
					className="w-52 rounded-lg border border-[#091e4224] bg-transparent p-0 shadow-none"
				>
					<QuickEditPanel
						card={card}
						onClose={() => setShowQuickEdit(false)}
						onOpenDetail={() => {
							setShowQuickEdit(false);
							setShowDetail(true);
						}}
					/>
				</PopoverContent>
			</Popover>

			<CardDetailModal
				card={card}
				open={showDetail}
				onOpenChange={setShowDetail}
			/>
		</>
	);
}

function QuickEditPanel({
	card,
	onClose,
	onOpenDetail,
}: {
	card: Doc<"cards">;
	onClose: () => void;
	onOpenDetail: () => void;
}) {
	const updateCard = useMutation(api.cards.update);
	const removeCard = useMutation(api.cards.remove);
	const duplicateCard = useMutation(api.cards.duplicate);
	const moveCard = useMutation(api.cards.moveToList);
	const boardData = useQuery(api.boards.get, { boardId: card.boardId });

	const [activeSubPanel, setActiveSubPanel] = useState<CardPanel>(null);

	async function handleArchive() {
		await updateCard({ cardId: card._id, archived: true });
		onClose();
	}

	async function handleMove(listId: Id<"lists">) {
		if (listId === card.listId) {
			setActiveSubPanel(null);
			return;
		}
		await moveCard({ cardId: card._id, listId });
		setActiveSubPanel(null);
		onClose();
	}

	async function handleDelete() {
		if (confirm(`Supprimer définitivement la carte "${card.title}" ?`)) {
			await removeCard({ cardId: card._id });
			onClose();
		}
	}

	async function handleDuplicate() {
		await duplicateCard({ cardId: card._id });
		onClose();
	}

	return (
		<div className="w-52">
			<aside className="space-y-1">
				{activeSubPanel === null && (
					<>
						<TabActionButton icon={<Pencil />} onClick={onOpenDetail}>
							Ouvrir la carte
						</TabActionButton>
						<TabActionButton
							icon={<Tag />}
							onClick={() => setActiveSubPanel("labels")}
						>
							Étiquettes
						</TabActionButton>
						<TabActionButton
							icon={<Clock />}
							onClick={() => setActiveSubPanel("dates")}
						>
							Dates
						</TabActionButton>
						<TabActionButton
							icon={<ImageIcon />}
							onClick={() => setActiveSubPanel("cover")}
						>
							Couverture
						</TabActionButton>
						<TabActionButton
							icon={<ArrowRight />}
							onClick={() => setActiveSubPanel("move")}
						>
							Déplacer
						</TabActionButton>
						<TabActionButton
							icon={<Copy />}
							onClick={() => void handleDuplicate()}
						>
							Copier la carte
						</TabActionButton>
						<TabActionButton
							icon={<Archive />}
							onClick={() => void handleArchive()}
						>
							Archiver
						</TabActionButton>
						<TabActionButton
							icon={<Trash2 />}
							onClick={() => void handleDelete()}
							danger
						>
							Supprimer
						</TabActionButton>
					</>
				)}

				{activeSubPanel === "labels" && (
					<LabelPicker
						boardId={card.boardId}
						cardId={card._id}
						attachedIds={card.labelIds ?? []}
						onClose={() => setActiveSubPanel(null)}
					/>
				)}
				{activeSubPanel === "dates" && (
					<DatesPanel card={card} onClose={() => setActiveSubPanel(null)} />
				)}
				{activeSubPanel === "cover" && (
					<CoverPanel card={card} onClose={() => setActiveSubPanel(null)} />
				)}
				{activeSubPanel === "move" && (
					<MovePanel
						lists={boardData?.lists ?? []}
						currentListId={card.listId}
						onMove={(id) => void handleMove(id)}
						onClose={() => setActiveSubPanel(null)}
					/>
				)}
			</aside>
		</div>
	);
}

function TabActionButton({
	icon,
	children,
	onClick,
	danger = false,
}: {
	icon: React.ReactNode;
	children: React.ReactNode;
	onClick: () => void;
	danger?: boolean;
}) {
	const colors = danger
		? "bg-white text-[#C9372C] hover:bg-[#FFECEB]"
		: "bg-white text-[#172b4d] hover:bg-[#091e4214]";
	return (
		<button
			type="button"
			onClick={onClick}
			className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs font-medium shadow-[0_1px_1px_#091e4240,0_0_1px_#091e424f] transition-colors [&_svg]:h-3.5 [&_svg]:w-3.5 ${colors}`}
		>
			{icon}
			<span>{children}</span>
		</button>
	);
}
