# CAH-02. Rédaction du cahier fonctionnel

- Statut : faite (2026-11-21)
- Agent : principal
- Branche : docs/cahier-fonctionnel
- Dépend de : CAH-01
- Périmètre d'écriture : docs/cahier-fonctionnel.md, docs/backlog/sites-codes-en-dur.md, docs/ETAT.md, cette fiche

## Contexte

Document de référence en trois niveaux : livré (version et preuve), en cours, à concevoir ou
vision. « En cours » ne reprend que ce que docs/ETAT.md et les ADR montrent réellement
(décision de l'utilisateur du 2026-11-21 : pas d'extrapolation ; un chantier seulement prévu
ou au backlog est marqué comme tel). Les écarts de docs/philosophie.md avec le nouveau
discours sont signalés sans modifier ce fichier.

## Critères d'acceptation

- [x] sections : architecture métier, audit, constats (à concevoir, questions ouvertes :
      modèle de données, droits, effet sur la clôture, reprise de l'existant), tunnel de
      décision (vision), feuille de route
- [x] aucune fonction décrite comme livrée sans preuve issue de CAH-01 ou de l'agent principal
- [x] relu par le reviewer, puis validé par l'utilisateur

## Compte rendu final

Cahier rédigé par l'agent principal à partir de CAH-01 et de ses contre-vérifications ;
reviewer APPROUVÉ (réserves mineures corrigées : périmètre de la fiche, formulation de la
ligne 1 du résumé) ; validé par l'utilisateur le 2026-11-21. Écarts relevés (cahier,
section 6) : docs/philosophie.md à réaligner, fiche backlog périmée, sites réels codés en
dur (backlog sites-codes-en-dur). check.sh vert au commit. Restent NON VÉRIFIÉS : test de
rôle par endpoint, audit de la demande créée par le préventif, page /public/purchase-request.
