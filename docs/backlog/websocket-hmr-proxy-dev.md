# Mobile de dev rechargé en boucle : websocket bloquée par le nginx de l'hôte

Constat (2026-11-14) : sur tunnel-dev.frezille.fr, /m/login se recharge toutes les
~5 s, connexion impossible. La websocket HMR de vite (`/m/?token=…`) reçoit 200 au lieu
de 101 ; le client vite croit le serveur redémarré, le sonde (`/m/` → 204) et recharge.
Le web a le même échec de websocket sans boucler (raison NON VÉRIFIÉE).

Cause : `/etc/nginx/sites-available/dev-tunnel` (nginx de l'hôte, hors dépôt) ne transmet
pas `Upgrade` ni `Connection` à la stack (le nginx de la stack les transmet). Configuration
inchangée depuis le 8 novembre ; non lié au code de l'étape 2 d'AUDC.

Correction (root, accord de l'utilisateur du 2026-11-14, à faire quand il a la console) :

    sudo sed -i 's|^        proxy_http_version 1.1;$|        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection "upgrade";|' /etc/nginx/sites-available/dev-tunnel && sudo nginx -t && sudo systemctl reload nginx

Vérification : les journaux de tunnel-web-1 montrent `GET /m/?token=… 101`. Cloudflare
est devant (websockets permises par défaut, NON VÉRIFIÉ). Ensuite : essais mobiles de
l'étape 2 (fiche AUDC-27b).
