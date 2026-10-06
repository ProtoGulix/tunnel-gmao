# TODO & Backlog — web.tunnel-mobile

> Mis à jour le 2026-04-12. Cocher les cases au fur et à mesure.
> **Légende** : 🔴 Critique · 🟠 Haute · 🟡 Moyen · 🟢 Polish · 💡 Feature

---

## 🔴 Critique — À traiter en priorité absolue

- [x] **[C-1] Race condition polling + édition manuelle**
  `src/hooks/interventions/useInterventionsList.js:94`
  Polling 30s peut écraser une mise à jour en cours → `AbortController` + pause polling si formulaire ouvert

- [x] **[C-2] Null guards manquants sur données API**
  - `src/components/interventions/DICard.jsx:47` → `item?.description ?? '—'`
  - `src/screens/InterventionsScreen.tsx:131-138` → `item?.equipements ?? []`

- [x] **[C-3] Dupliquer les maps statut/couleur** — source unique dans `config/badges.js`
  - Supprimer `STATUS_COLOR` / `STATUS_LABEL` dans `InterventionRequestsPage.jsx:54-61`
  - Supprimer les maps dans `InterventionsScreen.tsx:62-93`

---

## 🟠 Haute priorité — Prochaine itération

- [x] **[H-1] Extraire `SheetPicker` en composant `src/components/ui/SheetPicker.jsx`**
  Défini 2x : `ActionForm.jsx:54-90` + `InterventionForm.jsx:18-54`

- [x] **[H-2] Ajouter un `ErrorBoundary` au niveau des routes**
  Créer `src/components/ui/ErrorBoundary.jsx` + wrapper dans `src/router/routes.jsx`
  Sans ça : tout crash = écran blanc complet

- [x] **[H-3] Standardiser le format de retour des fonctions API**
  `src/lib/api/client.js` + `src/api/*.js` — certaines normalisent `.items ?? res`, d'autres non

- [x] **[H-4] Extraire les formatters dans `src/utils/`**
  - Créer `src/utils/dateUtils.js` : `formatDateFr`, `formatWeekLabel`, `formatTime`, `isToday`, `getMonday`, `addDays`, `toDateStr`
  - Nettoyé : `InterventionsPage.jsx`, `InterventionRequestsPage.jsx`, `InterventionDetailPage.jsx`, `ActionCard.jsx`, `PlanningPage.jsx`

- [x] **[H-5] Décider screens/ vs pages/** *(décision d'architecture)*
  Migré : `InterventionsScreen.tsx` → `pages/interventions/InterventionsPage.jsx`, dossier `screens/` supprimé

- [x] **[H-6] Ajouter route 404**
  `src/router/routes.jsx` → route catch-all + `ErrorBoundary` sur toutes les routes

- [ ] **[H-7] Constante pagination**
  `export const DEFAULT_PAGE_SIZE = 50` dans `src/config/api.js` — remplacer les `limit: 50` / `limit: 30` hardcodés

---

## 🟡 Moyen — Dette à résorber progressivement

- [ ] **[M-1] Déplacer `ActionCard` vers `src/components/interventions/`**
  Actuellement dans `src/pages/planning/ActionCard.jsx` — c'est un composant réutilisable

- [ ] **[M-2] Remplacer les badges couleur manuels par `<DynBadge>`**
  8+ occurrences du pattern `style={{ backgroundColor: color + '22', color }}`

- [ ] **[M-3] Overlay modal inline → classe CSS**
  3+ occurrences de `style={{ background: 'rgba(0,0,0,0.35)' }}` → `.modal-overlay` dans `index.css`

- [ ] **[M-4] Remplacer les hex hardcodés par les tokens Tailwind**
  `BottomNav.jsx:16-17` + 20+ occurrences → `text-tunnel-blue`, `bg-tunnel-sidebar`, etc.

- [ ] **[M-5] `React.memo` sur les composants de liste**
  `DICard.jsx`, `InterventionCard.jsx`, composants de ligne stock

- [ ] **[M-6] Lazy loading des routes**
  `const StockPage = lazy(() => import(...))` + `<Suspense>` dans `routes.jsx`

- [ ] **[M-7] Uniformiser le paramètre `:id` dans les routes**
  `/:itemId` → `/:id` dans `routes.jsx:48` pour cohérence

- [ ] **[M-8] `BOTTOM_NAV_ITEMS` config inutilisée**
  `src/config/navigation.js:42-48` — soit utiliser dans `BottomNav.jsx`, soit supprimer

---

## 🟢 Polish — Quand la dette est résorbée

- [ ] **[P-1] Accessibilité : ARIA labels**
  Boutons icon-only sans label, `<div onClick>` à remplacer par `<button>`

- [ ] **[P-2] Validation formulaire côté client**
  `ActionForm.jsx` a une `validate()` partielle — compléter et harmoniser sur tous les forms

- [ ] **[P-3] Support offline PWA**
  `vite-plugin-pwa` configuré mais pas de page offline — ajouter `offline.html` + stratégie cache

- [ ] **[P-4] Optimiser les images**
  `Tunnel_Logo.png` → WebP + `loading="lazy"`

- [ ] **[P-5] Nettoyer les tailles typo arbitraires**
  Supprimer `text-[11px]`, `text-[17.6px]` → classes custom du design system

---

## 💡 Features à venir

> Aide-mémoire des prochaines fonctionnalités. Ajouter ici au fil des idées.

- [ ] ...
- [ ] ...

---

## ✅ Terminé

| Date | Item | Notes |
|---|---|---|
| 2026-04-12 | Audit initial + création CLAUDE.md | — |

---

## 📋 Décisions prises

| Date | Décision |
|---|---|
| 2026-04-12 | Audit initial — backlog créé |
| 2026-04-12 | C-1/C-2/C-3 appliqués — section critique terminée |
| 2026-04-12 | H-1/H-2/H-3/H-4/H-5/H-6 appliqués — section haute priorité terminée (sauf H-7) |
