# Import CSV

L'import crée plusieurs demandes d'achat d'un coup depuis un fichier CSV. Il part d'un
fichier avec au moins une colonne de **références** et une colonne de **quantités**.

![Écran Demandes d'achat, bouton Import CSV](/captures/web-acheteur-demandes-achat.webp)

Ouvrez-le par le bouton **Import CSV** en haut de l'écran Demandes d'achat, ou par l'onglet
« Import CSV » de la fenêtre **Nouvelle demande**. Il est proposé selon vos droits.

## Les quatre étapes

**1. Fichier.**

- Déposez le fichier ou cliquez pour le choisir. Seuls les fichiers `.csv` sont acceptés. Le séparateur (`,` ou `;`) est reconnu automatiquement.
- Choisissez l'**intervention cible** : recherche par code ou titre parmi les interventions ouvertes. Elle est obligatoire.
- Choisissez l'**urgence globale** : Normal, Élevée ou Critique. Elle s'applique à toutes les lignes.

**2. Mapping.** Indiquez la colonne **référence** et la colonne **quantité**. Elles doivent
être différentes, et la colonne quantité doit contenir des nombres. Cliquez sur **Analyser** :
rien n'est créé à ce stade.

**3. Révision.** Tunnel cherche chaque référence dans le catalogue de pièces. Pour chaque
ligne, vous voyez la pièce trouvée, ou « À qualifier » si elle n'est pas reconnue.

- Les **doublons** sur la même intervention sont surlignés et décochés d'office.
- Les lignes dont une demande « À qualifier » existe déjà sont signalées et décochées d'office.
- Cochez ou décochez les lignes à importer, puis cliquez sur **Importer n demandes d'achat**.

**4. Rapport.** Un résumé indique le nombre de demandes créées, ignorées, à qualifier, en
doublon et en erreur, avec le détail ligne par ligne.

## Tout ou rien

Si une seule ligne est en erreur, l'import est **refusé en entier** : aucune demande n'est
créée, et un rapport liste toutes les lignes à corriger. Corrigez le fichier, puis
recommencez.

## Après l'import

Les demandes dont la référence n'a pas été reconnue sont « À qualifier » : voir
[Demandes d'achat](./demandes-achat). Les autres suivent le circuit normal.
