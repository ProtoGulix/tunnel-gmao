import { PlanningPane } from '@/components/home/PlanningPane';
import { BriefingPane } from '@/components/home/BriefingPane';

/**
 * Page d'accueil — Split planning / briefing pleine largeur
 *
 * Deux colonnes 50/50 qui occupent toute la hauteur disponible.
 * Chaque colonne gère son propre scroll interne.
 * Aucun container max-width : la page prend toute la largeur après la sidebar.
 */
export default function HomeSplit() {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Colonne gauche — Planning */}
      <div
        style={{
          width: '50%',
          borderRight: '1px solid var(--gray-5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <PlanningPane />
      </div>

      {/* Colonne droite — Briefing */}
      <div
        style={{
          width: '50%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <BriefingPane />
      </div>
    </div>
  );
}
