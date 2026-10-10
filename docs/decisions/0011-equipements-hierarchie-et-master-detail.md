# 0011. Équipements : la hiérarchie mère/fille comme découpage, une page master-detail

- Statut : accepté
- Date : 2026-10-10
- Affine : CLAUDE.md section 4 (dualité machine/équipement), docs/guides/conventions-web.md §8.7

## Contexte

La page Équipements du front web ne suit pas le modèle du reste de l'application.
Interventions, Demandes, Préventif, Stock, Fournisseurs et Achats utilisent tous
`MasterDetailLayout` : une liste à gauche avec recherche et filtres, le détail à droite,
et l'élément sélectionné dans l'URL (`?id=`). Les équipements, eux, s'affichent sur deux
pages séparées :

- `/equipements` : un `DataTable` paginé dans un `Container`, avec des onglets Radix et un
  formulaire de création intégré au tableau ;
- `/equipements/:id` : une `BriefingPage` filtrée sur l'équipement, avec sa propre hauteur
  et son propre en-tête.

Plusieurs fichiers sont du code mort : `EquipementDetailTab`, ainsi que les onglets Info,
Enfants, Stats, Interventions et Préventif.

Les données posent un problème plus profond que l'esthétique.

1. **Le découpage du parc n'a aucune structure.** La table `machine` n'a ni ligne, ni
   zone, ni atelier. Le seul champ de localisation, `affectation`, est un texte libre. Le
   rattachement `equipement_mere` existe mais reste faible :
   - le front ne sait pas le modifier : aucun écran ne permet de changer le parent d'un
     équipement existant ;
   - le backend ne le protège pas : pas de clé étrangère déclarée, pas de contrôle de
     cycle, un équipement peut être son propre parent.
2. **La vision d'ensemble est donc impossible.** Pour savoir ce qui se passe sur une
   ligne de production, il faudrait regrouper ses machines. Aucune vue ne le fait. Seules
   les statistiques de consommation regroupent par équipement mère (`stats/repo.py`), ce
   qui montre que ce besoin existe déjà.
3. **Le front ne permet pas de modifier un équipement.** `updateEquipement` et
   `deleteEquipement` existent dans les hooks, mais aucun écran ne les appelle. Corriger
   un statut, une classe ou un rattachement exige aujourd'hui de passer par l'API ou la
   base.

Le constat terrain est le suivant : si les équipements sont bien découpés, c'est-à-dire
si les lignes sont décrites comme des équipements mères et les machines comme leurs
filles, alors l'outil donne de lui-même le bon regroupement et la bonne vision. Pour cela,
il n'y a pas de nouveau concept à inventer. Il faut rendre la hiérarchie existante
fiable, visible et modifiable.

## Décision

### 1. La hiérarchie mère/fille est le seul axe de découpage du parc

1. Une ligne de production, un atelier ou un groupe de machines se décrit comme un
   équipement mère. Les machines sont ses filles, et une machine peut à son tour avoir des
   filles (sous-ensembles). Aucune table ni colonne « ligne », « zone » ou « site » n'est
   ajoutée.
2. Le parent d'un équipement s'appelle désormais son **rattachement**. Le chemin complet
   (par exemple « Ligne 2 › Presse P4 › Groupe hydraulique ») est calculé à partir de la
   hiérarchie. C'est lui qu'on affiche partout où l'on doit situer un équipement.
3. Le champ texte `affectation` est conservé. Il ne sert plus à structurer le parc. Il
   devient une précision libre sur l'emplacement physique, comme « mur nord » ou
   « travée 3 ». Les valeurs actuelles décrivent souvent une ligne. Leur conversion en
   rattachements fera l'objet d'un état des lieux en lecture seule, puis d'un script
   relu et validé par l'utilisateur avant toute écriture (CLAUDE.md 11.4).
4. `is_mere` garde son sens : « nœud de regroupement », qui peut avoir des filles même
   s'il n'en a pas encore. Un équipement qui a des filles est traité comme une mère,
   quelle que soit la valeur du drapeau.
5. Une ligne de production porte la classe LIGNE. Cette classe existe déjà dans les
   données de l'usine. Les classes ne font pas partie des données de référence : chaque
   entreprise crée les siennes. Le code ne s'appuie donc jamais sur le code de classe
   « LIGNE ». Les seuls marqueurs techniques d'un regroupement restent `is_mere` et la
   présence de filles. La classe sert au filtrage et à la lecture.

### 2. Le backend garantit l'intégrité de l'arbre

1. Une migration ajoute les clés étrangères manquantes sur `machine` : `equipement_mere`
   vers `machine.id` avec `ON DELETE RESTRICT`, ainsi que `equipement_class_id` et
   `statut_id`. Avant la migration, une requête en lecture seule vérifie qu'aucune
   donnée orpheline ne la ferait échouer.
2. `validators.py` refuse quatre cas, avec une `ValidationError` explicite :
   - un équipement rattaché à lui-même ;
   - un rattachement qui crée un cycle, vérifié par une requête récursive sur les
     ancêtres ;
   - une profondeur supérieure à 4 niveaux, par exemple ligne › machine ›
     sous-ensemble › organe. La limite a été validée par l'utilisateur le 2026-10-10 ;
   - la suppression d'un équipement qui a des filles.
   La même vérification s'applique à `children_ids`, dans `_assign_children`.
