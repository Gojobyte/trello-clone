import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { MemberAvatar } from "../shared/MemberAvatar";

// Avatars empilés des membres assignés à une carte (vue Kanban)
export function CardMemberAvatars({
	boardId,
	memberIds,
}: {
	boardId: Id<"boards">;
	memberIds: Array<string>;
}) {
	const members = useQuery(api.boardMembers.listMembers, { boardId });
	if (!members) return null;
	const assigned = memberIds
		.map((id) => members.find((m) => m.userId === id))
		.filter((m): m is NonNullable<typeof m> => Boolean(m));
	if (assigned.length === 0) return null;
	return (
		<div className="ml-auto flex items-center -space-x-1">
			{assigned.slice(0, 3).map((m) => (
				<MemberAvatar key={m._id} name={m.userName} size={22} ring />
			))}
			{assigned.length > 3 && (
				<div className="z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-white bg-[#172b4d] text-[9px] font-semibold text-white">
					+{assigned.length - 3}
				</div>
			)}
		</div>
	);
}
