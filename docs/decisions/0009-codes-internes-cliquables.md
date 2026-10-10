# 0009. Codes internes cliquables : un seul composant, une icône de lien

- Statut : accepté
- Date : 2026-10-08
- Affine : docs/guides/conventions-web.md

## Contexte

Sur la page d'accueil du front web, les codes internes (intervention, demande d'achat)
s'affichent comme des badges en police à chasse fixe, mais leur comportement varie
d'un endroit à l'autre et rien n'indique lequel est un lien. État constaté le
2026-10-08 :

| Endroit | Code affiché | Lien | Indice visuel |
|---|---|---|---|
| Volet « Tâches à exécuter » (TasksPane → GroupCard) | intervention | non | aucun |
| Planning, carte d'action (WeekCalendar, ActionItem inline) | intervention | oui, `<Link>` si l'id est connu | aucun |
| Planning, vue pleine Lun–Ven (ActionItem) | intervention | oui, `<Link>` | aucun |
| Planning, DA liées à une action | aucun : seul le libellé (item_label) | non | aucun |
| Vue direction technique (requestCardShared, InterventionLinkCell) | intervention | oui, mais `<a href>` : rechargement complet de l'application | aucun |
| Vue acheteur (BuyerHomeView, colonne Intervention) | intervention | non | aucun |

Les données nécessaires sont déjà renvoyées par l'API :

1. Volet tâches : chaque groupe de GET /intervention-tasks est une intervention, et
   group.id est son id (les tâches sans intervention sont exclues côté repo).
2. DA liées à une action : PurchaseRequestListItem porte id et code (DA-AAAA-NNNN).
3. Le lien profond vers une DA existe déjà : `/achats?tab=requests&requestId=<id>`
   (SupplierOrderLines, entityLinks, useSelectedIdParam).

Exception : la liste de DA de la vue acheteur ne porte que intervention_code, pas
l'id de l'intervention.

Constat annexe : le dernier groupe de la capture (« Graissage BROYEUR », 5 tâches)
s'affiche sans code. L'intervention existe (sinon le groupe serait exclu) mais son
code est vide. NON VÉRIFIÉ : origine de ce code vide (intervention créée par le
préventif ? donnée reprise de la v4 ?).

## Décision

1. Un composant partagé `EntityCodeLink` dans web/src/components/shared/ rend tout
   code interne cliquable : badge à chasse fixe (même style que GroupCard), suivi
   de l'icône lucide `ExternalLink` (taille 12), dans un `<Link>` de react-router.
   Au survol, la couleur passe à l'accent et le curseur devient une main. Un
   attribut title décrit la cible (« Ouvrir l'intervention L014-CUR-… »,
   « Ouvrir la demande d'achat DA-2026-0012 »).
2. Deux cibles seulement, construites dans le composant à partir d'un type et d'un
   id, pour que les URL ne soient écrites qu'à un endroit :
   - intervention → `/intervention/<id>`
   - demande d'achat → `/achats?tab=requests&requestId=<id>`
3. Règle d'affichage : un code avec icône est un lien, un code sans icône n'en est
   pas un. Sans id connu, le composant rend le badge seul, sans icône. Si l'id est
   connu mais le code vide, il rend « sans code » en gris, toujours cliquable.
4. Le clic sur le lien n'active pas le parent (stopPropagation), comme le fait déjà
   la carte d'action du planning.
5. Application sur l'accueil :
   - GroupCard reçoit une prop optionnelle `href` (ou l'id et le type) et utilise
     EntityCodeLink ; TasksPane la renseigne avec group.id.
   - ActionItem (inline et pleine) remplace ses deux `<Link>` par EntityCodeLink.
   - Les DA liées d'une action affichent EntityCodeLink (code DA + icône), puis le
     libellé et le statut dérivé déjà présents. L'icône Package qui ouvre la ligne
     disparaît : l'icône de lien la remplace, pour ne pas en aligner deux.
   - InterventionLinkCell passe de `<a href>` à EntityCodeLink.
6. Front uniquement : aucune modification de l'API ni du schéma.

## Alternatives écartées

1. Souligner le code comme un lien texte classique : peu lisible sur un badge à
   chasse fixe, et l'accueil affiche des dizaines de codes ; une icône se repère en
   balayage sans charger l'écran.
2. Une icône par type d'entité (clé pour une intervention, colis pour une DA) : elle
   dit ce qu'est l'objet, pas qu'on peut cliquer dessus, et ces icônes servent déjà
   à autre chose dans les mêmes lignes (origine d'une tâche, ligne de DA).
3. Rendre toute la ligne ou tout l'en-tête cliquable : l'en-tête de groupe et la
   carte d'action contiennent déjà des contrôles (achat, suppression, statut,
   échéance), un clic de ligne entrerait en conflit avec eux.
4. Ajouter intervention_id à PurchaseRequestListItem pour lier aussi la colonne
   Intervention de la vue acheteur : c'est une modification d'API publique, hors du
   périmètre de ce correctif. Noté dans le backlog (docs/backlog/da-liste-intervention-id.md).

## Conséquences

1. Tout nouveau code interne affiché dans le front web passe par EntityCodeLink ;
   la règle « icône = lien » est ajoutée à docs/guides/conventions-web.md.
2. Les autres pages (listes d'interventions, détail de DA, paniers) ne sont pas
   reprises par ce chantier ; elles le seront au fil des modifications.
3. ExternalLink suggère d'ordinaire une ouverture hors du site. Il est déjà employé
   pour des liens internes (PreventiveOccurrencesTab, TaskDetail) : on garde cette
   convention plutôt que d'en introduire une seconde.
4. Le front mobile n'est pas concerné.
5. Test : un test de composant vérifie l'URL produite pour chaque type, le rendu
   sans icône quand l'id manque et le libellé « sans code ».
