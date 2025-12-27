import { useEffect, useState } from "react";
import { Container, Box, Badge } from "@radix-ui/themes";
import PageHeader from "@/components/layout/PageHeader";
import { usePageHeaderProps } from "@/hooks/usePageConfig";

/**
 * Exemple d'utilisation de la configuration centralisée
 * pour les en-têtes de page
 */
export default function ExamplePageWithConfig() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Méthode 1 : Utiliser le hook pour auto-générer les props
  // L'icône, le titre et le sous-titre viennent automatiquement de menuConfig.js
  const headerProps = usePageHeaderProps();
  
  // Méthode 2 : Surcharger certaines valeurs dynamiques
  const headerPropsWithOverride = usePageHeaderProps({
    subtitle: `${data.length} éléments trouvés`,
    urgentBadge: data.filter(d => d.urgent).length > 0 ? {
      count: data.filter(d => d.urgent).length,
      label: "Urgent"
    } : null,
  });
  
  // Méthode 3 : Ajouter des actions personnalisées
  const completeHeaderProps = usePageHeaderProps({
    actions: [
      {
        label: "Exporter",
        onClick: () => console.log("Export"),
        variant: "soft"
      }
    ],
    onRefresh: () => loadData(),
    onAdd: () => console.log("Ajouter"),
    addLabel: "+ Nouvelle entrée"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // ... votre logique de chargement
    setLoading(false);
  };

  return (
    <Container size="4">
      {/* Simple : toutes les infos viennent de la config */}
      <PageHeader {...headerProps} />
      
      {/* Avec surcharge pour infos dynamiques */}
      {/* <PageHeader {...headerPropsWithOverride} /> */}
      
      {/* Avec actions personnalisées */}
      {/* <PageHeader {...completeHeaderProps} /> */}

      <Box>
        {/* Contenu de votre page */}
      </Box>
    </Container>
  );
}
