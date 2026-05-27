export type BoardGradient = {
	id: string;
	label: string;
	gradient: string;
	hex: string;
};

export type BoardPhoto = {
	id: string;
	label: string;
	url: string;
	thumbnail: string;
};

export const BOARD_GRADIENTS: ReadonlyArray<BoardGradient> = [
	{
		id: "sky",
		label: "Ciel",
		gradient: "from-sky-500 via-sky-600 to-blue-700",
		hex: "#0079bf",
	},
	{
		id: "indigo",
		label: "Indigo",
		gradient: "from-indigo-500 via-indigo-600 to-purple-700",
		hex: "#4f46e5",
	},
	{
		id: "emerald",
		label: "Émeraude",
		gradient: "from-emerald-500 via-emerald-600 to-teal-700",
		hex: "#059669",
	},
	{
		id: "amber",
		label: "Ambre",
		gradient: "from-amber-400 via-orange-500 to-red-600",
		hex: "#f59e0b",
	},
	{
		id: "rose",
		label: "Rose",
		gradient: "from-rose-500 via-pink-500 to-purple-600",
		hex: "#e11d48",
	},
	{
		id: "violet",
		label: "Violet",
		gradient: "from-violet-500 via-purple-600 to-fuchsia-700",
		hex: "#8b5cf6",
	},
	{
		id: "slate",
		label: "Ardoise",
		gradient: "from-slate-700 via-slate-800 to-zinc-900",
		hex: "#334155",
	},
	{
		id: "teal",
		label: "Sarcelle",
		gradient: "from-teal-500 via-cyan-600 to-sky-700",
		hex: "#0d9488",
	},
] as const;

export const BOARD_PHOTOS: ReadonlyArray<BoardPhoto> = [
	{
		id: "mountain-lake",
		label: "Lac de montagne",
		url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=80",
		thumbnail:
			"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=70",
	},
	{
		id: "snowy-peak",
		label: "Sommet enneigé",
		url: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=2400&q=80",
		thumbnail:
			"https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=400&q=70",
	},
	{
		id: "tropical-beach",
		label: "Plage tropicale",
		url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=2400&q=80",
		thumbnail:
			"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=70",
	},
	{
		id: "milky-way",
		label: "Voie lactée",
		url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=2400&q=80",
		thumbnail:
			"https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&q=70",
	},
	{
		id: "city-night",
		label: "Ville la nuit",
		url: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=2400&q=80",
		thumbnail:
			"https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&q=70",
	},
	{
		id: "northern-lights",
		label: "Aurore boréale",
		url: "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=2400&q=80",
		thumbnail:
			"https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=400&q=70",
	},
	{
		id: "ocean-wave",
		label: "Vague océan",
		url: "https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?w=2400&q=80",
		thumbnail:
			"https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?w=400&q=70",
	},
	{
		id: "misty-forest",
		label: "Forêt brumeuse",
		url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=2400&q=80",
		thumbnail:
			"https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=70",
	},
	{
		id: "desert-dunes",
		label: "Dunes du désert",
		url: "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=2400&q=80",
		thumbnail:
			"https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=400&q=70",
	},
	{
		id: "abstract-blue",
		label: "Abstrait bleu",
		url: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=2400&q=80",
		thumbnail:
			"https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&q=70",
	},
	{
		id: "abstract-pink",
		label: "Abstrait rose",
		url: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=2400&q=80",
		thumbnail:
			"https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400&q=70",
	},
	{
		id: "warm-sunset",
		label: "Coucher de soleil",
		url: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=2400&q=80",
		thumbnail:
			"https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=400&q=70",
	},
] as const;

export function gradientFor(colorId: string | undefined): string {
	const match = BOARD_GRADIENTS.find((c) => c.id === colorId);
	return match?.gradient ?? BOARD_GRADIENTS[0].gradient;
}

export function photoFor(id: string | undefined): BoardPhoto | undefined {
	if (!id) return undefined;
	return BOARD_PHOTOS.find((p) => p.id === id);
}

export function hexFor(colorId: string | undefined): string {
	const match = BOARD_GRADIENTS.find((c) => c.id === colorId);
	return match?.hex ?? BOARD_GRADIENTS[1].hex;
}
