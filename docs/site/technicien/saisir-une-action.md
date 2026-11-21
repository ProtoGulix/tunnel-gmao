# Saisir une action

L'action est ce que vous avez réellement fait. Le temps, le type de travail et la
complexité se saisissent ici, pas sur l'intervention.

![Formulaire Nouvelle action sur le mobile](/captures/mobile-technicien-action.webp)

## Sur le mobile

Ouvrez l'intervention, puis touchez **Ajouter une action**. Le formulaire **Nouvelle
action** s'affiche. L'équipement et l'intervention sont déjà remplis.

Depuis ailleurs (par exemple le planning), choisissez d'abord l'**Équipement**, puis
l'**Intervention** parmi celles qui sont ouvertes, en cours ou en attente. Le bouton
**Nouvelle intervention** permet d'en créer une sur place.

### Les champs

1. **Tâche** (obligatoire). Choisissez une tâche ouverte de l'intervention. S'il n'y en a
   pas, touchez **Nouvelle tâche**, saisissez un libellé et validez. Cochez **Cette action
   termine la tâche** si c'est le cas.
2. **Date.** Aujourd'hui par défaut.
3. **Plage horaire** et **Durée.** Saisissez l'heure de début et l'heure de fin : la durée
   se calcule seule, arrondie au quart d'heure. Elle est en lecture seule (cadenas).
4. **Type.** Touchez le champ : la liste propose les catégories et leurs sous-catégories.
5. **Description de l'action** (obligatoire). Dites ce qui a été fait : diagnostic,
   réparation, remplacement.
6. **Complexité** (obligatoire), de 1 à 10, de « Très simple » à « Expert ».
7. **Facteurs de complexité.** Ce champ apparaît quand la complexité dépasse 5. Il devient
   alors obligatoire : choisissez le facteur qui explique la difficulté.

Touchez **Enregistrer**. L'écran confirme « Action enregistrée ! ».

### Ce que Tunnel vérifie

- Il faut une intervention et une tâche liée.
- La description est obligatoire.
- La complexité doit être entre 1 et 10.
- Au-delà de 5, un facteur est requis.
- Côté serveur, le temps doit être un multiple d'un quart d'heure, avec un minimum de
  15 minutes.

Si un contrôle échoue, un cadre rouge **Erreur** liste ce qu'il faut corriger. Rien n'est
enregistré tant que ce n'est pas corrigé.

Si vous quittez le formulaire après avoir commencé à le remplir, l'application demande
confirmation.

### Après la saisie

Si votre action termine la dernière tâche ouverte, l'application propose de clore
l'intervention (voir [Clore ou rouvrir](/technicien/cloturer-rouvrir)).

## Sur le web

Depuis l'accueil, le bouton d'ajout d'action d'une tâche ouvre la fenêtre de saisie avec
l'intervention et la tâche déjà choisies. Le formulaire **Nouvelle action** reprend les
mêmes règles : durée au quart d'heure (0h15 minimum), tâche liée, description,
complexité, et **Facteurs de complexité** obligatoires pour une complexité supérieure à 5.
Le bouton est **Enregistrer**.

## Limite

La saisie exige le réseau. Il n'y a pas de saisie hors ligne.
