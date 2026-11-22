# Guide consultable par version

Demande de l'utilisateur du 2026-11-22. Le guide affiche la version de Tunnel qu'il décrit
(lue dans web/package.json : barre de navigation, encadré de l'accueil, pied de page), mais
seule la dernière version est en ligne. Une installation pas encore mise à jour doit lire
`docs/site` au tag de sa version dans le dépôt.

Piste : construire le guide de chaque tag dans un sous-dossier (`/docs/5.13/`…) par le
workflow Pages, avec un sélecteur de version dans la barre ; VitePress ne le fait pas seul.
À décider : nombre de versions gardées, coût de construction, ADR (amende l'ADR 0037).
