# Spécifications Standard des Articles

## Vue d'ensemble

Cette fonctionnalité permet d'ajouter des spécifications techniques détaillées pour chaque article de stock. Ces spécifications sont essentielles pour :
- Fournir des détails précis aux fournisseurs dans les demandes de prix
- Standardiser les descriptions techniques
- Améliorer la communication avec les fournisseurs

## Structure de la base de données

```sql
CREATE TABLE stock_item_standard_spec (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_item_id     UUID NOT NULL REFERENCES stock_item(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  spec_text         TEXT NOT NULL,
  is_default        BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Utilisation dans l'interface

### 1. Gestion des spécifications

Dans l'onglet **"Articles en stock"** :
- Cliquez sur l'icône 📄 pour ouvrir le panneau de spécifications
- Ajoutez, modifiez ou supprimez des spécifications
- Marquez une spécification comme "par défaut" pour l'utiliser automatiquement

### 2. Recherche et réutilisation de spécifications

**Nouveau** : Vous pouvez maintenant rechercher et copier des spécifications existantes !

Dans le panneau de spécifications :
- Cliquez sur **"🔍 Rechercher une spécification"**
- Recherchez parmi toutes les spécifications existantes (tous articles confondus)
- Copiez une spécification vers l'article actuel en 1 clic
- Gain de temps : plus besoin de ressaisir les mêmes spécifications

**Cas d'usage** :
- Vous avez défini une spec détaillée pour "Vis M8 x 20mm"
- Vous voulez l'appliquer à tous vos articles de vis M8
- Recherchez "M8", trouvez la spec, copiez-la vers les autres articles

👉 Voir la documentation complète : [Search Specs Feature](../../../docs/features/search-specs.md)

### 2. Affichage dans les demandes d'achat

Lorsque vous liez un article à une demande d'achat :
- Les spécifications standard s'affichent automatiquement
- La spécification marquée "par défaut" est affichée en priorité
- Aide à qualifier précisément la demande

## API

### Récupérer les spécifications d'un article

```javascript
import { fetchStockItemStandardSpecs } from '../lib/api';

const specs = await fetchStockItemStandardSpecs(stockItemId);
```

### Créer une spécification

```javascript
import { createStockItemStandardSpec } from '../lib/api';

await createStockItemStandardSpec({
  stock_item_id: 'uuid',
  title: 'Taraud machine métrique',
  spec_text: 'M3–M12, ISO, HSS, pour taraudage machine',
  is_default: true
});
```

### Mettre à jour une spécification

```javascript
import { updateStockItemStandardSpec } from '../lib/api';

await updateStockItemStandardSpec(specId, {
  title: 'Nouveau titre',
  spec_text: 'Nouveau texte',
  is_default: false
});
```

### Supprimer une spécification

```javascript
import { deleteStockItemStandardSpec } from '../lib/api';

await deleteStockItemStandardSpec(specId);
```

## Utilitaires de formatage

Pour formater les spécifications dans les exports/emails :

```javascript
import { 
  formatSpecsForExport,
  getDefaultSpecText,
  getDefaultSpecTitle,
  getFullSpecification 
} from '../utils/specsFormatter';

// Format HTML pour email
const html = formatSpecsForExport(specs, 'html');

// Format texte simple
const text = formatSpecsForExport(specs, 'text');

// Format Markdown
const markdown = formatSpecsForExport(specs, 'markdown');

// Extraire juste le texte
const specText = getDefaultSpecText(specs);

// Extraire juste le titre
const specTitle = getDefaultSpecTitle(specs);

// Texte complet (titre + texte)
const fullSpec = getFullSpecification(specs);
```

## Composants React

### StandardSpecsPanel

Panneau complet de gestion des spécifications :

```jsx
import StandardSpecsPanel from '../components/stock/StandardSpecsPanel';

<StandardSpecsPanel
  stockItemId="uuid"
  stockItemName="Nom de l'article"
/>
```

### SpecsDisplay

Affichage compact en lecture seule :

```jsx
import SpecsDisplay from '../components/stock/SpecsDisplay';

<SpecsDisplay specs={specsArray} />
```

## Intégration dans les exports

Pour inclure les spécifications dans les demandes de prix :

1. Charger les spécifications de l'article
2. Utiliser `formatSpecsForExport()` avec le format approprié
3. Inclure le résultat dans l'email/PDF

Exemple :

```javascript
const specs = await fetchStockItemStandardSpecs(stockItemId);
const specHtml = formatSpecsForExport(specs, 'html');

// Inclure specHtml dans le template d'email
```

## Bonnes pratiques

1. **Une spécification par défaut** : Marquez toujours une spécification comme "par défaut" pour faciliter l'usage automatique

2. **Titres descriptifs** : Utilisez des titres clairs (ex: "Taraud machine métrique", "Vis inox A2")

3. **Détails techniques** : Incluez toutes les informations pertinentes :
   - Dimensions
   - Matériaux
   - Normes (ISO, DIN, etc.)
   - Caractéristiques techniques

4. **Mise à jour régulière** : Actualisez les spécifications quand les standards changent

## Exemple de spécifications

### Taraud machine

- **Titre** : Taraud machine métrique ISO
- **Spec** : M3–M12, ISO 529, HSS, pour taraudage machine, tolérance 6H

### Vis

- **Titre** : Vis CHC Inox A2
- **Spec** : DIN 912, M6-M12, longueurs 20-50mm, Inox A2-70, tête cylindrique hexagonale

### Roulement

- **Titre** : Roulement à billes
- **Spec** : SKF 6205-2RS1, diamètre intérieur 25mm, diamètre extérieur 52mm, largeur 15mm, étanchéité 2RS

## Support

Pour toute question ou problème, consultez la documentation technique ou contactez l'équipe de développement.
