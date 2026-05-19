import { useMutation, useQuery } from "convex/react";
import { fr } from "date-fns/locale";
import {
	AlignLeft,
	Archive,
	ArrowRight,
	CheckCircle2,
	CheckSquare,
	Circle,
	Clock,
	Copy,
	History,
	Image as ImageIcon,
	MessageSquare,
	Paperclip,
	Tag,
	Trash2,
	Users,
	X,
} from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import { Calendar } from "#/components/ui/calendar";
import { Dialog, DialogContent } from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import {
	BOARD_GRADIENTS,
	BOARD_PHOTOS,
	gradientFor,
	photoFor,
} from "#/lib/board-backgrounds";
import { LABEL_COLORS, actionLabel, labelStyle } from "#/lib/board-constants";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { MemberAvatar } from "../shared/MemberAvatar";

export type CardPanel = "labels" | "dates" | "cover" | "move" | "members" | null;

export function CardDetailModal({
	card,
	open,
	onOpenChange,
}: {
	card: Doc<"cards">;
	open: boolean;
	onOpenChange: (v: boolean) => void;
}) {
	const updateCard = useMutation(api.cards.update);
	const removeCard = useMutation(api.cards.remove);
	const moveCard = useMutation(api.cards.moveToList);
	const duplicateCard = useMutation(api.cards.duplicate);
	const generateUploadUrl = useMutation(api.attachments.generateUploadUrl);
	const addAttachment = useMutation(api.attachments.add);
	const removeAttachment = useMutation(api.attachments.remove);
	const attachments = useQuery(api.attachments.listForCard, {
		cardId: card._id,
	});
	const activityItems = useQuery(api.activity.listForCard, {
		cardId: card._id,
	});
	const boardData = useQuery(api.boards.get, { boardId: card.boardId });
	const boardLabels = useQuery(api.labels.listForBoard, {
		boardId: card.boardId,
	});
	const detachLabel = useMutation(api.labels.detach);
	const items = useQuery(api.checklistItems.listForCard, { cardId: card._id });
	const addItem = useMutation(api.checklistItems.add);
	const toggleItem = useMutation(api.checklistItems.toggle);
	const removeItem = useMutation(api.checklistItems.remove);

	const [title, setTitle] = useState(card.title);
	const [editingTitle, setEditingTitle] = useState(false);
	const [description, setDescription] = useState(card.description ?? "");
	const [editingDesc, setEditingDesc] = useState(false);
	const [newItemText, setNewItemText] = useState("");
	const [activePanel, setActivePanel] = useState<CardPanel>(null);

	useEffect(() => {
		setTitle(card.title);
		setDescription(card.description ?? "");
	}, [card]);

	const lists = boardData?.lists ?? [];
	const currentList = lists.find((l) => l._id === card.listId);
	const attachedLabels = (boardLabels ?? []).filter((l) =>
		card.labelIds?.includes(l._id),
	);
	const checklist = items ?? [];
	const checkedCount = checklist.filter((c) => c.checked).length;
	const totalCount = checklist.length;
	const completed = card.completed ?? false;
	const coverPhoto = card.coverImage ? photoFor(card.coverImage) : undefined;

	async function saveTitle() {
		const t = title.trim();
		if (t && t !== card.title) {
			await updateCard({ cardId: card._id, title: t });
		} else {
			setTitle(card.title);
		}
		setEditingTitle(false);
	}

	async function saveDescription() {
		const d = description.trim();
		if (d !== (card.description ?? "")) {
			await updateCard({ cardId: card._id, description: d });
		}
		setEditingDesc(false);
	}

	async function handleAddItem(e: React.FormEvent) {
		e.preventDefault();
		const t = newItemText.trim();
		if (!t) return;
		await addItem({ cardId: card._id, text: t });
		setNewItemText("");
	}

	async function handleArchive() {
		await updateCard({ cardId: card._id, archived: true });
		onOpenChange(false);
	}

	async function handleDeleteCard() {
		if (confirm(`Supprimer définitivement la carte "${card.title}" ?`)) {
			await removeCard({ cardId: card._id });
			onOpenChange(false);
		}
	}

	async function handleMove(listId: Id<"lists">) {
		if (listId === card.listId) return;
		await moveCard({ cardId: card._id, listId });
		setActivePanel(null);
	}

	async function handleDuplicate() {
		await duplicateCard({ cardId: card._id });
		onOpenChange(false);
	}

	async function handleUploadFile(file: File) {
		try {
			const uploadUrl = await generateUploadUrl();
			const response = await fetch(uploadUrl, {
				method: "POST",
				headers: file.type ? { "Content-Type": file.type } : {},
				body: file,
			});
			if (!response.ok) {
				throw new Error(`Upload failed: ${response.status}`);
			}
			const { storageId } = (await response.json()) as {
				storageId: Id<"_storage">;
			};
			await addAttachment({
				cardId: card._id,
				storageId,
				name: file.name,
				contentType: file.type || undefined,
				size: file.size,
			});
		} catch (err) {
			console.error("Erreur d'upload :", err);
			alert("Échec de l'upload du fichier.");
		}
	}

	const createdAt = new Date(card._creationTime).toLocaleDateString("fr-FR", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-3xl">
				{(card.coverColor || coverPhoto) && (
					<div
						className={`relative h-32 w-full ${card.coverColor ? `bg-gradient-to-br ${gradientFor(card.coverColor)}` : ""}`}
						style={
							coverPhoto
								? {
										backgroundImage: `url('${coverPhoto.url}')`,
										backgroundSize: "cover",
										backgroundPosition: "center",
									}
								: undefined
						}
					/>
				)}

				<div className="px-6 pt-5">
					<div className="flex items-start gap-3 pr-6">
						<button
							type="button"
							onClick={() =>
								void updateCard({ cardId: card._id, completed: !completed })
							}
							className="mt-1.5 shrink-0"
							aria-label={
								completed
									? "Marquer comme inachevée"
									: "Marquer comme terminée"
							}
						>
							{completed ? (
								<CheckCircle2 className="h-5 w-5 text-[#22A06B]" />
							) : (
								<Circle className="h-5 w-5 text-[#6B6E76]" />
							)}
						</button>
						<div className="flex-1">
							{editingTitle ? (
								<input
									type="text"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									onBlur={() => void saveTitle()}
									onKeyDown={(e) => {
										if (e.key === "Enter") void saveTitle();
										if (e.key === "Escape") {
											setTitle(card.title);
											setEditingTitle(false);
										}
									}}
									// biome-ignore lint/a11y/noAutofocus: clic-pour-éditer Trello-like
									autoFocus
									className="w-full rounded border border-[#0c66e4] px-2 py-1 text-lg font-semibold text-[#172B4D] outline-none"
								/>
							) : (
								<button
									type="button"
									onClick={() => setEditingTitle(true)}
									className={`block w-full rounded px-2 py-1 text-left text-lg font-semibold text-[#172B4D] hover:bg-[#F0F1F2] ${completed ? "line-through opacity-60" : ""}`}
								>
									{card.title}
								</button>
							)}
							{currentList && (
								<p className="mt-1 px-2 text-xs text-[#6B6E76]">
									Dans la liste{" "}
									<span className="font-medium text-[#172B4D] underline">
										{currentList.name}
									</span>
								</p>
							)}
							<p className="mt-0.5 px-2 text-[10px] text-[#6B6E76]">
								Créée le {createdAt}
							</p>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-6 px-6 pb-6 pt-4 md:grid-cols-[1fr_200px]">
					<div className="space-y-6 min-w-0">
						{attachedLabels.length > 0 && (
							<section>
								<h4 className="mb-2 text-xs font-semibold uppercase text-[#6B6E76]">
									Étiquettes
								</h4>
								<div className="flex flex-wrap gap-1.5">
									{attachedLabels.map((label) => {
										const s = labelStyle(label.color);
										return (
											<button
												key={label._id}
												type="button"
												onClick={() =>
													void detachLabel({
														cardId: card._id,
														labelId: label._id,
													})
												}
												data-label-color={label.color}
												className={`inline-flex h-7 items-center gap-1.5 rounded px-3 text-xs font-semibold transition-opacity hover:opacity-80 ${s.bg} ${s.fg}`}
												title="Cliquer pour détacher"
											>
												{label.text || label.color}
												<X className="h-3 w-3" />
											</button>
										);
									})}
								</div>
							</section>
						)}

						{card.dueDate && (
							<section>
								<h4 className="mb-2 text-xs font-semibold uppercase text-[#6B6E76]">
									Date d'échéance
								</h4>
								<div className="inline-flex items-center gap-2 rounded bg-[#F0F1F2] px-3 py-1.5 text-sm text-[#172B4D]">
									<Clock className="h-4 w-4 text-[#6B6E76]" />
									<span>
										{new Date(card.dueDate).toLocaleString("fr-FR", {
											dateStyle: "long",
											timeStyle: "short",
										})}
									</span>
									{card.dueDate < Date.now() && !card.dueDateCompleted && (
										<span className="rounded bg-[#FFECEB] px-1.5 py-0.5 text-[10px] font-semibold text-[#C9372C]">
											En retard
										</span>
									)}
								</div>
							</section>
						)}

						<section>
							<div className="mb-2 flex items-center gap-2">
								<AlignLeft className="h-4 w-4 text-[#6B6E76]" />
								<h4 className="text-sm font-semibold text-[#172B4D]">
									Description
								</h4>
							</div>
							{editingDesc ? (
								<div className="space-y-2">
									<Textarea
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										rows={5}
										// biome-ignore lint/a11y/noAutofocus: focus immédiat quand on entre en mode édition
										autoFocus
										placeholder="Ajouter une description plus détaillée..."
									/>
									<div className="flex gap-2">
										<Button
											onClick={() => void saveDescription()}
											size="sm"
											className="bg-[#0c66e4] hover:bg-[#0055cc]"
										>
											Enregistrer
										</Button>
										<Button
											onClick={() => {
												setDescription(card.description ?? "");
												setEditingDesc(false);
											}}
											size="sm"
											variant="ghost"
										>
											Annuler
										</Button>
									</div>
								</div>
							) : (
								<button
									type="button"
									onClick={() => setEditingDesc(true)}
									className="block w-full rounded bg-[#F0F1F2] p-3 text-left text-sm hover:bg-[#DDDEE1]"
								>
									{card.description || (
										<span className="text-[#6B6E76]">
											Ajouter une description plus détaillée...
										</span>
									)}
								</button>
							)}
						</section>

						<section>
							<div className="mb-2 flex items-baseline justify-between">
								<div className="flex items-center gap-2">
									<CheckSquare className="h-4 w-4 text-[#6B6E76]" />
									<h4 className="text-sm font-semibold text-[#172B4D]">
										Checklist
									</h4>
								</div>
								{totalCount > 0 && (
									<span className="text-xs text-[#6B6E76]">
										{checkedCount} / {totalCount}
									</span>
								)}
							</div>
							{totalCount > 0 && (
								<div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-[#F0F1F2]">
									<div
										className="h-full bg-[#22A06B] transition-all"
										style={{
											width: `${(checkedCount / totalCount) * 100}%`,
										}}
									/>
								</div>
							)}
							<ul className="space-y-1">
								{checklist.map((item) => (
									<li
										key={item._id}
										className="group flex items-center gap-2 rounded py-1"
									>
										<input
											type="checkbox"
											checked={item.checked}
											onChange={() => void toggleItem({ itemId: item._id })}
											className="h-4 w-4 rounded border-gray-300"
										/>
										<span
											className={`flex-1 text-sm ${item.checked ? "text-[#6B6E76] line-through" : "text-[#172B4D]"}`}
										>
											{item.text}
										</span>
										<button
											type="button"
											onClick={() => void removeItem({ itemId: item._id })}
											className="text-[#C9372C] opacity-0 transition-opacity hover:text-[#872821] group-hover:opacity-100"
											aria-label="Supprimer l'item"
										>
											<Trash2 className="h-3.5 w-3.5" />
										</button>
									</li>
								))}
							</ul>
							<form
								onSubmit={(e) => void handleAddItem(e)}
								className="mt-2 flex gap-2"
							>
								<Input
									value={newItemText}
									onChange={(e) => setNewItemText(e.target.value)}
									placeholder="Ajouter un élément..."
									className="h-8 text-sm"
								/>
								<Button
									type="submit"
									size="sm"
									disabled={!newItemText.trim()}
									className="bg-[#0c66e4] hover:bg-[#0055cc]"
								>
									Ajouter
								</Button>
							</form>
						</section>

						<section>
							<div className="mb-2 flex items-center gap-2">
								<Paperclip className="h-4 w-4 text-[#6B6E76]" />
								<h4 className="text-sm font-semibold text-[#172B4D]">
									Pièces jointes
								</h4>
							</div>
							{attachments === undefined ? (
								<p className="text-xs text-[#6B6E76]">Chargement...</p>
							) : attachments.length === 0 ? (
								<p className="mb-2 text-xs text-[#6B6E76]">
									Aucune pièce jointe.
								</p>
							) : (
								<ul className="mb-2 space-y-1">
									{attachments.map((att) => (
										<li
											key={att._id}
											className="group flex items-center gap-2 rounded bg-[#F0F1F2] px-2 py-1.5"
										>
											<Paperclip className="h-3.5 w-3.5 shrink-0 text-[#6B6E76]" />
											<a
												href={att.url ?? "#"}
												target="_blank"
												rel="noreferrer"
												className="flex-1 truncate text-sm text-[#0c66e4] hover:underline"
											>
												{att.name}
											</a>
											{att.size && (
												<span className="text-[10px] text-[#6B6E76]">
													{(att.size / 1024).toFixed(1)} Ko
												</span>
											)}
											<button
												type="button"
												onClick={() =>
													void removeAttachment({ attachmentId: att._id })
												}
												className="text-[#C9372C] opacity-0 transition-opacity hover:text-[#872821] group-hover:opacity-100"
												aria-label="Supprimer la pièce jointe"
											>
												<Trash2 className="h-3.5 w-3.5" />
											</button>
										</li>
									))}
								</ul>
							)}
							{/* biome-ignore lint/a11y/noLabelWithoutControl: l'input file est bien à l'intérieur du label */}
							<label className="inline-flex cursor-pointer items-center gap-2 rounded bg-[#F0F1F2] px-3 py-1.5 text-xs font-medium text-[#172B4D] hover:bg-[#DDDEE1]">
								<Paperclip className="h-3.5 w-3.5" />
								Ajouter un fichier
								<input
									type="file"
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (file) void handleUploadFile(file);
										e.target.value = "";
									}}
									className="hidden"
								/>
							</label>
						</section>

						<CommentsSection cardId={card._id} boardId={card.boardId} />

						<section>
							<div className="mb-2 flex items-center gap-2">
								<History className="h-4 w-4 text-[#6B6E76]" />
								<h4 className="text-sm font-semibold text-[#172B4D]">
									Activité
								</h4>
							</div>
							{activityItems === undefined ? (
								<p className="text-xs text-[#6B6E76]">Chargement...</p>
							) : activityItems.length === 0 ? (
								<p className="text-xs text-[#6B6E76]">
									Aucune activité pour l'instant.
								</p>
							) : (
								<ul className="space-y-2">
									{activityItems.map((a) => {
										const initial = a.userName.charAt(0).toUpperCase();
										const date = new Date(a._creationTime).toLocaleString(
											"fr-FR",
											{ dateStyle: "short", timeStyle: "short" },
										);
										return (
											<li key={a._id} className="flex items-start gap-2">
												<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-[10px] font-semibold text-white">
													{initial}
												</div>
												<div className="flex-1 text-xs text-[#172B4D]">
													<span className="font-semibold">{a.userName}</span>{" "}
													<span className="text-[#6B6E76]">
														{actionLabel(a.action)}
													</span>
													{a.details && (
														<span className="text-[#172B4D]">
															{" "}
															<em>{a.details}</em>
														</span>
													)}
													<div className="text-[10px] text-[#6B6E76]">
														{date}
													</div>
												</div>
											</li>
										);
									})}
								</ul>
							)}
						</section>
					</div>

					<aside className="space-y-4">
						<div>
							<h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#6B6E76]">
								Ajouter à la carte
							</h4>
							<div className="space-y-1">
								<SidebarButton
									icon={<Users />}
									onClick={() =>
										setActivePanel((p) => (p === "members" ? null : "members"))
									}
									active={activePanel === "members"}
								>
									Membres
								</SidebarButton>
								<SidebarButton
									icon={<Tag />}
									onClick={() =>
										setActivePanel((p) => (p === "labels" ? null : "labels"))
									}
									active={activePanel === "labels"}
								>
									Étiquettes
								</SidebarButton>
								<SidebarButton
									icon={<Clock />}
									onClick={() =>
										setActivePanel((p) => (p === "dates" ? null : "dates"))
									}
									active={activePanel === "dates"}
								>
									Dates
								</SidebarButton>
								<SidebarButton
									icon={<ImageIcon />}
									onClick={() =>
										setActivePanel((p) => (p === "cover" ? null : "cover"))
									}
									active={activePanel === "cover"}
								>
									Couverture
								</SidebarButton>
							</div>
						</div>

						<div>
							<h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#6B6E76]">
								Actions
							</h4>
							<div className="space-y-1">
								<SidebarButton
									icon={<ArrowRight />}
									onClick={() =>
										setActivePanel((p) => (p === "move" ? null : "move"))
									}
									active={activePanel === "move"}
								>
									Déplacer
								</SidebarButton>
								<SidebarButton
									icon={<Copy />}
									onClick={() => void handleDuplicate()}
								>
									Copier la carte
								</SidebarButton>
								<SidebarButton
									icon={<Archive />}
									onClick={() => void handleArchive()}
								>
									Archiver
								</SidebarButton>
								<SidebarButton
									icon={<Trash2 />}
									onClick={() => void handleDeleteCard()}
									danger
								>
									Supprimer
								</SidebarButton>
							</div>
						</div>

						{activePanel === "members" && (
							<MembersPanel
								boardId={card.boardId}
								card={card}
								onClose={() => setActivePanel(null)}
							/>
						)}
						{activePanel === "labels" && (
							<LabelPicker
								boardId={card.boardId}
								cardId={card._id}
								attachedIds={card.labelIds ?? []}
								onClose={() => setActivePanel(null)}
							/>
						)}
						{activePanel === "dates" && (
							<DatesPanel card={card} onClose={() => setActivePanel(null)} />
						)}
						{activePanel === "cover" && (
							<CoverPanel card={card} onClose={() => setActivePanel(null)} />
						)}
						{activePanel === "move" && (
							<MovePanel
								lists={lists}
								currentListId={card.listId}
								onMove={(id) => void handleMove(id)}
								onClose={() => setActivePanel(null)}
							/>
						)}
					</aside>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function SidebarButton({
	icon,
	children,
	onClick,
	active = false,
	danger = false,
}: {
	icon: React.ReactNode;
	children: React.ReactNode;
	onClick: () => void;
	active?: boolean;
	danger?: boolean;
}) {
	const base =
		"flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-xs font-medium transition-colors [&_svg]:h-3.5 [&_svg]:w-3.5";
	const variant = danger
		? "text-[#C9372C] bg-[#FFECEB] hover:bg-[#FFD5D2]"
		: active
			? "bg-[#0c66e4] text-white hover:bg-[#0055cc]"
			: "bg-[#F0F1F2] text-[#172B4D] hover:bg-[#DDDEE1]";
	return (
		<button type="button" onClick={onClick} className={`${base} ${variant}`}>
			{icon}
			<span className="flex-1">{children}</span>
		</button>
	);
}

export function DatesPanel({
	card,
	onClose,
}: {
	card: Doc<"cards">;
	onClose: () => void;
}) {
	const updateCard = useMutation(api.cards.update);
	const currentDate = card.dueDate ? new Date(card.dueDate) : undefined;
	const [time, setTime] = useState(() => {
		if (!currentDate) return "12:00";
		const h = currentDate.getHours().toString().padStart(2, "0");
		const m = currentDate.getMinutes().toString().padStart(2, "0");
		return `${h}:${m}`;
	});

	function combineDateAndTime(date: Date, timeStr: string) {
		const [h, m] = timeStr.split(":").map(Number);
		const combined = new Date(date);
		combined.setHours(h ?? 12, m ?? 0, 0, 0);
		return combined.getTime();
	}

	function handleDateSelect(date: Date | undefined) {
		if (!date) {
			void updateCard({ cardId: card._id, dueDate: null });
			return;
		}
		void updateCard({
			cardId: card._id,
			dueDate: combineDateAndTime(date, time),
		});
	}

	function handleTimeChange(newTime: string) {
		setTime(newTime);
		if (currentDate) {
			void updateCard({
				cardId: card._id,
				dueDate: combineDateAndTime(currentDate, newTime),
			});
		}
	}

	function handleSetToday() {
		void updateCard({
			cardId: card._id,
			dueDate: combineDateAndTime(new Date(), time),
		});
	}

	return (
		<div className="w-[280px] rounded-lg border border-[#091e4224] bg-white p-3 shadow-[0_8px_16px_-4px_#091e424f]">
			<div className="mb-2 flex items-center justify-between">
				<span className="text-sm font-semibold text-[#172b4d]">
					Date d'échéance
				</span>
				<button
					type="button"
					onClick={onClose}
					className="rounded p-1 text-[#6b6e76] hover:bg-[#091e4214] hover:text-[#172b4d]"
					aria-label="Fermer"
				>
					<X className="h-4 w-4" />
				</button>
			</div>

			<Calendar
				mode="single"
				selected={currentDate}
				onSelect={handleDateSelect}
				locale={fr}
				weekStartsOn={1}
				className="rounded-md p-0"
			/>

			<div className="mt-2 flex items-center gap-2">
				<label
					htmlFor="due-time"
					className="text-[10px] font-semibold uppercase text-[#6b6e76]"
				>
					Heure
				</label>
				<Input
					id="due-time"
					type="time"
					value={time}
					onChange={(e) => handleTimeChange(e.target.value)}
					className="h-8 flex-1 text-sm"
				/>
				<button
					type="button"
					onClick={handleSetToday}
					className="rounded-md bg-[#091e4214] px-2 py-1 text-xs font-medium text-[#172b4d] hover:bg-[#091e4224]"
				>
					Aujourd'hui
				</button>
			</div>

			{card.dueDate && (
				<>
					<label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-[#172b4d]">
						<input
							type="checkbox"
							checked={card.dueDateCompleted ?? false}
							onChange={(e) =>
								void updateCard({
									cardId: card._id,
									dueDateCompleted: e.target.checked,
								})
							}
							className="h-3.5 w-3.5"
						/>
						Marquer comme terminée à temps
					</label>
					<Button
						variant="ghost"
						size="sm"
						onClick={() =>
							void updateCard({ cardId: card._id, dueDate: null })
						}
						className="mt-2 h-7 w-full text-xs text-[#C9372C] hover:bg-[#FFECEB]"
					>
						Effacer la date
					</Button>
				</>
			)}
		</div>
	);
}

export function CoverPanel({
	card,
	onClose,
}: {
	card: Doc<"cards">;
	onClose: () => void;
}) {
	const updateCard = useMutation(api.cards.update);

	return (
		<div className="rounded-md border border-gray-200 bg-white p-3 shadow-md">
			<div className="mb-2 flex items-center justify-between">
				<span className="text-xs font-semibold text-[#172B4D]">Couverture</span>
				<button
					type="button"
					onClick={onClose}
					className="text-[#6B6E76] hover:text-[#172B4D]"
					aria-label="Fermer"
				>
					<X className="h-4 w-4" />
				</button>
			</div>

			<p className="mb-1 text-[10px] font-semibold uppercase text-[#6B6E76]">
				Couleurs
			</p>
			<div className="grid grid-cols-4 gap-1.5">
				{BOARD_GRADIENTS.map((g) => (
					<button
						key={g.id}
						type="button"
						onClick={() =>
							void updateCard({
								cardId: card._id,
								coverColor: g.id,
								coverImage: null,
							})
						}
						className={`h-7 rounded bg-gradient-to-br ${g.gradient} transition-transform hover:scale-105 ${card.coverColor === g.id ? "ring-2 ring-[#0c66e4] ring-offset-1" : ""}`}
						aria-label={g.label}
					/>
				))}
			</div>

			<p className="mb-1 mt-3 text-[10px] font-semibold uppercase text-[#6B6E76]">
				Photos
			</p>
			<div className="grid grid-cols-3 gap-1.5">
				{BOARD_PHOTOS.map((p) => (
					<button
						key={p.id}
						type="button"
						onClick={() =>
							void updateCard({
								cardId: card._id,
								coverImage: p.id,
								coverColor: null,
							})
						}
						className={`aspect-[4/3] overflow-hidden rounded transition-transform hover:scale-105 ${card.coverImage === p.id ? "ring-2 ring-[#0c66e4] ring-offset-1" : ""}`}
						aria-label={p.label}
					>
						<img
							src={p.thumbnail}
							alt={p.label}
							className="h-full w-full object-cover"
						/>
					</button>
				))}
			</div>

			{(card.coverColor || card.coverImage) && (
				<Button
					variant="ghost"
					size="sm"
					onClick={() =>
						void updateCard({
							cardId: card._id,
							coverColor: null,
							coverImage: null,
						})
					}
					className="mt-3 h-7 w-full text-xs"
				>
					Retirer la couverture
				</Button>
			)}
		</div>
	);
}

export function MovePanel({
	lists,
	currentListId,
	onMove,
	onClose,
}: {
	lists: Array<Doc<"lists">>;
	currentListId: Id<"lists">;
	onMove: (listId: Id<"lists">) => void;
	onClose: () => void;
}) {
	return (
		<div className="rounded-md border border-gray-200 bg-white p-3 shadow-md">
			<div className="mb-2 flex items-center justify-between">
				<span className="text-xs font-semibold text-[#172B4D]">
					Déplacer vers…
				</span>
				<button
					type="button"
					onClick={onClose}
					className="text-[#6B6E76] hover:text-[#172B4D]"
					aria-label="Fermer"
				>
					<X className="h-4 w-4" />
				</button>
			</div>
			{lists.length === 0 ? (
				<p className="text-xs text-[#6B6E76]">Aucune autre liste.</p>
			) : (
				<ul className="space-y-1">
					{lists.map((list) => {
						const isCurrent = list._id === currentListId;
						return (
							<li key={list._id}>
								<button
									type="button"
									disabled={isCurrent}
									onClick={() => onMove(list._id)}
									className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs ${
										isCurrent
											? "cursor-default bg-[#F0F1F2] text-[#6B6E76]"
											: "text-[#172B4D] hover:bg-[#F0F1F2]"
									}`}
								>
									<span className="truncate">{list.name}</span>
									{isCurrent && (
										<span className="ml-2 shrink-0 text-[10px] uppercase text-[#6B6E76]">
											Actuelle
										</span>
									)}
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}

function renderWithMentions(
	text: string,
	members: Array<{ userName: string }>,
): React.ReactNode {
	const names = members
		.map((m) => m.userName)
		.sort((a, b) => b.length - a.length);
	if (names.length === 0) return text;
	const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
	const regex = new RegExp(`@(${escaped.join("|")})\\b`, "g");
	const parts: Array<React.ReactNode> = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null;
	regex.lastIndex = 0;
	while ((match = regex.exec(text)) !== null) {
		if (match.index > lastIndex) {
			parts.push(text.slice(lastIndex, match.index));
		}
		parts.push(
			<span
				key={`m-${match.index}`}
				className="rounded bg-[#cfe1ff] px-1 font-medium text-[#0055cc]"
			>
				{match[0]}
			</span>,
		);
		lastIndex = match.index + match[0].length;
	}
	if (lastIndex < text.length) {
		parts.push(text.slice(lastIndex));
	}
	return parts;
}

function CommentsSection({
	cardId,
	boardId,
}: {
	cardId: Id<"cards">;
	boardId: Id<"boards">;
}) {
	const comments = useQuery(api.comments.listForCard, { cardId });
	const members = useQuery(api.boardMembers.listMembers, { boardId });
	const addComment = useMutation(api.comments.add);
	const removeComment = useMutation(api.comments.remove);

	const [text, setText] = useState("");
	const [mentionQuery, setMentionQuery] = useState<string | null>(null);
	const [mentionStart, setMentionStart] = useState<number>(-1);
	const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

	async function handleAdd(e: React.FormEvent) {
		e.preventDefault();
		const t = text.trim();
		if (!t) return;
		await addComment({ cardId, text: t });
		setText("");
		setMentionQuery(null);
	}

	function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
		const value = e.target.value;
		setText(value);
		const cursor = e.target.selectionStart;
		const before = value.slice(0, cursor);
		const atIndex = before.lastIndexOf("@");
		if (atIndex >= 0) {
			const between = before.slice(atIndex + 1);
			if (!between.includes(" ") && !between.includes("\n")) {
				const charBefore = atIndex > 0 ? value[atIndex - 1] : " ";
				if (charBefore === " " || charBefore === "\n" || atIndex === 0) {
					setMentionStart(atIndex);
					setMentionQuery(between.toLowerCase());
					return;
				}
			}
		}
		setMentionQuery(null);
		setMentionStart(-1);
	}

	function insertMention(name: string) {
		if (mentionStart < 0) return;
		const cursor = textareaRef.current?.selectionStart ?? text.length;
		const before = text.slice(0, mentionStart);
		const after = text.slice(cursor);
		const newText = `${before}@${name} ${after}`;
		setText(newText);
		setMentionQuery(null);
		setMentionStart(-1);
		requestAnimationFrame(() => {
			const pos = before.length + name.length + 2;
			textareaRef.current?.setSelectionRange(pos, pos);
			textareaRef.current?.focus();
		});
	}

	const filteredMembers =
		mentionQuery !== null
			? (members ?? []).filter((m) =>
					m.userName.toLowerCase().includes(mentionQuery),
				)
			: [];

	return (
		<section>
			<div className="mb-2 flex items-center gap-2">
				<MessageSquare className="h-4 w-4 text-[#6B6E76]" />
				<h4 className="text-sm font-semibold text-[#172B4D]">Commentaires</h4>
			</div>

			<form onSubmit={(e) => void handleAdd(e)} className="relative mb-3">
				<Textarea
					ref={textareaRef}
					value={text}
					onChange={handleTextChange}
					placeholder="Écrire un commentaire... (tape @ pour mentionner)"
					rows={2}
					className="text-sm"
				/>
				{mentionQuery !== null && filteredMembers.length > 0 && (
					<div className="absolute bottom-full left-0 z-50 mb-1 max-h-48 w-64 overflow-y-auto rounded-md border border-[#091e4224] bg-white shadow-lg">
						{filteredMembers.map((m) => (
							<button
								key={m._id}
								type="button"
								onClick={() => insertMention(m.userName)}
								className="flex w-full items-center gap-2 px-2 py-1.5 text-left hover:bg-[#091e420a]"
							>
								<MemberAvatar name={m.userName} size={24} />
								<div className="min-w-0 flex-1">
									<div className="truncate text-[12px] font-medium text-[#172b4d]">
										{m.userName}
									</div>
									<div className="truncate text-[10px] text-[#6b6e76]">
										{m.userEmail}
									</div>
								</div>
							</button>
						))}
					</div>
				)}
				<Button
					type="submit"
					size="sm"
					disabled={!text.trim()}
					className="mt-1.5 bg-[#0c66e4] hover:bg-[#0055cc]"
				>
					Publier
				</Button>
			</form>

			{comments === undefined ? (
				<p className="text-xs text-[#6B6E76]">Chargement...</p>
			) : comments.length === 0 ? (
				<p className="text-xs text-[#6B6E76]">
					Aucun commentaire pour l'instant.
				</p>
			) : (
				<ul className="space-y-3">
					{comments.map((c) => {
						const initial = c.authorName.charAt(0).toUpperCase();
						const date = new Date(c._creationTime).toLocaleString("fr-FR", {
							dateStyle: "short",
							timeStyle: "short",
						});
						return (
							<li key={c._id} className="group flex gap-2">
								<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-xs font-semibold text-white">
									{initial}
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-baseline gap-2">
										<span className="text-xs font-semibold text-[#172B4D]">
											{c.authorName}
										</span>
										<span className="text-[10px] text-[#6B6E76]">{date}</span>
									</div>
									<p className="mt-0.5 rounded bg-[#F0F1F2] px-2 py-1.5 text-sm text-[#172B4D] break-words">
										{renderWithMentions(c.text, members ?? [])}
									</p>
									<button
										type="button"
										onClick={() => void removeComment({ commentId: c._id })}
										className="mt-1 text-[10px] text-[#C9372C] opacity-0 transition-opacity hover:underline group-hover:opacity-100"
									>
										Supprimer
									</button>
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
}

function MembersPanel({
	boardId,
	card,
	onClose,
}: {
	boardId: Id<"boards">;
	card: Doc<"cards">;
	onClose: () => void;
}) {
	const members = useQuery(api.boardMembers.listMembers, { boardId });
	const updateCard = useMutation(api.cards.update);
	const assigned = card.memberIds ?? [];
	const [query, setQuery] = useState("");

	const filtered = (members ?? []).filter((m) => {
		if (!query.trim()) return true;
		const q = query.toLowerCase();
		return (
			m.userName.toLowerCase().includes(q) ||
			m.userEmail.toLowerCase().includes(q)
		);
	});

	function toggleMember(userId: string) {
		const next = assigned.includes(userId)
			? assigned.filter((id) => id !== userId)
			: [...assigned, userId];
		void updateCard({ cardId: card._id, memberIds: next });
	}

	return (
		<div className="rounded-lg border border-[#091e4224] bg-white p-3 shadow-sm">
			<div className="mb-2 flex items-center justify-between">
				<h4 className="text-[12px] font-semibold text-[#172b4d]">Membres</h4>
				<button
					type="button"
					onClick={onClose}
					className="rounded p-0.5 text-[#6b6e76] hover:bg-[#091e420a]"
				>
					<X className="h-3.5 w-3.5" />
				</button>
			</div>
			<Input
				placeholder="Rechercher un membre..."
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				className="mb-2 h-8 text-[12px]"
			/>
			{(members ?? []).length === 0 && (
				<p className="px-2 py-3 text-center text-[12px] text-[#6b6e76]">
					Aucun membre. Invite des collaborateurs via le bouton Partager.
				</p>
			)}
			<ul className="max-h-60 space-y-0.5 overflow-y-auto">
				{filtered.map((m) => {
					const isAssigned = assigned.includes(m.userId);
					return (
						<li key={m._id}>
							<button
								type="button"
								onClick={() => toggleMember(m.userId)}
								className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
									isAssigned
										? "bg-[#e9f2ff] hover:bg-[#cfe1ff]"
										: "hover:bg-[#091e420a]"
								}`}
							>
								<MemberAvatar name={m.userName} size={28} />
								<div className="min-w-0 flex-1">
									<div className="truncate text-[12px] font-medium text-[#172b4d]">
										{m.userName}
									</div>
									<div className="truncate text-[10px] text-[#6b6e76]">
										{m.userEmail}
									</div>
								</div>
								{isAssigned && (
									<CheckCircle2 className="h-4 w-4 text-[#0c66e4]" />
								)}
							</button>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

export function LabelPicker({
	boardId,
	cardId,
	attachedIds,
	onClose,
}: {
	boardId: Id<"boards">;
	cardId: Id<"cards">;
	attachedIds: Array<Id<"labels">>;
	onClose: () => void;
}) {
	const labels = useQuery(api.labels.listForBoard, { boardId });
	const createLabel = useMutation(api.labels.create);
	const attachLabel = useMutation(api.labels.attach);
	const detachLabel = useMutation(api.labels.detach);

	const [newColor, setNewColor] = useState("green");
	const [newText, setNewText] = useState("");

	const allColors = Object.keys(LABEL_COLORS);

	async function handleCreate(e: React.FormEvent) {
		e.preventDefault();
		await createLabel({
			boardId,
			color: newColor,
			text: newText.trim() || undefined,
		});
		setNewText("");
	}

	return (
		<div className="mt-2 rounded-md border border-gray-200 bg-white p-3 shadow-md">
			<div className="mb-2 flex items-center justify-between">
				<span className="text-xs font-semibold text-[#172B4D]">
					Étiquettes du tableau
				</span>
				<button
					type="button"
					onClick={onClose}
					className="text-[#6B6E76] hover:text-[#172B4D]"
					aria-label="Fermer"
				>
					<X className="h-4 w-4" />
				</button>
			</div>

			{labels === undefined ? (
				<div className="text-xs text-[#6B6E76]">Chargement...</div>
			) : labels.length === 0 ? (
				<div className="text-xs text-[#6B6E76]">
					Aucune étiquette. Crées-en une ci-dessous.
				</div>
			) : (
				<ul className="space-y-1">
					{labels.map((label) => {
						const attached = attachedIds.includes(label._id);
						const s = labelStyle(label.color);
						return (
							<li key={label._id} className="flex items-center gap-1">
								<button
									type="button"
									onClick={() =>
										attached
											? void detachLabel({ cardId, labelId: label._id })
											: void attachLabel({ cardId, labelId: label._id })
									}
									data-label-color={label.color}
									className={`flex flex-1 items-center justify-between rounded px-2 py-1.5 text-xs font-semibold hover:opacity-80 ${s.bg} ${s.fg}`}
								>
									<span>{label.text || label.color}</span>
									{attached && <CheckCircle2 className="h-3 w-3" />}
								</button>
							</li>
						);
					})}
				</ul>
			)}

			<form
				onSubmit={(e) => void handleCreate(e)}
				className="mt-3 space-y-2 border-t border-gray-200 pt-3"
			>
				<Input
					value={newText}
					onChange={(e) => setNewText(e.target.value)}
					placeholder="Nom (optionnel)"
					className="h-7 text-xs"
				/>
				<div className="flex flex-wrap gap-1">
					{allColors.map((c) => {
						const s = labelStyle(c);
						return (
							<button
								key={c}
								type="button"
								onClick={() => setNewColor(c)}
								className={`h-6 w-6 rounded ${s.bg} ${newColor === c ? "ring-2 ring-[#0c66e4] ring-offset-1" : ""}`}
								title={c}
								aria-label={c}
							/>
						);
					})}
				</div>
				<Button
					type="submit"
					size="sm"
					className="w-full bg-[#0c66e4] hover:bg-[#0055cc]"
				>
					Créer cette étiquette
				</Button>
			</form>
		</div>
	);
}
