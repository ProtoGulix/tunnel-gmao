import { useMemo } from "react";
import PropTypes from "prop-types";
import { Card, Box, Heading, Text, Grid } from "@radix-ui/themes";

/**
 * Formate un nombre d'heures en format lisible (Xh Ym)
 * Gère les valeurs nulles, négatives et les arrondis
 * @param {number|null|undefined} hours - Nombre d'heures décimal
 * @returns {string} Temps formaté (ex: "2h30m", "0h", "15h")
 * @example
 * formatTime(2.5) // "2h30m"
 * formatTime(3) // "3h"
 * formatTime(0.25) // "15m"
 * formatTime(null) // "0h"
 */
const formatTime = (hours) => {
  if (!hours || hours <= 0) return '0h';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  
  // Cas spécial : moins d'1h (affiche uniquement les minutes)
  if (h === 0 && m > 0) return `${m}m`;
  
  return m > 0 ? `${h}h${m}m` : `${h}h`;
};

/**
 * Carte d'affichage de l'activité machine sur une période donnée
 * Affiche 4 métriques : interventions, temps passé, moyenne/jour, historique 90j
 * 
 * ✅ Implémenté :
 * - Affichage grid responsive (2 col mobile, 4 col desktop)
 * - formatTime intelligent : gère h/m/hm selon valeur
 * - Calcul temps moyen par jour automatique
 * - Emoji 📊 pour identification visuelle rapide
 * - Couleur bleue sur temps passé pour emphasis
 * - PropTypes avec valeurs par défaut (periodDays=30)
 * 
 * TODO: Améliorations futures :
 * - Graphique sparkline d'évolution sur période (mini chart)
 * - Comparaison avec période précédente (▲ +12% vs mois dernier)
 * - Code couleur selon intensité (vert=normal, orange=élevé, rouge=critique)
 * - Tooltip détaillé sur hover : ventilation par type intervention
 * - Export CSV des données de la période
 * - Sélection période dynamique (7j/30j/90j/1an) avec boutons
 * - Benchmark vs moyenne parc machines ("20% au-dessus moyenne")
 * - Prédiction tendance : "augmentation de 5h prévue mois prochain"
 * - Filtre par type d'intervention (préventive/curative)
 */
export default function ActivityPeriod({ 
  interventionCount, 
  timeSpent, 
  periodDays = 30, 
  historicalCount 
}) {
  // Mémoïser le calcul pour éviter recalculs inutiles
  const avgTimePerDay = useMemo(() => {
    return timeSpent / periodDays;
  }, [timeSpent, periodDays]);

  return (
    <Card>
      <Box p="3">
        <Heading size="4" mb="3">
          📊 Activité des {periodDays} derniers jours
        </Heading>
        <Grid columns={{ initial: '2', md: '4' }} gap="2">
          {/* Nombre d'interventions */}
          <Box>
            <Text size="1" color="gray">Interventions</Text>
            <Heading size="5">{interventionCount}</Heading>
          </Box>

          {/* Temps passé */}
          <Box>
            <Text size="1" color="gray">Temps passé</Text>
            <Heading size="5" color="blue">{formatTime(timeSpent)}</Heading>
          </Box>

          {/* Temps moyen par jour */}
          <Box>
            <Text size="1" color="gray">Temps moy / jour</Text>
            <Heading size="5">{formatTime(avgTimePerDay)}</Heading>
          </Box>

          {/* Historique étendu */}
          <Box>
            <Text size="1" color="gray">Historique 90j</Text>
            <Heading size="5">{historicalCount}</Heading>
          </Box>
        </Grid>
      </Box>
    </Card>
  );
}

ActivityPeriod.propTypes = {
  interventionCount: PropTypes.number.isRequired,
  timeSpent: PropTypes.number.isRequired,
  periodDays: PropTypes.number,
  historicalCount: PropTypes.number.isRequired,
};