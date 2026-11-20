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
