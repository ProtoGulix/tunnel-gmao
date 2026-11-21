# Les codes

Tunnel donne un code lisible à ce qui circule dans la chaîne. Certains codes sont **générés**
par la base de données au moment de la création. D'autres sont **saisis** par vous. Cette
page dit lequel est lequel, et d'où vient chaque morceau.

![Anatomie des six codes de Tunnel : intervention, demande d'intervention, demande d'achat, commande fournisseur, pièce et équipement, avec l'origine de chaque morceau](/schemas/anatomie-des-codes.svg)

Les exemples viennent de la démonstration : équipement PR-01 (une presse), technicien aux
initiales JM, fournisseur FOU-A, plan de la classe PRESSE. Les dates et les numéros sont
inventés.

## Récapitulatif

| Élément | Forme | Généré ou saisi | Exemple |
| --- | --- | --- | --- |
| Demande d'intervention | `DI-AAAA-NNNN` | Généré | `DI-2026-0042` |
| Intervention | `équipement-type-AAAAMMJJ-initiales` | Généré | `PR-01-CUR-20261105-JM` |
| Demande d'achat | `DA-AAAA-NNNN` | Généré | `DA-2026-0017` |
| Commande fournisseur (panier) | `CMD-AAAAMMJJ-NNNN` | Généré | `CMD-20261105-0007` |
| Pièce (référence interne) | `P` et six chiffres | Généré | `P000123` |
| Équipement | libre | Saisi, ou calculé s'il est vide | `PR-01` |
| Plan préventif | libre | Saisi | `PRE-PRESSE-TRIM` |

## Demande d'intervention : `DI-AAAA-NNNN`

- `DI` : demande d'intervention.
- `AAAA` : l'année du jour de création.
- `NNNN` : un numéro sur quatre chiffres, qui recommence à 0001 chaque année. Tunnel prend le
  plus grand numéro déjà utilisé cette année et ajoute 1. Supprimer une demande ne crée donc
  pas de collision.

Le code est posé par la base à la création de la demande. Source : la fonction
`fn_generate_request_code` dans `backend/db/schema.sql`.

## Intervention : `équipement-type-AAAAMMJJ-initiales`

Le code d'une intervention se lit de gauche à droite :

1. **L'équipement** : le code de l'équipement concerné (`PR-01`).
2. **Le type** : le code du type d'intervention, par exemple `CUR` (curatif) ou `PRE`
   (préventif). Les types sont réglés dans les référentiels.
3. **La date** : le jour de **création** de l'intervention, au format `AAAAMMJJ`. Ce n'est
   pas la date de prise en charge saisie dans le formulaire.
4. **Les initiales** : celles du technicien pilote. Si vous choisissez un technicien dans la
   liste, Tunnel lit ses initiales dans sa fiche utilisateur. Sinon, ce sont les initiales
   fournies à la création.

Exemple : `PR-01-CUR-20261105-JM`, une intervention curative sur PR-01, créée le
5 novembre 2026, pilotée par JM.

Règles à connaître :

- le code est posé **une seule fois**, à la création. Changer ensuite le type ou le
  technicien ne le modifie pas ;
- l'équipement, le type et les initiales sont obligatoires pour générer le code. Sans eux, la
  création est refusée ;
- Tunnel refuse de créer une intervention quand une autre existe déjà pour le même
  équipement, le même type et les mêmes initiales le même jour. Le message propose de
  changer les initiales ou le type.

Sources : la fonction `generate_intervention_code` (`backend/db/schema.sql`), la résolution
des initiales dans `InterventionRepository` (`backend/api/interventions/repo.py`) et la
règle d'unicité dans `backend/api/interventions/validators.py`.

## Demande d'achat : `DA-AAAA-NNNN`

Même principe que la demande d'intervention : `DA`, l'année du jour de création, puis un
numéro sur quatre chiffres qui recommence chaque année (le plus grand numéro de l'année plus
1). Si un code est fourni à la création, Tunnel le garde tel quel.

Source : la fonction `fn_generate_purchase_request_code` dans `backend/db/schema.sql`.

## Commande fournisseur : `CMD-AAAAMMJJ-NNNN`

Un panier fournisseur est une commande. Son numéro se compose de :

- `CMD` ;
- la date du jour de création du panier ;
- un numéro sur quatre chiffres.

Attention : ce numéro vient d'une **séquence unique**. Il ne recommence ni chaque jour ni
chaque année. Deux paniers créés le même jour n'ont pas forcément des numéros consécutifs
si d'autres numéros ont été attribués entre-temps.

Source : la fonction `generate_supplier_order_number` et la séquence `supplier_order_seq`
dans `backend/db/schema.sql`.

## Pièce : la référence interne

La référence interne d'une pièce est la lettre `P` suivie de six chiffres (`P000123`). Elle
est attribuée automatiquement à la création de la pièce, par une séquence. Vous ne la
saisissez pas.

Les références du **fabricant** et du **fournisseur** sont d'autres choses : elles se
saisissent sur la pièce. Voir [Achats](/comprendre/achats).

Source : la colonne `internal_ref` de la table `part` et la séquence `part_internal_ref_seq`
dans `backend/db/schema.sql`.

## Équipement : saisi, ou calculé

Le code d'un équipement est un texte libre. Vous pouvez le saisir (dans la démonstration :
`PR-01`, `ATL-INJ`, `MRV`).

Si vous créez un équipement sans code, Tunnel en calcule un :

- avec une classe et un numéro de machine : le code de la classe suivi du numéro sur trois
  chiffres. La classe `PRESSE` et le numéro 1 donneraient `PRESSE001` ;
- sans classe ou sans numéro : `EQ` et trois chiffres, en prenant le premier numéro libre
  après le plus grand `EQnnn` existant.

Source : `build_equipement_code` dans `backend/api/equipements/validators.py`.

## Plan préventif : saisi

Le code d'un plan est **saisi** par la personne qui le crée. Tunnel ne le génère pas. Le
formulaire web n'accepte que des majuscules, des chiffres et des tirets bas, et le code ne
change plus ensuite (voir [Préventif](/responsable/preventif)).

Dans la démonstration, les plans ont des codes comme `PRE-PRESSE-TRIM`. Ils ont été chargés
par un script, qui ne passe pas par le formulaire : le formulaire web refuserait les tirets.

Sources : `PreventivePlanForm.jsx` pour la règle du formulaire (`web/src/components/preventive/`),
`backend/api/preventive_plans/schemas.py` pour le code reçu par l'API.
