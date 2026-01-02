import PropTypes from "prop-types";
import { Box, Flex, Button } from "@radix-ui/themes";
import { FileDown } from "lucide-react";
import TableHeader from "@/components/common/TableHeader";
import { PdfViewer } from "@/components/common/GenericTabComponents";
import { useSheetTab } from "./useSheetTab";

/**
 * Tab Sheet : Génération et visualisation PDF fiche intervention
 * 
 * Signature : { model, handlers }
 * - model : pdfUrl, pdfLoading
 * - handlers : callback génération PDF
 * 
 * Contraintes : 2 props, pas de callback inline, <90 lignes
 */
export default function SheetTab({ model, handlers }) {
  const { handlers: tabHandlers } = useSheetTab();

  // Event adapter
  const handleGeneratePdf = () => {
    tabHandlers.generatePdf(handlers.onLoadPdf);
  };

  return (
    <Box pt="4">
      <Flex direction="column" gap="3">
        <TableHeader
          icon={FileDown}
          title="Fiche intervention (PDF)"
          loading={model.pdfLoading}
          showRefreshButton={false}
          actions={
            <Button
              size="2"
              onClick={handleGeneratePdf}
              disabled={model.pdfLoading}
              style={{ backgroundColor: 'var(--gray-9)', color: 'white' }}
              title="Générer la fiche PDF"
            >
              {model.pdfLoading ? (
                <Flex align="center" gap="2">
                  <Box
                    style={{
                      width: "14px",
                      height: "14px",
                      border: "2px solid currentColor",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite"
                    }}
                  />
                  Génération...
                </Flex>
              ) : (
                <Flex align="center" gap="2">
                  <FileDown size={16} />
                  Générer la fiche
                </Flex>
              )}
            </Button>
          }
        />

        <PdfViewer 
          url={model.pdfUrl}
          loading={model.pdfLoading}
          onLoad={handlers.onLoadPdf}
          title="Fiche intervention PDF"
        />
      </Flex>
    </Box>
  );
}

SheetTab.displayName = "SheetTab";

SheetTab.propTypes = {
  model: PropTypes.shape({
    pdfUrl: PropTypes.string,
    pdfLoading: PropTypes.bool.isRequired
  }).isRequired,
  handlers: PropTypes.shape({
    onLoadPdf: PropTypes.func.isRequired
  }).isRequired
};
