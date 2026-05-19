import { useMutation, useQuery } from "convex/react";
import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Dialog, DialogContent } from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { authClient } from "#/lib/auth-client";
import { withToast } from "#/lib/toast-helpers";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { MemberAvatar } from "./MemberAvatar";

export function ShareBoardDialog({
	boardId,
	open,
	onOpenChange,
}: {
	boardId: Id<"boards">;
	open: boolean;
	onOpenChange: (v: boolean) => void;
}) {
	const members = useQuery(api.boardMembers.listMembers, { boardId });
	const invitations = useQuery(api.boardMembers.listPendingInvitations, {
		boardId,
	});
	const invite = useMutation(api.boardMembers.invite);
	const revoke = useMutation(api.boardMembers.revokeInvitation);
	const removeMember = useMutation(api.boardMembers.removeMember);
	const [email, setEmail] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const { data: session } = authClient.useSession();
	const meId = session?.user?.id;
	const myRole = members?.find((m) => m.userId === meId)?.role;
	const isOwner = myRole === "owner";

	async function handleInvite(e: React.FormEvent) {
		e.preventDefault();
		const trimmed = email.trim();
		if (!trimmed) return;
		setSubmitting(true);
		const result = await withToast(() => invite({ boardId, email: trimmed }), {
			success: `Invitation envoyée à ${trimmed}`,
		});
		if (result !== undefined) setEmail("");
		setSubmitting(false);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
				<div className="border-b border-[#091e4224] bg-gradient-to-b from-[#fafbfc] to-white px-5 py-4">
					<h2 className="text-base font-semibold text-[#172b4d]">
						Partager le tableau
					</h2>
					<p className="mt-0.5 text-[12px] text-[#6b6e76]">
						Invitez des collaborateurs par email
					</p>
				</div>

				<div className="px-5 py-4">
					{isOwner ? (
						<form onSubmit={handleInvite} className="flex gap-2">
							<Input
								type="email"
								placeholder="adresse.email@exemple.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="h-9"
								disabled={submitting}
							/>
							<Button
								type="submit"
								size="sm"
								disabled={submitting || !email.trim()}
								className="h-9 bg-[#0c66e4] text-white hover:bg-[#0055cc]"
							>
								{submitting ? "..." : "Inviter"}
							</Button>
						</form>
					) : (
						<p className="text-[13px] text-[#6b6e76]">
							Seul le propriétaire peut inviter des membres.
						</p>
					)}

					{invitations && invitations.length > 0 && (
						<div className="mt-5">
							<h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6b6e76]">
								Invitations en attente
							</h3>
							<ul className="space-y-1">
								{invitations.map((inv) => (
									<li
										key={inv._id}
										className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#091e420a]"
									>
										<MemberAvatar name={inv.email} size={28} />
										<div className="min-w-0 flex-1">
											<div className="truncate text-[13px] text-[#172b4d]">
												{inv.email}
											</div>
											<div className="text-[11px] text-[#6b6e76]">
												Invité par {inv.invitedByName}
											</div>
										</div>
										{isOwner && (
											<button
												type="button"
												onClick={() =>
													void revoke({ invitationId: inv._id })
												}
												className="rounded px-2 py-1 text-[12px] text-[#6b6e76] hover:bg-[#ffeceb] hover:text-[#ae2e24]"
											>
												Révoquer
											</button>
										)}
									</li>
								))}
							</ul>
						</div>
					)}

					<div className="mt-5">
						<h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6b6e76]">
							Membres ({members?.length ?? 0})
						</h3>
						<ul className="space-y-1">
							{(members ?? []).map((m) => (
								<li
									key={m._id}
									className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#091e420a]"
								>
									<MemberAvatar name={m.userName} size={28} />
									<div className="min-w-0 flex-1">
										<div className="truncate text-[13px] font-medium text-[#172b4d]">
											{m.userName}
											{m.userId === meId && (
												<span className="ml-1 text-[11px] font-normal text-[#6b6e76]">
													(vous)
												</span>
											)}
										</div>
										<div className="truncate text-[11px] text-[#6b6e76]">
											{m.userEmail}
										</div>
									</div>
									<span
										className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
											m.role === "owner"
												? "bg-[#e9f2ff] text-[#0c66e4]"
												: "bg-[#091e420a] text-[#44546f]"
										}`}
									>
										{m.role === "owner" ? "Propriétaire" : "Membre"}
									</span>
									{isOwner && m.role !== "owner" && (
										<button
											type="button"
											onClick={() => void removeMember({ memberId: m._id })}
											className="rounded p-1 text-[#6b6e76] hover:bg-[#ffeceb] hover:text-[#ae2e24]"
											aria-label="Retirer"
										>
											<X className="h-3.5 w-3.5" />
										</button>
									)}
								</li>
							))}
						</ul>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
