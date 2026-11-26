# Référentiels

Écran : **Administration**, onglet **Référentiel**. Les référentiels sont les listes de
choix que les équipes retrouvent dans les formulaires. Cet onglet a six sous-onglets :
Actions, Interventions, Constats, Classes d'équipement, Familles de pièces et Trames de référence.

Chaque code (par exemple celui d'une catégorie) est marqué d'un cadenas : il ne se modifie
pas. On change le libellé, pas le code.

Par défaut, l'administrateur et le responsable peuvent modifier les référentiels d'actions
et d'interventions. Les droits se règlent dans la [matrice](./roles-permissions).

## Actions

**Catégories d'actions.** Chaque ligne a un code, un nom et une couleur. Le crayon permet de
changer le nom et la couleur. Cliquez sur une ligne pour voir ses sous-catégories.

**Sous-catégories.** Dans une catégorie ouverte :

- **Ajouter** crée une sous-catégorie. Son code commence par celui de la catégorie, par
  exemple `CAT_` ; complétez-le, puis donnez un libellé.
- Le crayon change le libellé d'une sous-catégorie existante.

**Facteurs de complexité.** La liste est en lecture seule : code, libellé et catégorie.
L'écran ne permet pas de la modifier.

## Interventions

**Types d'intervention.** Pour chaque type : libellé, description et statut (Actif ou
Inactif).

- **Nouveau type** demande un code (mis en majuscules, par exemple `CURATIF`), un libellé et
  une description facultative.
- Le crayon change le libellé et la description. Le code ne change pas. À la modification
  seulement, la case **Constat obligatoire** exige un constat pour clore une intervention de
  ce type (cochée par défaut pour le curatif).
- **Désactiver** retire le type des choix proposés ; **Activer** le remet.

**Statuts d'intervention.** La liste est fixe : vous pouvez seulement changer le libellé et
la couleur d'un statut avec le crayon. L'écran ne propose pas d'en ajouter.

## Constats

Une question par bloc, ses choix en tableau : libellé, type préconisé, demande, exclusif,
ordre et statut. Une sous-question suit sa question, avec le choix qui la déclenche. Un
réglage ne vaut que pour les constats saisis ensuite : rien n'est recalculé.

- Le crayon d'un choix change son libellé, son ordre, son type préconisé (parmi les types
  d'intervention actifs), **Génère une demande** et **Exclusif** (un choix exclusif ne se
  combine avec aucun autre).
- **Choix** ajoute un choix à la question. Son code (majuscules, chiffres, `_`) ne change
  plus ensuite.
- **Désactiver** retire un choix du formulaire ; **Activer** le remet. Le dernier choix actif
  d'une question ne se désactive pas. Rien ne se supprime.
- Le crayon d'une question change son libellé ; les questions elles-mêmes sont fixes.

## Classes d'équipement

Une classe regroupe des équipements de même nature (par exemple les presses). Pour chaque
classe : code, libellé, description, puis une colonne par type d'intervention actif.

- **Nouvelle classe** crée une classe ; le crayon la modifie.
- La corbeille la supprime. La suppression échoue si des équipements utilisent encore la
  classe, et elle est irréversible.

### Types d'intervention permis par classe

Cochez, pour une classe, les types d'intervention qu'on peut ouvrir sur ses équipements.
Chaque case s'enregistre au clic. **Aucune case cochée : tous les types sont permis.** Un
badge « tous permis » le rappelle sur la ligne.

## Familles de pièces et trames de référence

Ces deux sous-onglets portent sur le catalogue de pièces. Ils sont les mêmes que ceux du
stock, que l'acheteur utilise.
