# Fiches de tâche

Une fiche par tâche déléguée ou menée par l'agent principal (CLAUDE.md sections 7 et 11).
Elle est écrite avant de lancer le travail et complétée par le compte rendu à la fin.
L'état d'ensemble (chantier en cours, tableau des tâches) vit dans docs/ETAT.md.

Nom du fichier : `<CODE>-<nn>-<sujet>.md`, où CODE est le code court du chantier
(par exemple ARCH pour l'archivage en masse) et nn un numéro sur deux chiffres,
jamais réutilisé dans le chantier. Une tâche redécoupée prend un suffixe : ARCH-03a, ARCH-03b.

Modèle :

    # ARCH-01. Titre court

    - Statut : à faire | en cours | faite | bloquée | abandonnée (date)
    - Agent : backend-dev | db-dev | frontend-dev | test-writer | researcher | doc-writer | principal
    - Branche : feat/... (depuis develop, ADR 0008)
    - Dépend de : tâches, ADR
    - Périmètre d'écriture : chemins autorisés ; ce qui est explicitement exclu

    ## Contexte

    Deux ou trois phrases : pourquoi cette tâche, ce qu'on sait déjà.

    ## Critères d'acceptation

    - [ ] critère vérifiable (test nommé, commande, comportement observable)
    - [ ] scripts/check.sh vert ; test-integration.sh vert si base ou middlewares touchés
    - [ ] CHANGELOG (« Non publié ») à jour

    ## Compte rendu final

    Fait, fichiers touchés, résultat des tests, commandes en échec, questions ouvertes,
    ce qui reste NON VÉRIFIÉ. Contrôle de l'agent principal : diff --stat conforme au
    périmètre, tests relancés, assertions inchangées.
