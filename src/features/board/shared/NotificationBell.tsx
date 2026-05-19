import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Bell } from "lucide-react";
import { useState } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { api } from "../../../../convex/_generated/api";
import { MemberAvatar } from "./MemberAvatar";

// Cloche de notifications avec badge non-lus + dropdown.
// La variante `light` est utilisée dans la page workspace (fond clair),
// la variante par défaut est pour le board (fond foncé).
export function NotificationBell({
	variant = "dark",
}: {
	variant?: "dark" | "light";
}) {
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);
	const notifications = useQuery(api.notifications.listMine);
	const unreadCount = useQuery(api.notifications.countUnread);
	const markAsRead = useMutation(api.notifications.markAsRead);
	const markAllAsRead = useMutation(api.notifications.markAllAsRead);

	async function handleClick(
		notif: NonNullable<typeof notifications>[number],
	) {
		if (!notif.read) {
			await markAsRead({ notificationId: notif._id });
		}
		if (notif.boardId) {
			navigate({ to: "/boards/$boardId", params: { boardId: notif.boardId } });
		}
		setOpen(false);
	}

	const buttonClass =
		variant === "dark"
			? "relative rounded p-2 text-white/90 transition-colors hover:bg-white/10"
			: "relative rounded p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800";

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					className={buttonClass}
					aria-label="Notifications"
				>
					<Bell className="h-4 w-4" />
					{(unreadCount ?? 0) > 0 && (
						<span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c9372c] px-1 text-[9px] font-bold text-white">
							{unreadCount! > 99 ? "99+" : unreadCount}
						</span>
					)}
				</button>
			</PopoverTrigger>
			<PopoverContent
				className="w-[380px] overflow-hidden p-0 shadow-xl"
				align="end"
				side="bottom"
				sideOffset={8}
			>
				<div className="flex items-center justify-between border-b border-[#091e4224] bg-gradient-to-b from-[#fafbfc] to-white px-4 py-3">
					<h3 className="text-sm font-semibold text-[#172b4d]">
						Notifications
					</h3>
					{(unreadCount ?? 0) > 0 && (
						<button
							type="button"
							onClick={() => void markAllAsRead()}
							className="text-[11px] font-medium text-[#0c66e4] hover:underline"
						>
							Tout marquer comme lu
						</button>
					)}
				</div>
				<div className="max-h-96 overflow-y-auto">
					{notifications === undefined ? (
						<p className="px-4 py-6 text-center text-[12px] text-[#6b6e76]">
							Chargement...
						</p>
					) : notifications.length === 0 ? (
						<p className="px-4 py-8 text-center text-[12px] text-[#6b6e76]">
							Pas de notifications
						</p>
					) : (
						<ul className="divide-y divide-[#091e4214]">
							{notifications.map((n) => {
								const date = new Date(n._creationTime).toLocaleString(
									"fr-FR",
									{
										dateStyle: "short",
										timeStyle: "short",
									},
								);
								return (
									<li key={n._id}>
										<button
											type="button"
											onClick={() => void handleClick(n)}
											className={`flex w-full items-start gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-[#091e420a] ${
												n.read ? "" : "bg-[#e9f2ff]"
											}`}
										>
											<MemberAvatar name={n.actorName} size={32} />
											<div className="min-w-0 flex-1">
												<p className="text-[12px] text-[#172b4d]">
													{n.message}
												</p>
												<div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[#6b6e76]">
													{n.boardName && (
														<>
															<span className="truncate">{n.boardName}</span>
															<span>·</span>
														</>
													)}
													<span>{date}</span>
												</div>
											</div>
											{!n.read && (
												<span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#0c66e4]" />
											)}
										</button>
									</li>
								);
							})}
						</ul>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
