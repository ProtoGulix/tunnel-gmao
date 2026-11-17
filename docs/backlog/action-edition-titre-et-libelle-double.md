# Formulaire d'édition d'une action : titre et libellé en double

Constaté à l'écran le 2026-11-17 (ENV-01) :

1. Le formulaire ouvert par « Éditer » sur une action est titré « Nouvelle action » et
   son bouton dit « Enregistrer » avec une icône « + » : rien n'indique une
   modification (ActionItemCard.jsx réutilise ActionForm sans mode édition).
2. Quand la description d'une action reprend le libellé de sa tâche, la carte affiche
   ce texte deux fois (ligne de tâche, puis description). NON VÉRIFIÉ : donnée saisie
   ainsi, ou description préremplie avec le libellé de la tâche à la création.
