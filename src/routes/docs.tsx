// ============ DOCS · Lume Éclat (Phase 3d) ============
// Wiki d'équipe : pagehead serif + grille de cartes Éclat.

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "#/features/app/AppShell";
import { Icon } from "#/features/app/Icon";
import { authClient } from "#/lib/auth-client";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

// ============ ROUTE ============

export const Route = createFileRoute("/docs")({
	component: DocsRoute,
});

function DocsRoute() {
	return (
		<AppShell
			active={{ route: "docs" }}
			title="Docs"
			crumbs={["Atelier Marchand"]}
		>
			<DocsContent />
		</AppShell>
	);
}

// ============ HELPERS ============

function fmtRelative(ts: number): string {
	const diff = Date.now() - ts;
	const minutes = Math.floor(diff / 60_000);
	if (minutes < 2) return "à l'instant";
	if (minutes < 60) return `il y a ${minutes} min`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `il y a ${hours}h`;
	const days = Math.floor(hours / 24);
	if (days === 1) return "hier";
	if (days < 7) return `il y a ${days}j`;
	const weeks = Math.floor(days / 7);
	if (weeks < 5) return `il y a ${weeks} sem`;
	return `il y a ${Math.floor(days / 30)} mois`;
}

// ============ CONTENU ============

function DocsContent() {
	const { data: session } = authClient.useSession();
	const docs = useQuery(api.docs.list, session?.user ? {} : "skip");
	const createDoc = useMutation(api.docs.create);
	const updateDoc = useMutation(api.docs.update);
	const removeDoc = useMutation(api.docs.remove);

	const [selectedId, setSelectedId] = useState<Id<"docs"> | null>(null);
	const [query, setQuery] = useState("");

	// Champs d'édition locaux
	const [editTitle, setEditTitle] = useState("");
	const [editEmoji, setEditEmoji] = useState("");
	const [editContent, setEditContent] = useState("");
	const [saving, setSaving] = useState(false);

	const currentDoc = docs?.find((d) => d._id === selectedId) ?? null;

	// Synchronise les champs d'édition quand le doc sélectionné change.
	// On n'écoute QUE _id : les autres champs sont contrôlés localement.
	// biome-ignore lint/correctness/useExhaustiveDependencies: re-sync on doc switch only
	useEffect(() => {
		if (currentDoc) {
			setEditTitle(currentDoc.title);
			setEditEmoji(currentDoc.emoji ?? "");
			setEditContent(currentDoc.content ?? "");
		}
	}, [currentDoc?._id]);

	if (docs === undefined) {
		return (
			<div className="tools-page">
				<div className="tools-loading">Chargement…</div>
			</div>
		);
	}

	const filtered = docs.filter(
		(d) => !query || d.title.toLowerCase().includes(query.toLowerCase()),
	);

	async function handleCreate() {
		const docId = await createDoc({ title: "Page sans titre", emoji: "📄" });
		setSelectedId(docId as Id<"docs">);
		toast.success("Nouvelle page créée.");
	}

	async function handleSave() {
		if (!selectedId) return;
		setSaving(true);
		try {
			await updateDoc({
				docId: selectedId,
				title: editTitle,
				emoji: editEmoji,
				content: editContent,
			});
			toast.success("Page enregistrée.");
		} finally {
			setSaving(false);
		}
	}

	async function handleDelete() {
		if (!selectedId) return;
		const ok = window.confirm("Supprimer cette page définitivement ?");
		if (!ok) return;
		await removeDoc({ docId: selectedId });
		toast.success("Page supprimée.");
		setSelectedId(null);
	}

	// ── Stats du wiki ──
	const totalLines = docs.reduce(
		(a, d) => a + (d.content ?? "").split("\n").length,
		0,
	);
	const lastTs =
		docs.length > 0 ? Math.max(...docs.map((d) => d._creationTime)) : null;

	return (
		<div className="tools-page" style={{ ["--tools-stats-cols" as string]: 3 }}>
			{/* ── Header ── */}
			<header className="mw-pagehead">
				<div className="mw-greet">
					<div>
						<h1 className="mw-greet-h1">
							Documents <em className="serif-italic">partagés</em>.
						</h1>
						<p className="tools-head-meta" style={{ marginTop: 8 }}>
							<span>
								{docs.length} page{docs.length !== 1 ? "s" : ""}
							</span>
							{lastTs && (
								<>
									<span className="dot" aria-hidden="true" />
									<span>Mis à jour {fmtRelative(lastTs)}</span>
								</>
							)}
						</p>
					</div>
					<button type="button" className="mw-cta" onClick={handleCreate}>
						<Icon name="plus" size={14} />
						<span>Nouveau document</span>
					</button>
				</div>
			</header>

			{/* Si un doc est sélectionné, on bascule sur l'éditeur (slide-over inline) */}
			{currentDoc ? (
				<section className="tools-body" aria-label="Édition du document">
					<button
						type="button"
						className="doc-back"
						onClick={() => setSelectedId(null)}
					>
						<Icon
							name="chevron"
							size={12}
							style={{ transform: "rotate(180deg)" }}
						/>
						<span>Retour aux documents</span>
					</button>

					<div className="doc-editor">
						<div className="doc-editor-head">
							<input
								className="doc-emoji-input"
								value={editEmoji}
								onChange={(e) => setEditEmoji(e.target.value)}
								placeholder="📄"
								maxLength={4}
								aria-label="Emoji de la page"
							/>
							<input
								className="doc-title-input"
								value={editTitle}
								onChange={(e) => setEditTitle(e.target.value)}
								placeholder="Titre de la page…"
								aria-label="Titre"
							/>
						</div>
						<div className="doc-editor-info">
							<span>
								Modifié par <b>{currentDoc.updatedByName}</b> ·{" "}
								{fmtRelative(currentDoc._creationTime)}
							</span>
						</div>
						<textarea
							className="doc-editor-textarea"
							value={editContent}
							onChange={(e) => setEditContent(e.target.value)}
							placeholder={
								"Rédige ton contenu en markdown…\n\n# Titre de section\n\nParagraphe…"
							}
						/>
						<div className="doc-editor-actions">
							<button
								type="button"
								className="tools-modal-btn tools-modal-btn--ghost"
								onClick={handleDelete}
							>
								<Icon name="trash" size={12} />
								<span>Supprimer</span>
							</button>
							<button
								type="button"
								className="tools-modal-btn tools-modal-btn--primary"
								onClick={handleSave}
								disabled={saving}
							>
								{saving ? "Enregistrement…" : "Enregistrer"}
							</button>
						</div>
					</div>
				</section>
			) : (
				<>
					{/* ── Stats band ── */}
					{docs.length > 0 && (
						<section className="tools-stats" aria-label="Indicateurs des docs">
							<article className="tools-stat">
								<span className="tools-stat-eyebrow">Pages</span>
								<span className="tools-stat-value">
									{docs.length}
									<span className="unit">documents</span>
								</span>
								<span className="tools-stat-meta">
									dans ton espace de travail
								</span>
							</article>
							<article className="tools-stat" data-tone="accent">
								<span className="tools-stat-eyebrow">Lignes rédigées</span>
								<span className="tools-stat-value">
									{totalLines}
									<span className="unit">lignes</span>
								</span>
								<span className="tools-stat-meta">tout markdown confondu</span>
							</article>
							<article className="tools-stat">
								<span className="tools-stat-eyebrow">Dernière édition</span>
								<span className="tools-stat-value" style={{ fontSize: 18 }}>
									{lastTs ? fmtRelative(lastTs) : "—"}
								</span>
								<span className="tools-stat-meta">
									{docs[0]?.updatedByName
										? `par ${docs[0].updatedByName}`
										: "Pas encore"}
								</span>
							</article>
						</section>
					)}

					{/* ── Recherche ── */}
					<div className="docs-search">
						<Icon
							name="search"
							size={14}
							stroke={1.6}
							style={{ color: "var(--text-subtle)" }}
						/>
						<input
							type="search"
							placeholder="Rechercher un document…"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
						/>
						{query && (
							<button
								type="button"
								className="kbd"
								onClick={() => setQuery("")}
								style={{ cursor: "pointer", border: "none" }}
							>
								effacer
							</button>
						)}
					</div>

					{/* ── Grille de cartes ── */}
					<section className="tools-body" aria-label="Liste des documents">
						{docs.length === 0 ? (
							<div className="tools-empty">
								<h2 className="tools-empty-h">
									Commence à <em>écrire</em>.
								</h2>
								<p className="tools-empty-sub">
									Documentation produit, runbooks, post-mortems… tout vit ici, à
									un seul endroit.
								</p>
								<button type="button" className="mw-cta" onClick={handleCreate}>
									<Icon name="plus" size={14} />
									<span>Créer ma première page</span>
								</button>
							</div>
						) : (
							<div className="doc-grid">
								{filtered.length === 0 && query && (
									<div className="tools-empty" style={{ gridColumn: "1 / -1" }}>
										<h2 className="tools-empty-h">
											Aucun résultat pour <em>« {query} »</em>.
										</h2>
									</div>
								)}
								{filtered.map((d) => (
									<button
										type="button"
										key={d._id}
										className="doc-card"
										onClick={() => setSelectedId(d._id)}
									>
										<span className="doc-emoji" aria-hidden="true">
											{d.emoji || "📄"}
										</span>
										<h3 className="doc-title">{d.title || "Sans titre"}</h3>
										<p className="doc-meta">
											Mis à jour par <b>{d.updatedByName}</b> ·{" "}
											{fmtRelative(d._creationTime)}
										</p>
									</button>
								))}

								<button
									type="button"
									className="doc-card doc-card--new"
									onClick={handleCreate}
								>
									<span className="doc-card-new-mark" aria-hidden="true">
										+
									</span>
									<span style={{ fontSize: 13, fontWeight: 500 }}>
										Nouveau document
									</span>
									<span
										style={{
											fontSize: 11.5,
											color: "var(--text-subtle)",
										}}
									>
										Page vierge en markdown
									</span>
								</button>
							</div>
						)}
					</section>
				</>
			)}
		</div>
	);
}