3. La liste accepte un filtre par sous-arbre : tous les descendants d'un équipement, pas
   seulement ses filles directes. Le détail expose le chemin des ancêtres et le nombre de
   descendants.
4. Les vues d'activité du détail (interventions, demandes, préventif, santé) acceptent
   `include_descendants`. Pour une mère, la valeur par défaut est vraie : regarder une
   ligne, c'est voir ce qui se passe sur toutes ses machines. La santé d'une mère est
   celle de sa fille la plus dégradée, avec la raison et le nom de cette fille.
5. L'appel du front à `GET /equipements/{id}/children`, qui n'existe pas côté backend,
   est remplacé par le filtre de liste.

Toute modification de l'API publique ou du schéma de cette section exige l'accord de
l'utilisateur au moment de l'implémentation (CLAUDE.md 11.5). Cet ADR en est la
proposition.

### 3. Le front web : une seule page en master-detail

1. `/equipements` utilise `MasterDetailLayout` en mode `freeDetail` avec le ratio
   `35% 1fr`, comme Interventions et Demandes. La sélection est portée par `?id=`.
   `/equipements/:id` devient un alias qui redirige vers `/equipements?id=…`, sur le
   modèle d'`InterventionAliasRedirect`, pour que les liens et codes cliquables restent
   valides.
2. **Liste (panneau gauche).** Deux modes, au choix par un interrupteur dans
   `headerExtra` :
   - **Arbre** (par défaut) : les mères dépliables, les filles en retrait ;
   - **À plat** : la liste paginée actuelle, utile pour une recherche.
   Une recherche bascule automatiquement en mode à plat et affiche le chemin de chaque
   résultat.
   Chaque ligne de la liste affiche :
   - la pastille de santé ;
   - le code et le nom ;
   - le chemin du rattachement, en gris, en mode à plat seulement ;
   - le badge de statut.
   La classe et la cause de santé passent en infobulle. Le filtre par classe reste
   disponible dans `headerExtra`.
3. **Détail (panneau droit).** Un en-tête avec le fil d'Ariane du chemin (chaque
   ancêtre est cliquable), le code, le nom, la santé et le statut. Puis trois sections :
   - **Fiche** : rattachement, classe, statut, N° machine, emplacement (`affectation`),
     fabricant, N° de série, mise en service, notes ;
   - **Sous-équipements** : les filles directes, cliquables, avec leur santé, et un bouton
     « Rattacher un équipement existant » ;
   - **Activité** : demandes, interventions et préventif, avec la case « inclure les
     sous-équipements », cochée par défaut pour une mère. Ce contenu reprend celui
     qu'affiche aujourd'hui `BriefingPage`. Choisir une DI ou une intervention ouvre sa
     page habituelle : la page Équipements ne contient pas un troisième panneau.
