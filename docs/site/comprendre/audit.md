# Audit : travail routinier ou décision

Tunnel enregistre ce qui s'est réellement passé, et qui l'a fait. Une trace qu'on peut
falsifier ne vaut rien. Cette page explique comment il distingue le **travail normal** d'une
**décision**.

![Une modification passe par une règle d'audit : si elle est routinière, elle s'enregistre avec un motif par défaut ; si elle est sensible, la fenêtre de motif s'ouvre et la modification est refusée sans motif ; dans les deux cas elle entre dans le journal](/schemas/regle-audit.svg)

## Travail normal et décision

- Le **travail normal** se raconte par les **actions** : temps, nature, complexité. Créer une
  demande, une intervention ou une action est routinier. Rien de plus n'est demandé.
- Une **décision** est un changement qui ne vient pas d'une action : clôturer, rouvrir,
  ignorer une tâche ou une occurrence, rejeter une demande, supprimer. Pour une décision,
  Tunnel veut savoir **pourquoi**.

Dans les deux cas, l'**auteur** et la date sont toujours enregistrés. L'auteur est la personne
connectée, prise du jeton de connexion. Un champ « au nom de » (le technicien d'une action,
le demandeur d'une demande d'achat) reste une information libre, jamais une preuve
d'identité.

## Les règles d'audit

C'est une **règle d'audit** qui décide, par type d'élément et parfois par champ :

- **routinière** : le changement s'enregistre avec un motif par défaut, sans rien vous
  demander ;
- **sensible** : la **fenêtre de motif** s'ouvre, et la modification est refusée sans motif.

L'administrateur gère ces règles. Voir [Audit : règles et raisons](/administrateur/audit).

## Les motifs

Un **motif** (ou raison) est un code, un libellé, une catégorie et les décisions où il est
proposé. Un motif sert à une décision précise : on ne vous propose pas « Doublon » pour
rouvrir une intervention.

Il n'y a **aucun motif codé en dur** dans l'application. Si un motif manque, l'administrateur
l'ajoute dans les données de référence. Avec « Autre raison », un texte de précision est
obligatoire.

## La fenêtre de motif

Quand un motif est demandé, la **même fenêtre** s'ouvre partout dans Tunnel, sur le web comme
sur le mobile :

1. choisissez une raison dans la liste ;
2. ajoutez une précision, obligatoire avec « Autre raison » ;
3. confirmez.

Si vous fermez la fenêtre, rien n'est modifié. Voir [Audit et motifs](/responsable/audit-motifs).

## Les décisions qui exigent toujours un motif choisi

Pour ces décisions, la règle d'audit routinière ne suffit pas : le serveur refuse si l'on
n'a pas choisi un motif explicite.

| Décision | Motifs proposés |
| --- | --- |
| Rejeter une demande d'intervention | Les motifs de rejet. Règle ajoutée par l'ADR 0038. |
| Rouvrir une intervention fermée | Les motifs de réouverture. |
| Terminer une tâche sans action | Les motifs de clôture de tâche. |
| Ignorer une tâche | Les motifs d'abandon de tâche. |
| Ignorer une occurrence préventive | Les motifs d'occurrence ignorée. |

Les motifs de départ sont décrits dans les pages par rôle : voir
[Traiter les demandes](/responsable/demandes),
[Interventions et tâches](/responsable/interventions-taches) et
[Préventif](/responsable/preventif).

Source : `ensure_reject_reason` (`backend/api/intervention_requests/validators.py`),
`ensure_reopen_reason` (`backend/api/interventions/validators.py`) et
`ensure_explicit_close_reason` (`backend/api/intervention_tasks/validators.py`).

### Le rejet d'une demande

Rejeter n'est jamais routinier. Le motif est choisi parmi les motifs de rejet, **quelle que
soit** la règle d'audit de l'installation. « Autre raison » demande un texte. Le texte saisi
est aussi copié dans l'historique de la demande. Une demande rejetée ne change plus ; si elle
venait du préventif, son occurrence devient « ignorée ».

### La réouverture

Rouvrir une intervention fermée exige toujours un motif. La demande liée repasse
« acceptée », l'occurrence préventive liée repasse « en cours », et chaque effet laisse son
événement dans le journal. Voir [Interventions et tâches](/comprendre/interventions-taches).

## Le journal

Le **journal d'audit** garde, pour chaque décision : la date, l'élément concerné, le type de
décision, l'ancienne et la nouvelle valeur, le motif, la précision et l'auteur.

Il est **en ajout seul** : les tables de journal n'acceptent ni modification ni suppression par
l'application. La modification et le motif s'écrivent dans la même transaction : si l'audit
échoue, la modification n'a pas lieu. Voir
[Sécurité et clés d'API](/administrateur/securite).

Source : `APPEND_ONLY_TABLES` dans `backend/scripts/bootstrap.py`.

## Les événements du système

Quand une décision en entraîne d'autres, chaque effet laisse son propre événement :

- les **cascades** : clôturer une intervention clôt la demande liée et termine l'occurrence ;
  rouvrir fait l'inverse ; le dispatch crée des paniers et des lignes. Chaque événement est
  marqué « système » et attribué à **l'auteur de la requête** ;
- la **tâche quotidienne** : ses écritures s'enregistrent avec le motif `SYSTEM_SCHEDULE` et
  **sans auteur humain**.

Le [Bilan du service](/responsable/bilan) compte ces événements à part, dans « Modifications
automatiques », et résume les décisions de l'équipe sans nommer personne.
