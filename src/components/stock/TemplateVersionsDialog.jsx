/**
 * @fileoverview Dialogue d'historique des versions d'un template de pièce
 * @module components/stock/TemplateVersionsDialog
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  Button,
  Flex,
  Text,
  Table,
  Badge,
  Box,
  IconButton,
} from "@radix-ui/themes";
import { History, Eye, Clock, CheckCircle2 } from "lucide-react";
import LoadingState from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import { partTemplates } from "@/lib/api/facade";

/**
 * Dialogue affichant l'historique des versions d'un template
 * @component
 */
export default function TemplateVersionsDialog({ templateCode, currentVersion, onViewVersion }) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && templateCode) {
      loadVersions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, templateCode]);

  const loadVersions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await partTemplates.fetchTemplateVersions(templateCode);
      // Trier par version décroissante (plus récent en premier)
      setVersions(data.sort((a, b) => b.version - a.version));
    } catch (err) {
      console.error("Erreur chargement versions:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewVersion = (version) => {
    onViewVersion?.(version);
    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <IconButton
          size="1"
          variant="ghost"
          color="gray"
          title="Voir l'historique des versions"
        >
          <History size={14} />
        </IconButton>
      </Dialog.Trigger>

      <Dialog.Content style={{ maxWidth: 800 }}>
        <Dialog.Title>
          <Flex align="center" gap="2">
            <History size={20} />
            Historique des versions - {templateCode}
          </Flex>
        </Dialog.Title>

        <Dialog.Description size="2" mb="4">
          Liste de toutes les versions créées pour ce template. Les pièces existantes
          conservent leur version d&apos;origine.
        </Dialog.Description>

        <Box>
          {loading ? (
            <LoadingState message="Chargement des versions..." />
          ) : error ? (
            <EmptyState
              icon={<History size={48} />}
              title="Erreur"
              description={error}
            />
          ) : versions.length === 0 ? (
            <EmptyState
              icon={<History size={48} />}
              title="Aucune version"
              description="Aucune version trouvée pour ce template"
            />
          ) : (
            <Table.Root variant="surface">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell width="80px">Version</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Pattern</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Champs</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell width="120px">Créé le</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell width="80px">Actions</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {versions.map((version) => (
                  <Table.Row key={`${version.code}-v${version.version}`}>
                    <Table.Cell>
                      <Flex align="center" gap="2">
                        <Badge
                          color={version.version === currentVersion ? "blue" : "gray"}
                          variant={version.version === currentVersion ? "solid" : "soft"}
                        >
                          v{version.version}
                        </Badge>
                        {version.version === currentVersion && (
                          <CheckCircle2 size={14} style={{ color: "var(--blue-9)" }} />
                        )}
                      </Flex>
                    </Table.Cell>

                    <Table.Cell>
                      <Text size="1" style={{ fontFamily: 'monospace', color: 'var(--gray-11)' }}>
                        {version.pattern}
                      </Text>
                    </Table.Cell>

                    <Table.Cell>
                      <Badge color="blue" variant="soft">
                        {version.fields?.length || 0} champs
                      </Badge>
                    </Table.Cell>

                    <Table.Cell>
                      <Flex align="center" gap="1">
                        <Clock size={12} style={{ color: "var(--gray-10)" }} />
                        <Text size="1" color="gray">
                          {version.created_at
                            ? new Date(version.created_at).toLocaleDateString('fr-FR')
                            : '-'}
                        </Text>
                      </Flex>
                    </Table.Cell>

                    <Table.Cell>
                      <IconButton
                        size="1"
                        variant="ghost"
                        color="blue"
                        onClick={() => handleViewVersion(version)}
                        title="Voir les détails"
                      >
                        <Eye size={14} />
                      </IconButton>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Box>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Fermer
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

TemplateVersionsDialog.propTypes = {
  templateCode: PropTypes.string.isRequired,
  currentVersion: PropTypes.number.isRequired,
  onViewVersion: PropTypes.func,
};
