// Calcule la position entre deux éléments dans une liste triée par position.
// Si on insère en début → position - 1000.
// Si on insère en fin → position + 1000.
// Sinon → moyenne des deux voisins.
export function midPosition(
	prev: number | undefined,
	next: number | undefined,
): number {
	if (prev === undefined && next === undefined) return 1000;
	if (prev === undefined && next !== undefined) return next - 1000;
	if (prev !== undefined && next === undefined) return prev + 1000;
	return ((prev as number) + (next as number)) / 2;
}

// Format date contextuel : "Aujourd'hui à 14h", "Demain", "Lun 5 juin", "5 juin", "5 juin 2026"
export function formatDueDate(ts: number): string {
	const d = new Date(ts);
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
	const dayAfter = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
	const inAWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
	const sameYear = d.getFullYear() === now.getFullYear();

	if (d >= today && d < tomorrow) {
		const hours = d.getHours().toString().padStart(2, "0");
		const mins = d.getMinutes().toString().padStart(2, "0");
		return `Aujourd'hui à ${hours}h${mins}`;
	}
	if (d >= tomorrow && d < dayAfter) return "Demain";
	if (d >= today && d < inAWeek) {
		return d.toLocaleDateString("fr-FR", {
			weekday: "short",
			day: "numeric",
			month: "short",
		});
	}
	if (sameYear) {
		return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
	}
	return d.toLocaleDateString("fr-FR", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

// État visuel de la date d'échéance
export type DueDateState = "completed" | "overdue" | "soon" | "normal";

export function dueDateState(ts: number, completed: boolean): DueDateState {
	if (completed) return "completed";
	const now = Date.now();
	if (ts < now) return "overdue";
	if (ts - now < 24 * 60 * 60 * 1000) return "soon"; // <24h
	return "normal";
}
