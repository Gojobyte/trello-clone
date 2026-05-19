#!/usr/bin/env bash
# Lance Vite dans une session tmux persistante (survit aux déconnexions SSH).
# Idempotent : tue les anciennes sessions et redémarre proprement.
#
# Usage côté serveur :
#   bash /home/hermes/trello-clone/scripts/start-dev.sh
#
# Pour attacher à la session et voir les logs :
#   tmux attach -t trello-dev
# Pour détacher (laisser tourner en arrière-plan) :
#   Ctrl+B puis D

set -euo pipefail

SESSION="trello-dev"
PROJECT_DIR="/home/hermes/trello-clone"

# Tue toute ancienne session du même nom
tmux kill-session -t "$SESSION" 2>/dev/null || true

# Tue tout vite zombi qui traîne
pkill -f "vite dev --port 3000" 2>/dev/null || true
sleep 1

# Crée une nouvelle session détachée, dans le dossier projet
tmux new-session -d -s "$SESSION" -c "$PROJECT_DIR"

# Lance Vite à l'intérieur
tmux send-keys -t "$SESSION" "npm run dev" C-m

echo "✓ Vite démarré dans tmux session '$SESSION'"
echo "  - Voir les logs   : tmux attach -t $SESSION"
echo "  - Détacher        : Ctrl+B puis D"
echo "  - Stopper proprement : tmux kill-session -t $SESSION"
echo ""
echo "Vite est maintenant résilient aux déconnexions SSH."
