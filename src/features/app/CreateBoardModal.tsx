import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BOARD_GRADIENTS } from "#/lib/board-backgrounds";
import { api } from "../../../convex/_generated/api";
import { Icon } from "./Icon";

// Modale de création de tableau au style gestion-pro.
export function CreateBoardModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const workspaces = useQuery(api.workspaces.listMine);
  const createBoard = useMutation(api.boards.create);
  const createWorkspace = useMutation(api.workspaces.create);

  const [name, setName] = useState("");
  const [color, setColor] = useState("indigo");
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (workspaces && workspaces.length > 0 && !workspaceId) {
      setWorkspaceId(workspaces[0]._id);
    }
  }, [workspaces, workspaceId]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      let wsId = workspaceId;
      if (!wsId) {
        wsId = await createWorkspace({ name: "Mon espace", color: "indigo" });
      }
      const boardId = await createBoard({
        name: name.trim(),
        color,
        workspaceId: wsId as never,
      });
      toast.success("Tableau créé");
      onClose();
      navigate({ to: "/boards/$boardId", params: { boardId } });
    } catch {
      toast.error("Impossible de créer le tableau");
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        style={{ width: "min(520px, 92vw)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div
            className="row"
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border-c)",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 15 }}>Nouveau tableau</span>
            <span className="spacer" />
            <button
              type="button"
              className="sb-icon-btn"
              onClick={onClose}
              aria-label="Fermer"
            >
              <Icon name="x" size={16} />
            </button>
          </div>

          <div className="col" style={{ gap: 16, padding: 20 }}>
            <div>
              <label className="label" htmlFor="board-name">
                Nom du tableau
              </label>
              <input
                id="board-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Roadmap 2026"
                autoFocus
              />
            </div>

            <div>
              <label className="label">Couleur</label>
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                {BOARD_GRADIENTS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setColor(g.id)}
                    title={g.label}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: g.hex,
                      border:
                        color === g.id
                          ? "2px solid var(--text)"
                          : "2px solid transparent",
                      boxShadow: "var(--shadow-xs)",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </div>

            {workspaces && workspaces.length > 0 && (
              <div>
                <label className="label" htmlFor="board-ws">
                  Espace de travail
                </label>
                <select
                  id="board-ws"
                  className="input"
                  value={workspaceId}
                  onChange={(e) => setWorkspaceId(e.target.value)}
                >
                  {workspaces.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div
            className="row"
            style={{
              justifyContent: "flex-end",
              gap: 8,
              padding: "14px 20px",
              borderTop: "1px solid var(--border-c)",
              background: "var(--bg-soft)",
            }}
          >
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn--accent"
              disabled={!name.trim() || submitting}
            >
              {submitting ? "Création…" : "Créer le tableau"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
