import { useCallback, useEffect, useState } from "react";

export type SidebarMode = "extended" | "rail";

const STORAGE_KEY = "flowboard.sidebar";

function readStored(): SidebarMode {
	if (typeof window === "undefined") return "extended";
	try {
		const v = window.localStorage.getItem(STORAGE_KEY);
		return v === "rail" ? "rail" : "extended";
	} catch {
		return "extended";
	}
}

function applyMode(mode: SidebarMode) {
	if (typeof document === "undefined") return;
	document.documentElement.setAttribute("data-sidebar", mode);
	try {
		window.localStorage.setItem(STORAGE_KEY, mode);
	} catch {
		/* ignore */
	}
}

export function useSidebarMode() {
	const [mode, setModeState] = useState<SidebarMode>(() => readStored());

	// Applique data-sidebar au montage (FOUC-safe car réécrit en cas de changement)
	useEffect(() => {
		document.documentElement.setAttribute("data-sidebar", mode);
	}, [mode]);

	const setMode = useCallback((next: SidebarMode) => {
		setModeState(next);
		applyMode(next);
	}, []);

	const toggle = useCallback(() => {
		setModeState((prev) => {
			const next = prev === "rail" ? "extended" : "rail";
			applyMode(next);
			return next;
		});
	}, []);

	return { mode, setMode, toggle };
}
