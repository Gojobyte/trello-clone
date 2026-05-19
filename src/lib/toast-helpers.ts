import { toast } from "sonner";

// Wrappe l'appel d'une mutation Convex pour afficher un toast d'erreur en cas
// d'échec, et optionnellement un toast de succès.
// Usage :
//   await withToast(() => invite({ boardId, email }), { success: "Invité !" })
export async function withToast<T>(
	fn: () => Promise<T>,
	opts: { success?: string; errorPrefix?: string } = {},
): Promise<T | undefined> {
	try {
		const result = await fn();
		if (opts.success) toast.success(opts.success);
		return result;
	} catch (err) {
		const msg = extractErrorMessage(err);
		toast.error(opts.errorPrefix ? `${opts.errorPrefix} : ${msg}` : msg);
		return undefined;
	}
}

// Convex throw des ConvexError avec un format spécifique : "Server Error\nUncaught ConvexError: <msg>"
// On extrait le vrai message lisible.
export function extractErrorMessage(err: unknown): string {
	if (!err) return "Une erreur est survenue";
	const raw = err instanceof Error ? err.message : String(err);
	// Pattern Convex : "Uncaught ConvexError: <message>" ou "Uncaught Error: <message>"
	const convexMatch = raw.match(/Uncaught (?:ConvexError|Error): (.+?)(?:\n|$)/);
	if (convexMatch) return convexMatch[1].trim();
	// Pattern Convex compact : "[Request ID: xxx] Server Error\n..."
	const lines = raw.split("\n").filter(Boolean);
	const usefulLine = lines.find((l) =>
		l.includes("ConvexError") || l.includes("Error:"),
	);
	if (usefulLine) {
		const m = usefulLine.match(/(?:ConvexError|Error): (.+)/);
		if (m) return m[1].trim();
	}
	return raw.split("\n")[0] || "Erreur inconnue";
}

export { toast };
