import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { Box, Heading, Card, Text, Button, Badge, Flex } from "@radix-ui/themes";
import { History, ExternalLink } from "lucide-react";

/**
 * Résumé de l'historique des interventions d'une machine avec lien vers page complète
 * Affiche compteur d'interventions sur 90j avec bouton d'accès rapide
 * 
 * ✅ Implémenté :
 * - Badge coloré selon présence d'interventions (bleu si >0, gris si 0)
 * - Gestion singulier/pluriel automatique
 * - Bouton désactivé si aucune intervention (disabled={!count})
 * - Navigation React Router vers page interventions filtrée
 * - Query param machine pour filtrage automatique
 * - Apostrophe échappée (&apos;) pour conformité JSX
 * - PropTypes complets avec oneOfType pour ID flexible
 * 
 * TODO: Améliorations futures :
 * - Ventilation par type : X préventives, Y curatives, Z urgentes
 * - Top 3 problèmes récurrents avec badges
 * - Temps total passé sur 90j avec comparaison période précédente
 * - État santé machine : vert (bon), orange (surveillance), rouge (critique)
 * - Tendance : ▲ augmentation, ▼ diminution vs période précédente
 * - Dernière intervention : date + type avec indicateur fraîcheur (<7j = vert)
 * - Prochaine maintenance préventive programmée avec countdown
 * - Export PDF historique avec graphiques
 * - Filtres rapides : 7j/30j/90j/1an avec boutons toggle
 */
export default function HistoricalSummary({ count, machineId }) {
  return (
    <Box>
      <Flex align="center" gap="2" mb="2">
        <History size={20} color="var(--blue-9)" />
        <Heading size="5" color="blue">
          Historique des 90 derniers jours
        </Heading>
      </Flex>
      <Card>
        <Box p="3">
          <Flex align="center" gap="2" mb="3">
            <Badge color={count > 0 ? "blue" : "gray"} variant="soft" size="2">
              {count || 0}
            </Badge>
            <Text size="2" color="gray">
              {count === 1 ? "intervention enregistrée" : "interventions enregistrées"}
            </Text>
          </Flex>

          {count === 0 && (
            <Text size="1" color="gray" style={{ display: 'block', marginBottom: '12px', fontStyle: 'italic' }}>
              Aucune intervention sur cette période. Machine potentiellement neuve ou peu sollicitée.
            </Text>
          )}

          <Button size="2" variant="soft" asChild disabled={!count}>
            <Link 
              to={`/interventions?machine=${machineId}`} 
              style={{ textDecoration: 'none', color: 'inherit', pointerEvents: count ? 'auto' : 'none' }}
            >
              <ExternalLink size={14} />
              Voir l&apos;historique complet
            </Link>
          </Button>
        </Box>
      </Card>
    </Box>
  );
}

HistoricalSummary.propTypes = {
  count: PropTypes.number.isRequired,
  machineId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};