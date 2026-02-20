/**
 * Configuration des badges pour les actions
 * Contient les mappings de codes, priorités, statuts vers des représentations visuelles
 *
 * Note: Les couleurs des catégories d'actions proviennent maintenant du backend
 * via le champ category.color dans les données de subcategory.
 */

/**
 * Mapping des niveaux de priorité vers leurs badges
 */
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowDown,
  Clock,
  Timer,
  Check,
  X,
  Pause,
  CircleDot,
  Circle,
  HelpCircle,
  Zap,
  Flame,
  Repeat,
  Star,
  Diamond,
} from 'lucide-react';

export const PRIORITY_BADGES = {
  urgent: { color: 'red', icon: AlertCircle, label: 'Urgent' },
  haute: { color: 'amber', icon: AlertTriangle, label: 'Haute' },
  normal: { color: 'blue', icon: ArrowRight, label: 'Normal' },
  basse: { color: 'gray', icon: ArrowDown, label: 'Basse' },
};

/**
 * Badge par défaut pour priorités inconnues
 */
export const DEFAULT_PRIORITY_BADGE = {
  color: 'gray',
  icon: HelpCircle,
  label: 'N/A',
};

/**
 * Mapping des statuts d'actions vers leurs badges
 */
export const STATUS_BADGES = {
  'en attente': { color: 'gray', icon: Clock, label: 'En attente' },
  'en cours': { color: 'blue', icon: Timer, label: 'En cours' },
  completée: { color: 'green', icon: Check, label: 'Complétée' },
  annulée: { color: 'red', icon: X, label: 'Annulée' },
  suspendue: { color: 'orange', icon: Pause, label: 'Suspendue' },
};

/**
 * Badge par défaut pour statuts inconnus
 */
export const DEFAULT_STATUS_BADGE = {
  color: 'gray',
  icon: HelpCircle,
  label: 'N/A',
};

/**
 * Mapping des niveaux de sévérité vers leurs badges
 */
export const SEVERITY_BADGES = {
  high: { color: 'red', icon: CircleDot, label: 'Haute', textColor: 'tomato' },
  medium: { color: 'amber', icon: CircleDot, label: 'Moyenne', textColor: 'amber' },
  low: { color: 'amber', icon: Circle, label: 'Basse', textColor: 'amber' },
};

/**
 * Badge par défaut pour sévérités inconnues
 */
export const DEFAULT_SEVERITY_BADGE = {
  color: 'gray',
  icon: Circle,
  label: 'N/A',
  textColor: 'gray',
};

/**
 * Configuration des badges de complexité par seuil
 */
export const COMPLEXITY_THRESHOLDS = [
  {
    max: 2,
    badge: {
      color: 'green',
      icon: Check,
      label: 'Simple',
      description: 'Tâche facile et rapide',
    },
  },
  {
    max: 4,
    badge: {
      color: 'blue',
      icon: Diamond,
      label: 'Facile',
      description: 'Tâche standard',
    },
  },
  {
    max: 6,
    badge: {
      color: 'amber',
      icon: Diamond,
      label: 'Moyen',
      description: "Requiert de l'expérience",
    },
  },
  {
    max: 8,
    badge: {
      color: 'red',
      icon: Diamond,
      label: 'Difficile',
      description: 'Tâche complexe',
    },
  },
];

/**
 * Badge pour complexité maximale (> 8)
 */
export const MAX_COMPLEXITY_BADGE = {
  color: 'crimson',
  icon: Zap,
  label: 'Très difficile',
  description: 'Tâche très complexe ou dangereuse',
};

/**
 * Configuration des badges de charge de travail par rang
 */
export const LOAD_PRIORITY_BADGES = [
  {
    rank: 0,
    badge: {
      color: 'red',
      icon: Flame,
      label: 'Critique',
      description: 'Charge de travail très élevée',
    },
  },
  {
    rank: 1,
    badge: {
      color: 'amber',
      icon: AlertTriangle,
      label: 'Élevée',
      description: 'Charge importante à surveiller',
    },
  },
  {
    rank: 2,
    badge: {
      color: 'amber',
      icon: Zap,
      label: 'Haute',
      description: 'Charge significative',
    },
  },
  {
    maxRank: 4,
    badge: {
      color: 'blue',
      icon: ArrowRight,
      label: 'Moyenne',
      description: 'Charge modérée',
    },
  },
];

/**
 * Badge pour charge faible (rang > 4)
 */
export const LOW_LOAD_BADGE = {
  color: 'gray',
  icon: Circle,
  label: 'Faible',
  description: 'Charge réduite',
};

/**
 * Configuration des badges de récurrence par rang
 */
export const RECURRENCE_BADGES = [
  {
    rank: 0,
    badge: {
      color: 'red',
      icon: Repeat,
      label: 'Très récurrent',
      description: 'Intervention la plus fréquente',
    },
  },
  {
    rank: 1,
    badge: {
      color: 'amber',
      icon: Repeat,
      label: 'Récurrent',
      description: 'Intervention fréquente',
    },
  },
  {
    rank: 2,
    badge: {
      color: 'amber',
      icon: Repeat,
      label: 'Régulier',
      description: 'Intervention régulière',
    },
  },
  {
    maxRank: 4,
    badge: {
      color: 'blue',
      icon: ArrowRight,
      label: 'Occasionnel',
      description: 'Intervention occasionnelle',
    },
  },
];

/**
 * Badge pour récurrence rare (rang > 4)
 */
export const RARE_RECURRENCE_BADGE = {
  color: 'gray',
  icon: Circle,
  label: 'Rare',
  description: 'Intervention rare',
};

/**
 * Configuration des badges de productivité par seuil
 */
export const PRODUCTIVITY_THRESHOLDS = [
  {
    min: 1.5,
    badge: {
      color: 'green',
      label: 'Excellent',
      icon: Star,
    },
  },
  {
    min: 1,
    badge: {
      color: 'blue',
      label: 'Bon',
      icon: Check,
    },
  },
  {
    min: 0.5,
    badge: {
      color: 'orange',
      label: 'Moyen',
      icon: ArrowRight,
    },
  },
];

/**
 * Badge pour productivité faible (< 0.5)
 */
export const LOW_PRODUCTIVITY_BADGE = {
  color: 'red',
  label: 'Faible',
  icon: AlertTriangle,
};
