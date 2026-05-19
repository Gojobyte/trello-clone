import type { DueDateState } from "./board-helpers";

// Couleurs Atlassian des étiquettes Trello
export const LABEL_COLORS: Record<string, { bg: string; fg: string }> = {
	green: { bg: "bg-[#4BCE97]", fg: "text-[#164B35]" },
	yellow: { bg: "bg-[#F5CD47]", fg: "text-[#533F04]" },
	orange: { bg: "bg-[#FCA700]", fg: "text-[#693200]" },
	red: { bg: "bg-[#F87168]", fg: "text-white" },
	purple: { bg: "bg-[#C97CF4]", fg: "text-white" },
	sky: { bg: "bg-[#6CC3E0]", fg: "text-[#164555]" },
	lime: { bg: "bg-[#94C748]", fg: "text-[#37471F]" },
	pink: { bg: "bg-[#E774BB]", fg: "text-white" },
};

export function labelStyle(color: string) {
	return LABEL_COLORS[color] ?? LABEL_COLORS.green;
}

// Styles Atlassian pour le badge date d'échéance
export const DUE_DATE_STYLES: Record<DueDateState, { bg: string; fg: string }> =
	{
		completed: { bg: "bg-[#dcfff1]", fg: "text-[#216e4e]" },
		overdue: { bg: "bg-[#ffd5d2]", fg: "text-[#ae2e24]" },
		soon: { bg: "bg-[#fff7d6]", fg: "text-[#7f5f01]" },
		normal: { bg: "bg-[#091e4214]", fg: "text-[#172b4d]" },
	};

// Libellés des actions dans le feed d'activité
export const ACTION_LABELS: Record<string, string> = {
	"card.create": "a créé cette carte :",
	"card.rename": "a renommé la carte :",
	"card.move": "a déplacé cette carte :",
	"card.archive": "a archivé cette carte :",
	"card.delete": "a supprimé cette carte :",
	"card.duplicate": "a dupliqué une carte :",
	"comment.add": "a commenté :",
	"attachment.add": "a joint un fichier :",
	"attachment.remove": "a retiré une pièce jointe :",
	"member.invite": "a invité quelqu'un :",
	"member.join": "a rejoint le tableau :",
	"member.leave": "a quitté le tableau :",
	"member.remove": "a retiré un membre :",
};

export function actionLabel(action: string): string {
	return ACTION_LABELS[action] ?? action;
}
