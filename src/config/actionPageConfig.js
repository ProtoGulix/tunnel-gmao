/**
 * Configuration centralisée des onglets UI (Actions et Anomalies)
 *
 * Défini toutes les configurations d'onglets utilisées dans l'interface utilisateur.
 * Utilisé par les pages et composants pour afficher des vues tabulées cohérentes.
 *
 * @module config/actionPageConfig
 */

import {
  ClipboardList,
  Flame,
  RefreshCw,
  AlertTriangle,
  Repeat2,
  Clock,
  Timer,
  Search,
  RotateCw,
  Zap,
} from 'lucide-react';

// ===== ACTION TABS =====

/**
 * Configuration des onglets d'Actions.
 * Chaque onglet représente une vue différente des actions.
 *
 * @constant {Array<Object>}
 * @property {string} value - Valeur unique de l'onglet (pour Tabs.Root)
 * @property {string} label - Libellé affiché dans l'onglet
 * @property {Component} icon - Icône Lucide React
 * @property {string} color - Couleur du badge Radix UI
 * @property {string} description - Description de la vue
 * @property {boolean} [conditional] - Si true, l'onglet s'affiche seulement si les données existent
 */
export const ACTION_TABS = [
  {
    value: 'list',
    label: 'List',
    icon: ClipboardList,
    color: 'blue',
    description: 'Liste complète des actions avec filtrage',
  },
  {
    value: 'load',
    label: 'Load Analysis',
    icon: Flame,
    color: 'amber',
    description: 'Analyse de charge de travail par catégorie',
  },
  {
    value: 'interventions',
    label: 'Top Interventions',
    icon: RefreshCw,
    color: 'blue',
    description: 'Interventions les plus fréquentes et complexes',
  },
  {
    value: 'anomalies',
    label: 'Anomalies',
    icon: AlertTriangle,
    color: 'red',
    description: 'Patterns anormaux détectés dans les actions',
    conditional: true, // S'affiche seulement si anomalies existent
  },
];

// ===== ANOMALY TABS =====

/**
 * Configuration des onglets d'anomalies.
 * Chaque type correspond à un pattern d'anomalie spécifique détecté
 * dans les actions de maintenance.
 *
 * @constant {Array<Object>}
 * @property {string} value - Valeur unique de l'onglet
 * @property {string} label - Libellé affiché
 * @property {string} key - Clé dans l'objet anomalies (camelCase après normalisation)
 * @property {string} color - Couleur Radix UI
 * @property {Component} icon - Icône Lucide React
 * @property {string} typeLabel - Label du type (A-F)
 * @property {string} description - Description du pattern d'anomalie
 */
export const ANOMALY_TABS = [
  {
    value: 'repetitive',
    label: 'Répétitives',
    key: 'tooRepetitive',
    color: 'red',
    icon: Repeat2,
    typeLabel: 'A',
    description:
      'Même catégorie sur même machine plus de 3 fois par mois. Envisager une maintenance préventive.',
  },
  {
    value: 'fragmented',
    label: 'Fragmentées',
    key: 'tooFragmented',
    color: 'orange',
    icon: Clock,
    typeLabel: 'B',
    description:
      "Actions de moins d'1h répétées plus de 5 fois. Travail mal organisé ou tâches à regrouper.",
  },
  {
    value: 'long',
    label: 'Trop longues',
    key: 'tooLongForCategory',
    color: 'orange',
    icon: Timer,
    typeLabel: 'C',
    description:
      'Actions de plus de 4h sur catégories normalement simples. Vérifier la classification ou le découpage.',
  },
  {
    value: 'classification',
    label: 'Classification',
    key: 'badClassification',
    color: 'purple',
    icon: Search,
    typeLabel: 'D',
    description:
      'Description contient des mots-clés suspects pour la catégorie. Revoir la classification.',
  },
  {
    value: 'backtoback',
    label: 'Back-to-Back',
    key: 'backToBack',
    color: 'blue',
    icon: RotateCw,
    typeLabel: 'E',
    description:
      'Même technicien revient sur même intervention sous 24h. Travail mal découpé ou problème non résolu.',
  },
  {
    value: 'lowvalue',
    label: 'Faible valeur',
    key: 'lowValueHighLoad',
    color: 'red',
    icon: Zap,
    typeLabel: 'F',
    description:
      'Catégories à faible valeur ajoutée avec plus de 30h cumulées. Problème structurel à adresser.',
  },
];
