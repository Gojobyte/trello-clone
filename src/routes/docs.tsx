import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Icon } from "#/features/app/Icon";
import { AppShell } from "#/features/app/AppShell";
import { authClient } from "#/lib/auth-client";
import { toast } from "sonner";

export const Route = createFileRoute("/docs")({
  component: DocsRoute,
});

function DocsRoute() {
  return (
    <AppShell active={{ route: "docs" }} title="Docs" crumbs={["Atelier Marchand"]}>
      <DocsContent />
    </AppShell>
  );
}

// ============ UTILITAIRES ============

/** Extrait les titres markdown (lignes commençant par #) depuis le contenu. */
function extractHeadings(content: string): { level: number; text: string; slug: string }[] {
  return content
    .split("\n")
    .filter((line) => /^#{1,3} /.test(line))
    .map((line) => {
      const match = line.match(/^(#{1,3}) (.+)$/);
      if (!match) return null;
      const level = match[1].length;
      const text = match[2].trim();
      const slug = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      return { level, text, slug };
    })
    .filter((h): h is { level: number; text: string; slug: string } => h !== null);
}

/** Formate un timestamp en texte relatif court. */
function formatRelative(ts: number): string {
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

// ============ COMPOSANT PRINCIPAL ============

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

  // Sélectionne le premier doc au chargement si aucun n'est sélectionné
  useEffect(() => {
    if (docs && docs.length > 0 && selectedId === null) {
      setSelectedId(docs[0]._id);
    }
  }, [docs, selectedId]);

  // Synchronise les champs d'édition quand le doc sélectionné change
  const currentDoc = docs?.find((d) => d._id === selectedId) ?? null;
  useEffect(() => {
    if (currentDoc) {
      setEditTitle(currentDoc.title);
      setEditEmoji(currentDoc.emoji ?? "");
      setEditContent(currentDoc.content ?? "");
    }
  }, [currentDoc?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredDocs = docs?.filter((d) =>
    !query || d.title.toLowerCase().includes(query.toLowerCase())
  ) ?? [];

  // ── Handlers ──

  async function handleCreate() {
    const docId = await createDoc({ title: "Page sans titre", emoji: "📄" });
    setSelectedId(docId as Id<"docs">);
    toast.success("Nouvelle page créée !");
  }

  async function handleSave() {
    if (!selectedId) return;
    setSaving(true);
    try {
      await updateDoc({ docId: selectedId, title: editTitle, emoji: editEmoji, content: editContent });
      toast.success("Page enregistrée.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedId) return;
    const ok = window.confirm("Supprimer cette page définitivement ?");
    if (!ok) return;
    const currentIndex = docs!.findIndex((d) => d._id === selectedId);
    await removeDoc({ docId: selectedId });
    toast.success("Page supprimée.");
    // Sélectionne un voisin
    const remaining = docs!.filter((d) => d._id !== selectedId);
    if (remaining.length > 0) {
      const nextIndex = Math.min(currentIndex, remaining.length - 1);
      setSelectedId(remaining[nextIndex]._id);
    } else {
      setSelectedId(null);
    }
  }

  const headings = extractHeadings(editContent);

  // ── États de chargement ──

  if (docs === undefined) {
    return (
      <div className="view-enter" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-subtle)", fontSize: 14 }}>
        Chargement…
      </div>
    );
  }

  // ── État vide ──

  if (docs.length === 0) {
    return (
      <div className="view-enter" style={{ display: "flex", height: "100%", overflow: "hidden" }}>
        <aside className="docs-side">
          <div style={{ padding: "12px 12px 8px" }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
              <h2 style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>Documentation</h2>
              <button className="btn btn--ghost btn--icon" title="Nouvelle page" onClick={handleCreate}>
                <Icon name="plus" size={12} stroke={2} />
              </button>
            </div>
          </div>
        </aside>
        <div className="docs-main" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", maxWidth: 360 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📄</div>
            <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 8 }}>Aucune page pour l'instant</h2>
            <p style={{ color: "var(--text-subtle)", fontSize: 14, marginBottom: 24 }}>
              Créez votre première page pour commencer à documenter votre projet.
            </p>
            <button className="btn btn--primary" onClick={handleCreate}>
              <Icon name="plus" size={13} /> Créer ma première page
            </button>
          </div>
        </div>
        <style>{CSS}</style>
      </div>
    );
  }

  // ── Vue principale ──

  return (
    <div className="view-enter" style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* ── Sidebar navigation ── */}
      <aside className="docs-side">
        <div style={{ padding: "12px 12px 8px" }}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
            <h2 style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>Documentation</h2>
            <button
              className="btn btn--ghost btn--icon"
              title="Nouvelle page"
              onClick={handleCreate}
            >
              <Icon name="plus" size={12} stroke={2} />
            </button>
          </div>
          <div
            className="row"
            style={{
              padding: "4px 8px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              gap: 6,
            }}
          >
            <Icon name="search" size={12} stroke={1.6} style={{ color: "var(--text-subtle)" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher…"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 12.5,
              }}
            />
          </div>
        </div>

        <div className="docs-tree">
          <div className="docs-section">
            <div className="docs-section-h">
              <span className="docs-section-mark">◆</span>
              Pages
              <span className="spacer" />
              <span className="text-subtle text-xs font-mono">{docs.length}</span>
            </div>
            {filteredDocs.length === 0 && query && (
              <p style={{ fontSize: 12.5, color: "var(--text-subtle)", padding: "8px 12px" }}>
                Aucun résultat.
              </p>
            )}
            {filteredDocs.map((d) => (
              <button
                key={d._id}
                className={`docs-page-link${selectedId === d._id ? " active" : ""}`}
                onClick={() => setSelectedId(d._id)}
              >
                <span style={{ fontSize: 13, flex: "none" }}>{d.emoji || "📄"}</span>
                <span
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {d.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "8px 10px", borderTop: "1px solid var(--border)" }}>
          <button
            className="btn btn--ghost btn--sm"
            style={{ width: "100%", justifyContent: "flex-start" }}
            onClick={handleCreate}
          >
            <Icon name="plus" size={12} /> Nouvelle page
          </button>
        </div>
      </aside>

      {/* ── Zone principale (édition) ── */}
      <div className="docs-main">
        {/* Breadcrumb */}
        <div className="docs-crumb">
          <span className="text-subtle text-xs">Docs</span>
          <span className="text-subtle">/</span>
          <span className="text-xs" style={{ fontWeight: 500 }}>
            {currentDoc?.title || "Sans titre"}
          </span>
          <span className="spacer" />
          {currentDoc && (
            <span className="text-subtle text-xs">
              Modifié par {currentDoc.updatedByName} · {formatRelative(currentDoc._creationTime)}
            </span>
          )}
          <button
            className="btn btn--ghost btn--icon"
            title="Supprimer cette page"
            onClick={handleDelete}
            style={{ color: "var(--text-subtle)" }}
          >
            <Icon name="trash" size={13} />
          </button>
        </div>

        {/* Article / éditeur */}
        {currentDoc ? (
          <article className="docs-article">
            {/* En-tête emoji + titre */}
            <div className="docs-editor-header">
              <input
                className="docs-emoji-input"
                value={editEmoji}
                onChange={(e) => setEditEmoji(e.target.value)}
                placeholder="📄"
                maxLength={4}
                title="Emoji de la page"
              />
              <input
                className="docs-title-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Titre de la page"
              />
            </div>

            <div className="row text-subtle text-sm" style={{ gap: 8, marginBottom: 32 }}>
              <span>Modifié par <strong>{currentDoc.updatedByName}</strong></span>
              <span>·</span>
              <span>{formatRelative(currentDoc._creationTime)}</span>
            </div>

            {/* Corps + Sommaire */}
            <div className="docs-cols">
              <div className="docs-body">
                <textarea
                  className="docs-textarea"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder={"Rédigez votre contenu en markdown…\n\n# Titre de section\n\nParagraphe…"}
                />
                <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Enregistrement…" : "Enregistrer"}
                  </button>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={handleDelete}
                    style={{ color: "var(--text-subtle)" }}
                  >
                    Supprimer la page
                  </button>
                </div>
              </div>

              {/* Table des matières */}
              <aside className="docs-toc">
                <div className="docs-toc-h">Sur cette page</div>
                {headings.length > 0 ? (
                  <ul>
                    {headings.map((h, i) => (
                      <li key={i} style={{ paddingLeft: (h.level - 1) * 8 }}>
                        <a href={`#${h.slug}`}>{h.text}</a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: 12, color: "var(--text-subtle)", margin: "4px 12px" }}>
                    Ajoutez des titres <code>#</code> dans le contenu.
                  </p>
                )}

                <div className="docs-toc-h" style={{ marginTop: 24 }}>Infos</div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, borderLeft: "none" }}>
                  <li style={{ fontSize: 12.5, color: "var(--text-subtle)", padding: "3px 0" }}>
                    Créé le {new Date(currentDoc._creationTime).toLocaleDateString("fr-FR")}
                  </li>
                  <li style={{ fontSize: 12.5, color: "var(--text-subtle)", padding: "3px 0" }}>
                    Auteur : {currentDoc.updatedByName}
                  </li>
                  <li style={{ fontSize: 12.5, color: "var(--text-subtle)", padding: "3px 0" }}>
                    {(currentDoc.content ?? "").split("\n").length} lignes
                  </li>
                </ul>
              </aside>
            </div>
          </article>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-subtle)" }}>
            Sélectionnez une page dans le panneau de gauche.
          </div>
        )}
      </div>

      <style>{CSS}</style>
    </div>
  );
}

// ============ STYLES ============

const CSS = `
  .docs-side {
    width: 260px; flex: none;
    background: var(--bg);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
  }
  .docs-tree {
    flex: 1; overflow-y: auto;
    padding: 4px 8px 16px;
  }
  .docs-section { margin-top: 12px; }
  .docs-section-h {
    display: flex; align-items: center; gap: 8px;
    padding: 4px 8px;
    font-size: 11px; color: var(--text-subtle);
    text-transform: uppercase; letter-spacing: 0.05em;
    font-weight: 500;
  }
  .docs-section-mark {
    font-size: 11px; color: var(--text-muted);
  }
  .docs-page-link {
    display: flex; align-items: center; gap: 8px;
    padding: 5px 8px 5px 22px;
    border-radius: 5px; border: none; background: transparent;
    font-size: 12.5px; color: var(--text-muted);
    cursor: pointer; transition: background 0.12s, color 0.12s;
    width: 100%; text-align: left;
  }
  .docs-page-link:hover { background: var(--surface-hover); color: var(--text); }
  .docs-page-link.active {
    background: var(--surface); color: var(--text);
    box-shadow: var(--shadow-xs); font-weight: 500;
  }

  .docs-main { flex: 1; overflow-y: auto; }
  .docs-crumb {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 32px;
    border-bottom: 1px solid var(--border);
    background: var(--bg);
    position: sticky; top: 0; z-index: 2;
  }
  .docs-article {
    max-width: 880px; padding: 48px 32px 80px;
  }

  .docs-editor-header {
    display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
  }
  .docs-emoji-input {
    width: 60px; font-size: 40px; line-height: 1;
    border: none; background: transparent; outline: none;
    cursor: text;
  }
  .docs-title-input {
    flex: 1;
    font-size: 40px; font-weight: 500;
    letter-spacing: -0.02em; line-height: 1.1;
    border: none; background: transparent; outline: none;
    color: var(--text);
  }
  .docs-title-input::placeholder { color: var(--text-subtle); }

  .docs-cols {
    display: grid; grid-template-columns: 1fr 220px;
    gap: 48px;
  }
  .docs-body { font-size: 15px; line-height: 1.7; color: var(--text); }
  .docs-body h2 {
    font-size: 22px; font-weight: 500; letter-spacing: -0.01em;
    margin: 40px 0 12px;
  }
  .docs-body p { margin: 0 0 16px; }
  .docs-body ul { padding-left: 20px; }
  .docs-body li { margin-bottom: 8px; }
  .docs-body code {
    background: var(--bg-soft); padding: 1px 6px;
    border-radius: 4px; font-family: var(--font-mono);
    font-size: 13px;
  }

  .docs-textarea {
    width: 100%; min-height: 420px;
    border: 1px solid var(--border); border-radius: 8px;
    background: var(--surface); color: var(--text);
    font-size: 14px; font-family: var(--font-mono, monospace);
    line-height: 1.6; padding: 16px;
    resize: vertical; outline: none;
    transition: border-color 0.15s;
  }
  .docs-textarea:focus { border-color: var(--accent); }
  .docs-textarea::placeholder { color: var(--text-subtle); }

  .docs-toc {
    position: sticky; top: 80px; align-self: start;
    font-size: 13px;
  }
  .docs-toc-h {
    font-size: 11px; color: var(--text-subtle);
    text-transform: uppercase; letter-spacing: 0.05em;
    font-weight: 500; margin-bottom: 8px;
  }
  .docs-toc ul {
    list-style: none; padding: 0; margin: 0 0 12px;
    border-left: 1px solid var(--border);
  }
  .docs-toc li { margin: 0; padding: 0; }
  .docs-toc li a {
    display: block; padding: 4px 12px;
    font-size: 12.5px; color: var(--text-muted);
    cursor: pointer; transition: color 0.12s;
    margin-left: -1px; border-left: 1px solid transparent;
    text-decoration: none;
  }
  .docs-toc li a:hover { color: var(--text); }
  .docs-toc li.active a {
    color: var(--text); font-weight: 500;
    border-left-color: var(--text);
  }
`;
