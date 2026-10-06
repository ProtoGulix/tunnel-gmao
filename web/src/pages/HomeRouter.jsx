/**
 * @fileoverview Point d'entrée de la route "/" — affiche la vue d'accueil
 * assignée au rôle de l'utilisateur courant.
 *
 * Comportement par défaut garanti : tant que la vue n'est pas résolue (ou en
 * cas d'erreur), on affiche HomeSplit (vue technicien actuelle) — jamais
 * d'écran vide. C'est le hook useHomeView qui porte cette garantie.
 *
 * @module pages/HomeRouter
 */

import { lazy, Suspense } from 'react';
import { useHomeView } from '@/hooks/home/useHomeView';
import LoadingState from '@/components/ui/LoadingState';

const HomeSplit = lazy(() => import('@/pages/HomeSplit'));
const BuyerHomeView = lazy(() => import('@/pages/home/BuyerHomeView'));
const TechnicalDirectionHomeView = lazy(() => import('@/pages/home/TechnicalDirectionHomeView'));

const VIEWS = {
  acheteur: BuyerHomeView,
  direction_technique: TechnicalDirectionHomeView,
};

export default function HomeRouter() {
  const { view } = useHomeView();
  const ViewComponent = VIEWS[view] || HomeSplit;

  return (
    <Suspense fallback={<LoadingState fullscreen message="Chargement de l'accueil…" />}>
      <ViewComponent />
    </Suspense>
  );
}
