#!/usr/bin/env bash
# Tunnel SSH résilient pour Trello clone — À LANCER SUR TA MACHINE LOCALE.
#
# Forward les 3 ports nécessaires (Vite + Convex API + Convex HTTP) avec :
#   - autossh si disponible (reconnexion auto en cas de coupure réseau)
#   - sinon ssh + ServerAliveInterval/keepalive
#
# Usage (sur ta machine, pas sur le serveur Hetzner) :
#   ./tunnel.sh
#
# Pour stopper : Ctrl+C
#
# Installer autossh une fois pour toutes (ULTRA recommandé) :
#   sudo apt install autossh        # Debian/Ubuntu
#   brew install autossh            # macOS
#   sudo dnf install autossh        # Fedora

# Configure l'IP du serveur via env var (à exporter avant ou via ~/.bashrc):
#   export TRELLO_SERVER="user@your-server-ip"
SERVER="${TRELLO_SERVER:-hermes@YOUR_SERVER_IP_HERE}"

if [ "$SERVER" = "hermes@YOUR_SERVER_IP_HERE" ]; then
  echo "⚠  Configure d'abord la variable TRELLO_SERVER."
  echo "   Ex: export TRELLO_SERVER=\"hermes@1.2.3.4\""
  exit 1
fi

# Ports à forwarder : 3000 (Vite), 3210 (Convex API), 3211 (Convex HTTP/auth)
PORTS=(
  "-L" "3000:127.0.0.1:3000"
  "-L" "3210:127.0.0.1:3210"
  "-L" "3211:127.0.0.1:3211"
)

# Options keepalive — détecte vite les coupures réseau et reconnecte
SSH_OPTS=(
  "-o" "ServerAliveInterval=15"          # ping toutes les 15s
  "-o" "ServerAliveCountMax=3"           # 3 échecs (45s) avant déco
  "-o" "ExitOnForwardFailure=yes"        # mort propre si port déjà utilisé
  "-o" "TCPKeepAlive=yes"
  "-o" "ConnectTimeout=10"
  "-N"                                   # pas de shell, juste les tunnels
)

if command -v autossh >/dev/null 2>&1; then
  echo "→ Utilisation d'autossh (reconnexion automatique)"
  echo "  Ctrl+C pour stopper. Les tunnels redémarrent seuls si le réseau coupe."
  echo ""
  # AUTOSSH_GATETIME=0 → reconnecte même si la 1ère connexion échoue
  AUTOSSH_GATETIME=0 \
  AUTOSSH_POLL=30 \
  autossh -M 0 "${SSH_OPTS[@]}" "${PORTS[@]}" "$SERVER"
else
  echo "⚠  autossh non installé. Conseillé : sudo apt install autossh"
  echo "→ Utilisation de ssh avec keepalive (déco manuelle si coupure réseau prolongée)"
  echo ""
  ssh "${SSH_OPTS[@]}" "${PORTS[@]}" "$SERVER"
fi
