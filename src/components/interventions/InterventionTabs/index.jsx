/**
 * InterventionTabs - Onglets modulaires pour détail intervention
 * 
 * Réexporte les 5 tabs refactorisés :
 * - ActionsTab : Timeline actions avec recherche
 * - SummaryTab : Demandes d'achat liées
 * - StatsTab : Statistiques intervention
 * - SheetTab : Génération PDF fiche
 * - HistoryTab : Historique chronologique
 * 
 * Architecture refactorisée :
 * ✅ Chaque tab : max 3 props ({ model, handlers, metadata })
 * ✅ Logique d'état dans hooks (useActionsTab, useSummaryTab, useSheetTab)
 * ✅ Composants séparés (TimelineItemRenderer, HistoryItem)
 * ✅ Pas de callbacks inline
 * ✅ Chaque fichier < 120 lignes
 */

export { default as ActionsTab } from './ActionsTab';
export { default as SummaryTab } from './SummaryTab';
export { default as StatsTab } from './StatsTab';
export { default as SheetTab } from './SheetTab';
export { default as HistoryTab } from './HistoryTab';

export { TimelineItemRenderer as default } from './TimelineItemRenderer';
