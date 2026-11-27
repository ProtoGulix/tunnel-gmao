# Audit : règles et raisons

Écran : **Administration**, onglet **Audit**. Trois sous-onglets : **Journal**, **Règles**
et **Raisons**.

![Administration, onglet Audit, sous-onglet Journal : filtres, puis date, entité, décision, modification, raison et auteur de chaque entrée](/captures/web-admin-audit.webp)

## Pourquoi un motif

Tunnel garde la trace de ce qui s'est réellement passé. Quand quelqu'un fait un changement
hors du travail normal (clôturer, rouvrir, annuler une tâche, rejeter une demande), il doit
choisir un motif dans une liste. C'est vous, l'administrateur, qui tenez cette liste et
décidez quand un motif est exigé.

## Journal

Le journal liste les décisions enregistrées. Chaque ligne montre la date, l'entité
concernée (intervention, demande d'intervention, demande d'achat, tâche, action,
équipement), le type de décision, la modification (avant et après), la raison, la
précision saisie en texte libre et l'auteur. Les événements faits par le système sont
repérés par « système ».

Filtres : entité, type de décision, raison, dates **Du** et **Au**. Les événements du
système sont masqués au départ. Cliquez sur **Filtrer** pour appliquer, **Réinitialiser**
pour tout effacer.

Le journal se consulte seulement : l'application ne permet ni de le modifier ni de
l'effacer.

## Règles

Une règle dit, pour une entité et un champ, si le changement est :

- **Routine** : aucune justification n'est demandée. Une raison par défaut est enregistrée
  automatiquement.
- **Sensible** : la personne doit choisir un motif dans la fenêtre prévue à cet effet.

Pour ajouter une règle :

1. Cliquez sur **Nouvelle règle**.
2. Choisissez l'entité.
3. Choisissez le champ. L'option « Règle par défaut de l'entité » couvre les créations et
   les champs sans règle propre. La liste propose les champs déjà vus dans le journal ;
   « Autre » permet de saisir le nom exact d'un champ jamais modifié.
4. Cochez **Routine** si aucune justification n'est utile, puis choisissez la raison par
   défaut (obligatoire pour une règle routine). Décochez pour une règle sensible.
5. Cliquez sur **Enregistrer**.

![Sous-onglet Règles : entité, champ, nature et raison par défaut de chaque règle](/captures/web-admin-audit-regles.webp)

![Fenêtre Nouvelle règle d'audit : entité, champ, case Routine et raison par défaut](/captures/web-admin-audit-regle-nouvelle.webp)

Le crayon d'une règle existante change sa nature et sa raison par défaut. L'entité et le
champ ne se modifient pas.

## Raisons

Chaque raison a un code, un libellé, une catégorie (Système, Manuelle ou Utilisateur), les
entités où elle est proposée, une couleur et un statut (Active ou Inactive).

- **Nouvelle raison** demande un code (en majuscules, par exemple `CLIENT_REQUEST`), un
  libellé et une catégorie. Les entités, la couleur et la description sont facultatives.
  Sans entité cochée, la raison est proposée partout.
- Le crayon change le libellé, la catégorie, les entités, la couleur et la description. Le
  code ne change pas.
- **Désactiver** retire la raison des listes de choix ; **Activer** la remet.

![Sous-onglet Raisons : code, libellé, catégorie, entités, couleur et statut](/captures/web-admin-audit-raisons.webp)

![Fenêtre Nouvelle raison d'audit : code, libellé, catégorie, entités compatibles, couleur et description](/captures/web-admin-audit-raison-nouvelle.webp)

Si une équipe a besoin d'un motif qui n'existe pas, ajoutez-le ici. Les écrans de saisie
utilisent tous cette même liste.

## Droits

Par défaut, le responsable peut consulter les règles et les raisons ; seul l'administrateur
les modifie.