4. **Modification.** La fiche est modifiable sur place par qui détient
   `equipements:update_equipement`. On passe en mode édition par un bouton, puis on
   enregistre ou on annule. Sans cette permission, la fiche reste en lecture seule et le
   bouton n'apparaît pas.

   Les techniciens doivent pouvoir modifier une fiche et son rattachement : ce sont eux
   qui connaissent le terrain (décision de l'utilisateur, 2026-10-10). La matrice par
   défaut (`db/default_permissions.py`) ajoute donc à `TECH_WRITES` les méthodes PUT et
   PATCH du module equipements. La création et la suppression restent réservées à RESP
   et ADMIN, comme pour les interventions. ACHETEUR et MCP restent en lecture seule.
   Le bootstrap n'applique ce nouveau défaut qu'aux permissions qu'aucun admin n'a
   modifiées (ADR 0007). Chaque modification est tracée dans `audit_log`, avec son
   auteur réel. Champs modifiables :

   | Champ | Liste | Détail | Modifiable |
   |---|---|---|---|
   | Code | oui | oui | non : il est référencé partout, et il est généré à la création |
   | Nom | oui | oui | oui |
   | Rattachement (parent) | chemin, en mode à plat | fil d'Ariane et champ | oui, via une recherche qui exclut l'équipement lui-même et ses descendants |
   | Classe | infobulle, filtre | oui | oui |
   | Statut | badge | oui | oui |
   | Santé | pastille | oui, avec la raison | non, elle est calculée |
   | N° machine, emplacement, fabricant, N° série, mise en service, notes | non | oui | oui |
   | Nœud de regroupement (`is_mere`) | icône | oui | oui, sauf s'il a des filles |

   La suppression n'est proposée que pour un équipement sans fille et sans historique.
   Le backend reste juge dans tous les cas.
5. **Création.** Le formulaire inline sort du tableau et passe dans une modale. Celle-ci
   s'ouvre aussi depuis la section Sous-équipements, avec le rattachement déjà rempli.
6. L'onglet « Classes » quitte la page Équipements. Les classes se gèrent déjà dans les
   référentiels d'administration (`AdminRefEquipementClassesSection`).
7. Le code mort (`EquipementDetailTab` et ses onglets, `EquipementInfoBanner`) est
   supprimé. Les statistiques de `PageHeader` qui ne portaient que sur la page affichée
   sont retirées.
8. `conventions-web.md` §8.7 décrit un `TwoPanelLayout` qui n'existe pas. Le guide est
   corrigé pour désigner `MasterDetailLayout` comme le layout liste/détail de référence.
   L'arborescence périmée d'`architecture-web.md` est mise à jour.

### 4. Hors périmètre

Le mobile est hors périmètre. Il bénéficiera du chemin du rattachement exposé par l'API,
mais sa refonte éventuelle fera l'objet d'une entrée de backlog. L'import en masse d'un
arbre d'équipements est hors périmètre lui aussi.

## Alternatives écartées

1. **Ajouter un référentiel site, zone, ligne** (tables dédiées et colonnes sur
   `machine`, à la manière d'ISO 14224). Écarté parce que cela crée deux structures
   parallèles qui finissent par se contredire. Ce serait aussi trop rigide pour une PME
   dont les lignes ne sont pas toutes organisées de la même façon. La hiérarchie
   d'équipements existe déjà, les stats l'utilisent, et elle exprime n'importe quel
   découpage. C'est la sobriété demandée par la philosophie du projet.
2. **Structurer avec le champ `affectation`** : listes de valeurs, ou regroupement par
   texte identique. Écarté : un texte libre ne donne ni agrégation fiable ni niveaux, et
   une faute de frappe crée une ligne fantôme.
3. **Garder deux pages, liste et détail, en restylant seulement le tableau.** Écarté :
   l'utilisateur perd son contexte à chaque aller-retour, et la page reste la seule de
   l'application à fonctionner ainsi.
4. **Afficher l'arbre seul, sans mode à plat.** Écarté : chercher un équipement par code
   ou par nom dans un arbre replié n'est pas praticable, et le terrain cherche surtout par
   code.
5. **Hiérarchie sans limite de profondeur.** Écarté : au-delà de 4 niveaux, l'arbre
   devient illisible dans un panneau de 35 %, et les requêtes récursives n'ont plus de
   borne. On pourra relever la limite par un nouvel ADR si un vrai besoin apparaît.

## Conséquences

1. La qualité de la vision dépend de la qualité du découpage saisi. Un parc mal rattaché
   donnera une vue pauvre. L'écran de modification du rattachement et l'état des lieux de
   `affectation` sont donc le cœur du chantier, pas un détail.
2. Une migration de schéma (clés étrangères) et des changements d'API rétrocompatibles
   (nouveaux paramètres et champs, aucun champ retiré) sont nécessaires. Chacun demande
   l'accord de l'utilisateur et des tests :
   - autorisation par rôle : TECH, RESP et ADMIN peuvent modifier ; ACHETEUR et MCP sont
     refusés ; TECH ne peut ni créer ni supprimer ;
   - refus du cycle, de l'auto-rattachement et de la profondeur excessive ;
   - refus de la suppression d'une mère.
3. Les anciennes URL `/equipements/:id` continuent de fonctionner grâce à la
   redirection.
4. La santé et l'activité agrégées d'une mère coûtent une requête récursive. Il faudra
   la mesurer sur la base réelle avant la livraison.
5. Ordre de réalisation proposé, une branche par étape :
   1. Backend : intégrité de l'arbre (clés étrangères, validators, tests).
   2. Backend : chemin, sous-arbre, `include_descendants`.
   3. Front : page master-detail, liste arbre et à plat, détail en lecture seule.
   4. Front : modification de la fiche et du rattachement, création en modale.
   5. État des lieux d'`affectation`, puis conversion validée par l'utilisateur.
   6. Nettoyage du code mort et des guides.
6. Points tranchés par l'utilisateur le 2026-10-10 :
   - la profondeur est limitée à 4 niveaux ;
   - la classe LIGNE existante sert aux lignes, aucune classe n'est ajoutée ;
   - TECH peut modifier une fiche et son rattachement.

## Constat du 2026-10-10 (diagnostic en lecture seule de la base de dev)

Ajout factuel, la décision ne change pas.

1. Aucune donnée ne bloque l'ajout des clés étrangères. On ne trouve ni parent
   inexistant, ni auto-rattachement, ni cycle, ni classe ou statut orphelin. La
   profondeur maximale actuelle est de 2.
2. Le découpage par ligne n'existe pas encore dans les données :
   - 338 des 346 équipements sont rattachés directement à un site (VLT : 244,
     SML : 94) ;
   - les lignes existent comme équipements mères (L000 à L025), mais n'ont aucune
     fille ;
   - ces lignes sont en classe EXT, et non dans la classe LIG « Ligne », que
     n'utilise aucun équipement.
3. `affectation` vaut « 0 » sur 320 équipements et est vide sur les autres. La
   conversion prévue en section 1, point 3, est donc sans objet. Le travail de données
   consiste à rattacher les machines à leurs lignes depuis l'écran de modification.
   Vider le résidu « 0 » est une écriture en base : elle se fera sur accord.
