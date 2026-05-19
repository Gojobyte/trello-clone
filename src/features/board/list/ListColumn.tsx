import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation } from "convex/react";
import {
	Archive,
	Copy,
	FileText,
	MoreHorizontal,
	Pencil,
	Plus,
	Trash2,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { Textarea } from "#/components/ui/textarea";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { SortableCardItem } from "../card/CardItem";

export function SortableListColumn({
	list,
	cards,
}: {
	list: Doc<"lists">;
	cards: Array<Doc<"cards">>;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: list._id,
		data: { type: "list" },
	});

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.3 : 1,
	};

	return (
		<div ref={setNodeRef} style={style}>
			<ListColumn
				list={list}
				cards={cards}
				dragHandleProps={{ ...attributes, ...listeners }}
			/>
		</div>
	);
}

type DragHandleProps = {
	attributes?: Record<string, unknown>;
	listeners?: Record<string, unknown>;
} & Record<string, unknown>;

export function ListColumn({
	list,
	cards,
	dragHandleProps,
}: {
	list: Doc<"lists">;
	cards: Array<Doc<"cards">>;
	dragHandleProps?: DragHandleProps;
}) {
	const removeList = useMutation(api.lists.remove);
	const renameList = useMutation(api.lists.rename);
	const archiveList = useMutation(api.lists.archive);
	const duplicateList = useMutation(api.lists.duplicate);
	const createCard = useMutation(api.cards.create);
	const [newCardTitle, setNewCardTitle] = useState("");
	const [addingCard, setAddingCard] = useState(false);
	const [editingTitle, setEditingTitle] = useState(false);
	const [titleDraft, setTitleDraft] = useState(list.name);
	const [menuOpen, setMenuOpen] = useState(false);

	useEffect(() => {
		setTitleDraft(list.name);
	}, [list.name]);

	async function handleAddCard(e: React.FormEvent) {
		e.preventDefault();
		if (!newCardTitle.trim()) return;
		await createCard({ listId: list._id, title: newCardTitle.trim() });
		setNewCardTitle("");
	}

	async function handleSaveTitle() {
		const trimmed = titleDraft.trim();
		if (trimmed && trimmed !== list.name) {
			await renameList({ listId: list._id, name: trimmed });
		} else {
			setTitleDraft(list.name);
		}
		setEditingTitle(false);
	}

	const cardIds = cards.map((c) => c._id);

	return (
		<div className="flex w-[272px] shrink-0 flex-col rounded-lg bg-[var(--ds-background-accent-gray-subtlest)] shadow-[0_1px_1px_#091e4240,0_0_1px_#091e424f]">
			<div
				className="flex cursor-grab items-center gap-1 px-3 pt-2.5 pb-1.5 active:cursor-grabbing"
				{...dragHandleProps}
			>
				{editingTitle ? (
					<input
						value={titleDraft}
						onChange={(e) => setTitleDraft(e.target.value)}
						onBlur={() => void handleSaveTitle()}
						onKeyDown={(e) => {
							if (e.key === "Enter") void handleSaveTitle();
							if (e.key === "Escape") {
								setTitleDraft(list.name);
								setEditingTitle(false);
							}
						}}
						autoFocus
						className="h-7 flex-1 rounded border-0 bg-white px-2 text-sm font-semibold text-gray-900 outline-none ring-2 ring-sky-500"
					/>
				) : (
					<button
						type="button"
						onClick={() => setEditingTitle(true)}
						className="flex-1 truncate rounded px-2 py-1 text-left text-sm font-semibold text-gray-800"
					>
						{list.name}
					</button>
				)}
				<Popover open={menuOpen} onOpenChange={setMenuOpen}>
					<PopoverTrigger asChild>
						<button
							type="button"
							className="rounded p-1.5 text-[#44546f] transition-colors hover:bg-black/10"
							aria-label={`Plus d'actions sur ${list.name}`}
						>
							<MoreHorizontal className="h-4 w-4" />
						</button>
					</PopoverTrigger>
					<PopoverContent className="w-56 p-2" align="end" side="bottom">
						<div className="mb-1 px-2 text-center text-xs font-semibold text-[#44546f]">
							Actions de la liste
						</div>
						<div className="space-y-0.5">
							<QuickActionButton
								icon={<Pencil />}
								onClick={() => {
									setEditingTitle(true);
									setMenuOpen(false);
								}}
							>
								Renommer la liste
							</QuickActionButton>
							<QuickActionButton
								icon={<Plus />}
								onClick={() => {
									setAddingCard(true);
									setMenuOpen(false);
								}}
							>
								Ajouter une carte
							</QuickActionButton>
							<QuickActionButton
								icon={<Copy />}
								onClick={() => {
									void duplicateList({ listId: list._id });
									setMenuOpen(false);
								}}
							>
								Copier la liste
							</QuickActionButton>
							<QuickActionButton
								icon={<Archive />}
								onClick={() => {
									void archiveList({ listId: list._id, archived: true });
									setMenuOpen(false);
								}}
							>
								Archiver la liste
							</QuickActionButton>
							<QuickActionButton
								icon={<Trash2 />}
								onClick={() => {
									if (
										confirm(
											`Supprimer définitivement "${list.name}" et toutes ses cartes ?`,
										)
									) {
										void removeList({ listId: list._id });
									}
									setMenuOpen(false);
								}}
								danger
							>
								Supprimer définitivement
							</QuickActionButton>
						</div>
					</PopoverContent>
				</Popover>
			</div>

			<SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
				<div className="flex max-h-[calc(100vh-15rem)] min-h-[10px] flex-col gap-2 overflow-y-auto px-2 pb-1">
					{cards.map((card) => (
						<SortableCardItem key={card._id} card={card} />
					))}
				</div>
			</SortableContext>

			<div className="p-2">
				{addingCard ? (
					<form
						onSubmit={handleAddCard}
						className="rounded-lg bg-white p-2 shadow-sm"
					>
						<Textarea
							value={newCardTitle}
							onChange={(e) => setNewCardTitle(e.target.value)}
							placeholder="Saisissez un titre ou collez un lien"
							rows={2}
							autoFocus
							className="resize-none border-0 p-1.5 text-sm shadow-none focus-visible:ring-0"
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									void handleAddCard(e as unknown as React.FormEvent);
								}
								if (e.key === "Escape") {
									setAddingCard(false);
									setNewCardTitle("");
								}
							}}
						/>
						<div className="mt-2 flex items-center gap-1">
							<Button
								type="submit"
								size="sm"
								disabled={!newCardTitle.trim()}
								className="bg-[#0c66e4] text-white hover:bg-[#0055cc]"
							>
								Ajouter une carte
							</Button>
							<button
								type="button"
								onClick={() => {
									setAddingCard(false);
									setNewCardTitle("");
								}}
								className="rounded p-1.5 text-gray-600 hover:bg-black/10"
								aria-label="Annuler"
							>
								<X className="h-4 w-4" />
							</button>
						</div>
					</form>
				) : (
					<div className="flex items-stretch gap-1">
						<button
							type="button"
							onClick={() => setAddingCard(true)}
							className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-[#44546f] transition-colors hover:bg-black/10"
						>
							<Plus className="h-4 w-4" />
							Ajouter une carte
						</button>
						<button
							type="button"
							className="rounded-md p-1.5 text-[#44546f] transition-colors hover:bg-black/10"
							aria-label="Créer à partir d'un modèle…"
							title="Créer à partir d'un modèle"
						>
							<FileText className="h-4 w-4" />
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

function QuickActionButton({
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
	const variant = danger
		? "text-[#C9372C] hover:bg-[#FFECEB]"
		: "text-[#172B4D] hover:bg-[#F0F1F2]";
	return (
		<button
			type="button"
			onClick={onClick}
			className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs font-medium transition-colors [&_svg]:h-3.5 [&_svg]:w-3.5 ${variant}`}
		>
			{icon}
			<span>{children}</span>
		</button>
	);
}

export function AddListColumn({
	boardId,
	hasLists,
}: {
	boardId: Id<"boards">;
	hasLists: boolean;
}) {
	const createList = useMutation(api.lists.create);
	const [adding, setAdding] = useState(!hasLists);
	const [name, setName] = useState("");

	async function handleAdd(e: React.FormEvent) {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) return;
		await createList({ boardId, name: trimmed });
		setName("");
		setAdding(false);
	}

	return (
		<div className="w-[272px] shrink-0">
			{adding ? (
				<form
					onSubmit={handleAdd}
					className="rounded-lg bg-[var(--ds-background-accent-gray-subtlest)] p-2 shadow-sm"
				>
					<Input
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Saisissez le nom de la liste..."
						autoFocus
						required
						className="h-8 border-2 border-[#0c66e4] bg-white text-sm focus-visible:ring-0"
						onKeyDown={(e) => {
							if (e.key === "Escape") {
								setAdding(false);
								setName("");
							}
						}}
					/>
					<div className="mt-2 flex items-center gap-1">
						<Button
							type="submit"
							size="sm"
							disabled={!name.trim()}
							className="bg-[#0c66e4] text-white hover:bg-[#0055cc]"
						>
							Ajouter une liste
						</Button>
						<button
							type="button"
							onClick={() => {
								setAdding(false);
								setName("");
							}}
							className="rounded p-1.5 text-gray-600 hover:bg-black/10"
							aria-label="Annuler"
						>
							<X className="h-4 w-4" />
						</button>
					</div>
				</form>
			) : (
				<button
					type="button"
					onClick={() => setAdding(true)}
					className="flex w-full items-center gap-2 rounded-xl bg-white/30 px-3 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/40"
				>
					<Plus className="h-4 w-4" />
					Ajouter une liste
				</button>
			)}
		</div>
	);
}
