# BIL-04. Web : badges, courbes lissées, barres annotées, tendances

- Statut : faite
- Agent : frontend-dev
- Branche : feat/bil-04 (worktree, depuis feat/bilan-etat-allege)
- Dépend de : ADR 0034 points 8 à 11 ; BIL-03 (format de réponse fixé par l'ADR, travail en
  parallèle)
- Périmètre d'écriture : web/src/components/bilan/, web/src/components/service-status/,
  web/src/components/ui/InfoLabel.jsx, web/src/api/service-status.js, web/src/api/organisation.js,
  web/src/hooks/bilan/, web/src/hooks/service-status/, web/src/hooks/organisation/,
  CHANGELOG.md (« Non publié »), cette fiche. Exclus : onglets Audit et Qualité, backend/,
  mobile/, toute dépendance.

## Contexte

Essai de l'utilisateur sur BIL-02 : améliorer le rendu, les titres des badges, des courbes
plus souples, le texte dans les barres plutôt qu'une légende, et les tendances fournies par
l'API. ADR 0034 points 8 à 11 (à lire en entier) : la forme des champs `thresholds`
(service-status) et `trends` (organisation) y est fixée.

## Critères d'acceptation

- [x] Badges : texte et couleur pris tels quels dans le `status` de l'API ; plus aucun seuil
      ni texte de statut de repli côté web (THRESHOLDS, getChargeInterpretation… dans
      components/service-status/config.js et serviceMetrics.js supprimés s'ils ne servent
      plus) ; sans statut, pas de badge.
- [x] Définitions de charge, fragmentation, pilotage : la phrase de seuil codée en dur est
      retirée du texte et remplacée par une ligne construite depuis `thresholds` (par exemple
      « Seuils : élevée dès 75 %, au plafond dès 100 % ») ; fonction pure testée. Sans
      `thresholds` (ancienne API), pas de ligne de seuils.
- [x] Tendance : sur les cartes urgences, chantiers coupés, interventions par journée, part du
      préventif, une flèche grise (icône lucide) et un mot (« en hausse », « stable », « en
      baisse ») depuis `trends` ; rien si null ou absent. Aucune couleur de jugement.
- [x] Mini-courbes lissées (courbe passant par les points, sans dépassement : par exemple
      spline monotone), trait fin, dernier point marqué ; fonction pure de chemin testée.
- [x] Barres de temps : chaque segment porte son libellé, ses heures et sa part à l'intérieur
      (texte lisible sur la couleur) ; un segment trop étroit garde seulement sa part, ou
      rien, et son détail complet en infobulle ; plus de légende sous les barres.
- [x] Rendu soigné : badges compacts alignés, cartes régulières, espacements cohérents.
- [x] Tests `node --test` des fonctions pures nouvelles ; tests existants inchangés.
- [x] `cd web && npm test && npm run build` verts ; aucune nouvelle erreur eslint dans les
      fichiers touchés ; scripts/check.sh vert. CHANGELOG à jour.

## Compte rendu final

Fait : badges depuis `status` de l'API seul (`serviceMetrics.js` et `THRESHOLDS` supprimés,
phrases de seuil retirées des définitions, ligne « Seuils : ... » construite depuis `thresholds`,
absente sans lui) ; tendance grise sur quatre cartes depuis `trends` ; mini-courbes en spline
monotone (`smoothPath`) avec point final rond ; barres de 40 px avec texte dans les segments
(détail complet, part seule ou rien selon la largeur, infobulle toujours) et légende retirée ;
cartes plus régulières. Fonctions pures testées : `figureNotes.js`, `smoothPath`,
`segmentDisplay`. Non vérifié : rendu visuel dans un navigateur et contre l'API BIL-03 réelle
(forme codée d'après l'ADR).
