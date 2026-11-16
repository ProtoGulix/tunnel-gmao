# TDB-02. Section « État et évolution » du panneau équipement (web)

- Statut : faite (2026-11-16)
- Agent : frontend-dev
- Branche : feat/equipement-tableau-de-bord (depuis develop, ADR 0008)
- Dépend de : TDB-01 (contrat de l'endpoint), ADR 0020 (Recharts)
- Périmètre d'écriture : web/src/components/equipements/, web/src/hooks/equipements/,
  web/src/api/ (fonction d'appel du dashboard et paramètres de fetchInterventionsPage),
  web/src/auth/permissionCodes.js, web/package.json et web/package-lock.json (ajout de
  recharts seulement, version fixée par l'ADR 0020), CHANGELOG.md (« Non publié »).
  Exclu : backend/, mobile/, toute autre dépendance.

## Contexte

Le panneau détail d'un équipement (EquipementDetailPanel.jsx) empile fiche,
sous-équipements et activité, sans aucun graphique. L'utilisateur veut voir d'un coup
d'œil ce qui se passe sur la machine : tendances, répartitions en camembert, et accès aux
interventions concernées dans une modale.

## Spécification

- Nouvelle section « État et évolution » en tête du panneau, affichée si
  `can(PERM.equipements.dashboard)` (code `equipements:get_equipement_dashboard`).
- Période : 12 derniers mois par défaut (pas de dates envoyées, le backend applique le
  défaut) ; sélecteur simple 6 mois / 12 mois / 24 mois / depuis la mise en service.
- Sous-équipements : la section suit la case « Inclure les sous-équipements » existante
  de la section activité ; l'état de la case remonte au panneau pour être partagé, une
  seule case visible.
- Contenu : chiffres clés (KPICard existant : interventions signalées, fermées, ouvertes
  maintenant, heures passées, complexité moyenne, délai moyen de fermeture) ;
  histogramme mensuel empilé par type d'intervention avec courbe des heures passées ;
  trois camemberts (types d'intervention, catégories d'action en heures, facteurs de
  complexité). Couleurs reprises de la réponse (type, catégorie) quand elles existent.
- Clic sur une part du camembert des types, ou sur un mois de l'histogramme, ou sur le
  bouton « Voir les interventions » : Dialog Radix (modèle du Dialog préventif de
  EquipementActivity.jsx) qui liste les interventions filtrées (fetchInterventionsPage
  avec equipementId, includeDescendants, type_inter, reported_from, reported_to,
  printed null pour inclure les archivées), paginée ; chaque ligne renvoie vers
  l'intervention (entityCodeUrl).
- États vides, chargement et erreur avec LoadingState / ErrorState ; un équipement sans
  intervention affiche un message, pas des graphiques vides.
- Aucun calcul métier côté front : les agrégats viennent tous de l'API.
- Les graphiques sont chargés à la demande (React.lazy) et chacun a un équivalent lisible
  sans graphique (valeurs et libellés en légende), ADR 0020. Mesurer le poids ajouté au
  bundle par npm run build et le noter dans le compte rendu.

## Critères d'acceptation

- [x] Section visible avec le droit, absente sans le droit.
- [x] Changement de période et de la case sous-équipements relance la requête.
- [x] Clic sur une part, un mois et le bouton ouvre la modale avec les bons filtres
      (vérifié dans l'onglet réseau ou par test).
- [x] npm run build et npm run lint de web/ verts ; scripts/check.sh vert.
- [x] Essai à l'écran par l'utilisateur sur un équipement réel avant fusion.
- [x] CHANGELOG (« Non publié ») à jour.

## Compte rendu final

Fait (frontend-dev, worktree feat/equipement-tableau-de-bord-tdb02) : section
EquipementDashboardSection (droit PERM.equipements.dashboard), graphiques dans
EquipementDashboardCharts chargé en React.lazy, équivalents lisibles dans
EquipementDashboardFigures (listes et tableau « Valeurs par mois », libellés cliquables),
modale EquipementInterventionsDialog (réutilise InterventionsBlock, archivées incluses),
case « Inclure les sous-équipements » remontée dans EquipementDetailPanel ; hooks
useEquipementDashboard et dashboardFilters (5 tests node:test) ; recharts ^3.10.1
(react-is résolu en 16.13.1 par prop-types, accepté par le peer de recharts).

Résultats : npm run build vert, chunk lazy des graphiques 425,96 kB (121,58 kB gzip),
chunk EquipementsPage 14,94 kB gzip ; check.sh vert. npm run lint : 328 erreurs
existantes avant et après, aucune ajoutée (comparaison relancée par l'agent principal).

Écarts : aucun test de composant (pas d'outillage de test de composants dans web/) ; le
droit et les filtres de la modale se vérifient à l'écran. Un clic sur un mois de
l'histogramme filtre par mois seulement. Correction de l'agent principal : « depuis la
mise en service » est borné aux 120 derniers mois (l'API refuse plus de 10 ans), avec
un test.

NON VÉRIFIÉ : rendu à l'écran, forme des arguments des clics de Recharts 3, tactile,
impression, format réel des couleurs de catégorie en base (nom Radix ou hexadécimal
acceptés).

Essai à l'écran : validé par l'utilisateur le 2026-11-16 sur un équipement réel (BRO001).
Correctif de l'agent principal après le premier essai : la fonction d'appel lisait response.data.data alors que le client déballe déjà l'enveloppe { data } (section bloquée en chargement), commit eb6699d.
