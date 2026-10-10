# 0012. Équipements : modifier la fiche sur place, champ par champ

- Statut : accepté
- Date : 2026-10-10
- Affine : ADR 0011, Décision 3.4 (mode de modification de la fiche)

## Contexte

L'ADR 0011 prévoyait de modifier la fiche d'un équipement en deux temps : un bouton
« Modifier » faisait passer la fiche en mode édition, puis on enregistrait ou on
annulait. Après avoir vu la page master-detail (étape 3), l'utilisateur demande une
modification sur place, à la manière des propriétés d'une page Notion. Sur le terrain,
on corrige en général une seule valeur à la fois : un statut, une classe, un
rattachement. Passer par un mode d'édition ajoute deux clics pour rien.

## Décision

1. La fiche n'a plus de bouton Modifier. Chaque propriété est une ligne : le libellé à
   gauche, la valeur à droite.
2. Pour qui détient `equipements:patch_equipement`, la valeur réagit au survol par un
   fond gris léger et un curseur. Un clic la remplace par le champ adapté à son type :
   - texte : nom, N° machine, emplacement, fabricant, N° de série ;
   - texte sur plusieurs lignes : notes ;
   - date : mise en service ;
   - liste : classe, statut ;
   - case à cocher : nœud de regroupement ;
   - recherche d'équipement : rattachement. La recherche exclut l'équipement lui-même
     et ses descendants, et propose « Aucun rattachement ».

   Le nom se modifie de la même façon dans l'en-tête. Le code n'est pas modifiable.
3. Entrée, ou un clic en dehors du champ, enregistre. Échap annule. Les notes, sur
   plusieurs lignes, s'enregistrent avec Ctrl+Entrée ou un clic en dehors, et Entrée y
   insère un retour à la ligne. Une valeur inchangée n'envoie rien.
4. Chaque enregistrement envoie un `PATCH /equipements/{id}` qui ne contient que ce
   champ. Vider un champ facultatif envoie `null`. Pendant l'enregistrement, la ligne
   affiche un indicateur discret.
   - En cas de réussite, la fiche est mise à jour avec le détail renvoyé par l'API, qui
     inclut la santé, le chemin et les descendants.
   - En cas d'erreur, la valeur précédente revient et le message de l'API s'affiche
     sous la ligne, par exemple un refus de cycle ou de profondeur.
5. Une valeur vide s'affiche comme un texte fantôme gris (« Vide »), cliquable comme
   les autres.
6. Sans la permission, la fiche reste en lecture seule : pas d'effet au survol, pas de
   champ.
7. Un changement de rattachement met aussi à jour la liste de gauche : l'arbre, le
   chemin affiché en mode à plat et la santé des anciennes et nouvelles mères.
8. Le backend ne change pas. Le PATCH, les règles de l'arbre, les droits TECH et
   l'audit routine existent déjà (ADR 0011, étapes 1 et 2). Chaque champ modifié laisse
   une ligne d'audit avec son auteur.

## Alternatives écartées

1. **Bouton Modifier, puis Enregistrer ou Annuler** (ADR 0011, 3.4). Écarté sur
   demande de l'utilisateur : trop de clics pour corriger une seule valeur.
2. **Enregistrement automatique à chaque frappe.** Écarté : cela multiplie les PATCH et
   les lignes d'audit, et une règle de l'arbre pourrait refuser une valeur
   intermédiaire.
3. **Ligne fantôme « + Ajouter » en bas des sous-équipements.** Proposée, mais non
   retenue par l'utilisateur pour l'instant. La création reste dans sa fenêtre
   dédiée (ADR 0011, 3.5).

## Conséquences

1. Une erreur de saisie s'enregistre dès qu'on quitte le champ. Le filet de sécurité
   est l'audit, qui garde l'ancienne valeur, l'auteur et la date.
2. Un composant de propriété modifiable est créé pour la fiche équipement. Il pourra
   servir à d'autres fiches, mais seulement par une décision séparée.
3. Le front n'a pas d'outillage de test : la vérification se fait à la main sur le
   serveur de dev, par l'utilisateur.
