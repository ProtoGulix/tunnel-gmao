# Rattachement d'un constat : une seule transaction

Constat de la revue du chantier CST (2026-11-22). `link_to_idea`
(backend/api/constats/repo.py) pose le lien puis rejette la demande par `transition_status`,
qui valide sa propre transaction. Si l'écriture du lien échoue après le rejet, la demande reste
rejetée en doublon sans lien. Fenêtre très étroite. Correction : faire accepter un curseur à
`transition_status` pour tout valider ensemble.
