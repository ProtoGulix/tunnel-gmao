# 0014. Interventions : supprimer la page complète de détail

- Statut : accepté
- Date : 2026-10-11
- Affine : ADR 0013 (décision 1 et alternative 3 : la page complète n'est plus conservée)

## Contexte

Une intervention s'ouvre de deux façons dans le front web :

- dans le panneau droit de la page Interventions (master-detail, `/interventions?id=…`) ;
- sur une page complète, `/intervention/:id`.

Depuis l'ADR 0013, ces deux vues n'ont plus le même en-tête. La page complète garde
les gros boutons que l'ADR 0013 a retirés du panneau, et elle n'apporte rien que le
panneau n'offre déjà. L'utilisateur demande sa suppression.

Inventaire de ce qui dépend de `/intervention/:id` :

- les QR codes des fiches déjà imprimées, qui pointent vers `/interventions/{id}`
  (`EXPORT_QR_BASE_URL`). Cette adresse redirige aujourd'hui vers `/intervention/{id}` ;
- huit liens internes : préventif (trois), détail d'une demande d'intervention,
  notifications, redirection après création, et deux composants que plus rien
  n'importe ;
- d'éventuels favoris et d'anciens liens partagés.

## Décision

1. La page complète est supprimée. Le détail d'une intervention ne s'affiche plus
   que dans le panneau droit de la page Interventions.
2. Les adresses `/intervention/:id` et `/interventions/:id` restent valides, mais
   redirigent vers `/interventions?id=…`. Les QR codes imprimés, les favoris et les
   anciennes notifications ouvrent donc le master-detail sur la bonne intervention.
   Le backend et `EXPORT_QR_BASE_URL` ne changent pas.
3. Les liens internes et la redirection après création pointent directement vers
   `/interventions?id=…`, par `entityCodeUrl('intervention', id)` (ADR 0009).
4. `pages/interventions/InterventionDetailPage.jsx` ne garde que le mode panneau et
   devient `components/interventions/InterventionDetailPanel.jsx`, puisque ce n'est
   plus une page. Le prop `embedded`, les gros boutons et l'usage de `PageHeader`
   disparaissent avec la page.
5. Deux composants morts sont supprimés : `InterventionDetailView.jsx` et
   `tabs/InterventionsListTab.jsx`. Plus rien ne les importe, et ils pointaient
   encore vers la page complète.
6. Ne changent pas : la page de création `/intervention/new` et le front mobile, qui
   a sa propre page de détail sous `/m`.

## Alternatives écartées

1. **Appliquer à la page complète l'en-tête de l'ADR 0013.** Cela garderait deux vues
   à maintenir pour le même contenu, sans usage identifié.
2. **Supprimer aussi les adresses `/intervention/:id` et `/interventions/:id`.** Les
   QR codes des fiches déjà imprimées mèneraient à une page vide.
3. **Changer `EXPORT_QR_BASE_URL` pour pointer vers `/interventions?id=`.** Cela ne
   règle pas le cas des fiches déjà imprimées, et touche la configuration de
   déploiement pour rien.

## Conséquences

- Un seul affichage du détail d'une intervention à maintenir dans le front web.
- Les adresses historiques coûtent deux redirections dans le routeur, sans code
  métier.
- Les onglets du détail utilisent toujours le paramètre `dtab` (et plus `tab`),
  puisque `tab` appartient à la page Interventions.
