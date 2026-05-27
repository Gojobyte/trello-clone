import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "flowboard.theme";

function readStoredTheme(): Theme {
	if (typeof document === "undefined") return "light";
	const attr = document.documentElement.getAttribute("data-theme");
	if (attr === "dark" || attr === "light") return attr;
	return "light";
}

function applyTheme(theme: Theme) {
	if (typeof document === "undefined") return;
	document.documentElement.setAttribute("data-theme", theme);
	try {
		window.localStorage.setItem(STORAGE_KEY, theme);
	} catch {
		/* localStorage indisponible (mode privé Safari) — on ignore */
	}
}

export function useTheme() {
	const [theme, setThemeState] = useState<Theme>(() => readStoredTheme());

	// Sync si un autre onglet change le thème
	useEffect(() => {
		const handler = (e: StorageEvent) => {
			if (
				e.key === STORAGE_KEY &&
				(e.newValue === "dark" || e.newValue === "light")
			) {
				setThemeState(e.newValue);
				document.documentElement.setAttribute("data-theme", e.newValue);
			}
		};
		window.addEventListener("storage", handler);
		return () => window.removeEventListener("storage", handler);
	}, []);

	const setTheme = useCallback((next: Theme) => {
		setThemeState(next);
		applyTheme(next);
	}, []);

	const toggle = useCallback(() => {
		setThemeState((prev) => {
			const next = prev === "dark" ? "light" : "dark";
			applyTheme(next);
			return next;
		});
	}, []);

	return { theme, setTheme, toggle };
}

// Script anti-FOUC à injecter dans <head> en HTML brut.
// Lit le thème depuis localStorage et applique data-theme AVANT l'hydration React.
export const THEME_INIT_SCRIPT = `
(function(){
  try {
    var t = localStorage.getItem('${STORAGE_KEY}');
    if (t !== 'dark' && t !== 'light') t = 'light';
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;
