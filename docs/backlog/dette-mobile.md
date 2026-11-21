# Dette du mobile (tri du 2026-11-19)

Anciens points H-7, M-1 à M-8, P-1 à P-5, toujours ouverts.

- Tailles de page en dur malgré DEFAULT_PAGE_SIZE (mobile/src/lib/api/client.js:3) :
  api/interventions.js:31, api/planning.js:13,36, hooks/interventions/useInterventionSearch.js:16,
  components/actions/ActionForm.jsx:494, hooks/interventions/useInterventionsList.js:88.
- ActionCard dans pages/planning (à déplacer dans components).
- Badges faits à la main (`color + '22'`) au lieu de DynBadge (ActionCard, InterventionDetailPage,
  InterventionsPage).
- Fond de fenêtre `rgba(0,0,0,0.35)` en ligne (SheetPicker, ActionForm, AuditReasonSheet,
  PurchaseRequestForm).
- Couleurs hex en dur dans 27 fichiers malgré le jeton Tailwind `tunnel`.
- Pas de React.memo sur les lignes de liste, pas de chargement paresseux des routes.
- Paramètre de route non uniforme (`stock/items/:itemId`).
- Accessibilité : 2 aria-label, 7 `<div onClick>`.
- Validation des formulaires hors ActionForm non harmonisée (non mesurée).
- PWA sans page hors ligne (vite.config.js:14-33), logo PNG sans lazy ni WebP,
  96 tailles `text-[Npx]`.
- Droits relus seulement au chargement (auth/AuthContext.jsx:11,30) ; droit
  `createIntervention` déclaré mais jamais vérifié à l'écran (le backend reste le garde).
- Acceptation d'une demande (InterventionRequestsPage, AcceptDISheet + InterventionForm) :
  pas alignée sur le formulaire de l'accueil (champ titre, initiales en lecture seule, pas de
  choix du technicien, passe par la transition `acceptee`). Relevé le 2026-11-20 (TYP-04) ;
  le type y est déjà vide et obligatoire.

## Formulaire de demande de l'onglet « Demandes » (relevé le 2026-11-21, GUIDE-03) — TRAITÉ (2026-11-21, fix/mobile-annuler-demande)

`mobile/src/pages/interventions/InterventionsPage.jsx` passe `onCancel` à `DIForm`, qui
attend `onClose` : le bouton « Annuler » du formulaire ne ferme rien (la croix de l'en-tête,
elle, ferme). Vérifié dans le code par l'agent principal, non reproduit à l'écran.
