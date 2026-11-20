# Dette du front web (tri du 2026-11-19)

- StockItemsTab.jsx orphelin (non importé) ; PartsTab.jsx (270 lignes) et StockItemsTab
  (259) au-delà de max-lines.
- Suppression en lot des demandes d'achat : une requête par demande, peut rester partielle
  (hooks/purchase/usePurchaseRequests.js:100-115).
- Droits relus seulement au login et au chargement (auth/AuthContext.jsx:36,56).
- Pas de test de contrat entre GET /audit/reasons (`decision_types`) et la fenêtre de motif
  (probable, non vérifié en entier).
- NON VÉRIFIÉ : masquage par droit des écrans restants de l'étape 5 (famille et modèle de
  pièce, planning, briefing, onglet Sécurité) ; grisé « Supprimer aussi la demande » sur
  `isSystem` ; traçage du family_code des sous-familles au renommage d'une famille.
- Complexité et longueur signalées par eslint (relecture INT, 2026-11-20) : InterventionCreationPanel.jsx
  (complexité 19), DayContextRightColumn.jsx (25), DIRightPanel.jsx, InterventionSelector.jsx
  (306 lignes) ; code surtout déplacé tel quel depuis l'accueil. Prop `equipementLabel`
  inutilisée dans InterventionSelector.
- Règles en dur sur certains codes de type (relevé TYP-03, 2026-11-20) : PRO/PIL/MES traités
  à part dans `useInterventionsList.js` (l.~144), séries CUR/PRE/PRO dans
  `OrganisationCharts.jsx`, type déduit du code d'intervention dans `CoordinationPage.jsx`
  (l.~85), repli 'CUR' d'affichage dans `interventionMappers.js`, `TaskSearchColumn.jsx`,
  `interventionCellRenderers.jsx`. À trancher : catégories de types en base ou règles assumées.
