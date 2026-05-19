import { useEffect, useState } from "react";

const STORAGE_KEY = "trello.recentBoards.v1";
const MAX_RECENT = 8;

function readRecent(): Array<string> {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
	} catch {
		return [];
	}
}

function writeRecent(ids: Array<string>) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
		window.dispatchEvent(new Event("trello-recent-boards"));
	} catch {
		// quota / private mode — silently ignore
	}
}

// Hook qui retourne la liste des IDs de boards récemment consultés (max 8).
// Persisté en localStorage. Met à jour le state quand un autre composant écrit.
export function useRecentBoards(): Array<string> {
	const [recent, setRecent] = useState<Array<string>>(() => readRecent());

	useEffect(() => {
		function handler() {
			setRecent(readRecent());
		}
		window.addEventListener("trello-recent-boards", handler);
		window.addEventListener("storage", handler);
		return () => {
			window.removeEventListener("trello-recent-boards", handler);
			window.removeEventListener("storage", handler);
		};
	}, []);

	return recent;
}

// Ajoute un board en tête de la liste, dédoublonne, limite à MAX_RECENT.
export function pushRecentBoard(boardId: string) {
	const current = readRecent();
	const filtered = current.filter((id) => id !== boardId);
	const next = [boardId, ...filtered].slice(0, MAX_RECENT);
	writeRecent(next);
}

// Retire un board (utile après suppression d'un board pour nettoyer la liste).
export function removeRecentBoard(boardId: string) {
	const current = readRecent();
	const filtered = current.filter((id) => id !== boardId);
	writeRecent(filtered);
}
