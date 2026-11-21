TRAITÉ (2026-11-21, DEMO-01)

# Sites de l'usine codés en dur dans le front web

Relevé le 2026-11-21 (fiche CAH-02). Les filtres de site des vues d'accueil direction
technique et acheteur listent en dur les deux sites de l'usine de production, avec leurs
noms réels :

- web/src/pages/home/TechnicalDirectionHomeView.jsx (constante des sites)
- web/src/pages/home/BuyerHomeView.jsx (même constante)
- web/src/api/intervention-requests.js (exemple dans un commentaire)

Problèmes : donnée réelle dans un dépôt public (CLAUDE.md section 2.5) ; filtre sans effet
pour toute autre installation ; noms visibles sur la base de démonstration et les captures.

Piste : lire les sites depuis l'API (machines racines, le filtre `site` existe déjà côté
demandes). À cadrer avant la base de démonstration (priorité 2 du chantier CAH).
