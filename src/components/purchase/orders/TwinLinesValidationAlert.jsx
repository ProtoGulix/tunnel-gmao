/**
 * @fileoverview Composant d'alerte pour la validation des lignes jumelles
 * 
 * Affiche les erreurs et avertissements lors de la comparaison de devis
 * entre plusieurs fournisseurs pour les mêmes DA.
 * 
 * @module components/purchase/orders/TwinLinesValidationAlert
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 * @requires react-router-dom
 */

import PropTypes from 'prop-types';
import { Callout, Flex, Text, Badge, Box } from '@radix-ui/themes';
import { AlertTriangle, Info, CheckCircle2, ExternalLink, Check, Clock, Circle } from 'lucide-react';
import { Link } from 'react-router-dom';

// ===== HELPERS =====

/**
 * Extrait les informations de l'ordre fournisseur
 * @param {Object} order - Ordre fournisseur
 * @returns {{status: string, supplier: string, orderNumber: string, orderId: string}}
 */
const extractOrderInfo = (order) => {
  const status = typeof order === 'object' ? order.status : '?';
  const supplier = typeof order === 'object' && order.supplier_id ? 
    (typeof order.supplier_id === 'object' ? order.supplier_id.name : '?') : '?';
  const orderNumber = typeof order === 'object' ? order.order_number : '—';
  const orderId = typeof order === 'object' ? order.id : order;
  
  return { status, supplier, orderNumber, orderId };
};

/**
 * Extrait les informations de l'article
 * @param {Object} line - Ligne de commande
 * @returns {{name: string, ref: string|null}}
 */
const extractStockItemInfo = (line) => {
  const stockItem = line?.stock_item_id || line?.stockItem;
  const name = typeof stockItem === 'object' ? stockItem.name : 'Article inconnu';
  const ref = typeof stockItem === 'object' ? stockItem.ref : null;
  
  return { name, ref };
};

/**
 * Détermine la couleur du badge de statut
 * @param {string} status - Statut de la commande
 * @returns {string} Couleur Radix UI
 */
const getStatusBadgeColor = (status) => {
  return status === 'SENT' ? 'blue' : 'red';
};

/**
 * Détermine la couleur du badge de sélection
 * @param {boolean} isSelected - Si la ligne est sélectionnée
 * @returns {string} Couleur Radix UI
 */
const getSelectionBadgeColor = (isSelected) => {
  return isSelected ? 'green' : 'gray';
};

/**
 * Détermine la couleur du badge de devis
 * @param {boolean} quoteReceived - Si le devis est reçu
 * @returns {string} Couleur Radix UI
 */
const getQuoteBadgeColor = (quoteReceived) => {
  return quoteReceived ? 'green' : 'orange';
};

// ===== SUB-COMPONENTS =====

/**
 * Affiche les informations de l'article concerné
 * @param {Object} props
 * @param {string} props.name - Nom de l'article
 * @param {string|null} props.ref - Référence de l'article
 */
function ArticleInfo({ name, ref }) {
  return (
    <Box mb="3" p="2" style={{ backgroundColor: 'var(--gray-4)', borderRadius: '4px' }}>
      <Flex align="center" gap="2">
        <Text size="2" weight="bold">📦 Article :</Text>
        <Text size="2" weight="medium">{name}</Text>
        {ref && (
          <Badge color="gray" variant="soft" size="1">{ref}</Badge>
        )}
      </Flex>
    </Box>
  );
}

ArticleInfo.propTypes = {
  name: PropTypes.string.isRequired,
  ref: PropTypes.string,
};

/**
 * Lien vers une commande fournisseur
 * @param {Object} props
 * @param {string} props.orderId - ID de la commande
 * @param {string} props.orderNumber - Numéro de commande
 */
function OrderLink({ orderId, orderNumber }) {
  return (
    <Link 
      to={`/purchase/orders/${orderId}`}
      style={{ textDecoration: 'none' }}
    >
      <Badge color="blue" variant="soft" size="1" style={{ cursor: 'pointer' }}>
        {orderNumber} <ExternalLink size={10} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '2px' }} />
      </Badge>
    </Link>
  );
}

OrderLink.propTypes = {
  orderId: PropTypes.string.isRequired,
  orderNumber: PropTypes.string.isRequired,
};

/**
 * Affiche les badges d'une ligne (sélection, devis, statut)
 * @param {Object} props
 * @param {boolean} props.isSelected - Si la ligne est sélectionnée
 * @param {boolean} props.quoteReceived - Si le devis est reçu
 * @param {string} props.status - Statut de la commande
 */
function LineBadges({ isSelected, quoteReceived, status }) {
  return (
    <>
      <Badge 
        color={getSelectionBadgeColor(isSelected)} 
        size="1"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
      >
        {isSelected ? <Check size={12} /> : <Circle size={12} />}
        {isSelected ? 'Sélectionnée' : 'Non sélectionnée'}
      </Badge>
      <Badge 
        color={getQuoteBadgeColor(quoteReceived)} 
        size="1"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
      >
        {quoteReceived ? <Check size={12} /> : <Clock size={12} />}
        {quoteReceived ? 'Devis reçu' : 'Devis en attente'}
      </Badge>
      <Badge color={getStatusBadgeColor(status)} size="1">
        {status}
      </Badge>
    </>
  );
}

LineBadges.propTypes = {
  isSelected: PropTypes.bool.isRequired,
  quoteReceived: PropTypes.bool.isRequired,
  status: PropTypes.string.isRequired,
};

/**
 * Affiche une ligne de commande dans la liste comparative
 * @param {Object} props
 * @param {Object} props.line - Ligne de commande
 * @param {boolean} [props.isCurrent] - Si c'est la ligne actuelle
 */
function LineDetails({ line, isCurrent }) {
  const { status, supplier } = extractOrderInfo(line.supplier_order_id);
  
  const containerStyle = isCurrent ? {
    backgroundColor: 'var(--blue-3)',
    borderRadius: '4px',
    padding: '8px',
    marginBottom: '8px'
  } : {};
  
  return (
    <Box style={containerStyle}>
      {isCurrent && (
        <Text size="1" weight="bold" as="div" mb="1" color="blue">Ligne actuelle :</Text>
      )}
      <Flex align="center" gap="2" wrap="wrap">
        <LineBadges 
          isSelected={line.is_selected} 
          quoteReceived={line.quote_received}
          status={status}
        />
        <Text size="1" weight="medium">{supplier}</Text>
        {line.quote_price && (
          <Text size="1" weight="bold" color="green">
            {parseFloat(line.quote_price).toFixed(2)} €
          </Text>
        )}
      </Flex>
    </Box>
  );
}

LineDetails.propTypes = {
  line: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    is_selected: PropTypes.bool,
    quote_received: PropTypes.bool,
    quote_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    supplier_order_id: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        status: PropTypes.string,
        order_number: PropTypes.string,
        supplier_id: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.object
        ])
      })
    ]).isRequired,
  }).isRequired,
  isCurrent: PropTypes.bool,
};

LineDetails.defaultProps = {
  isCurrent: false,
};

/**
 * Liste comparative des lignes jumelles pour les erreurs
 * @param {Object} props
 * @param {Object} props.currentLine - Ligne actuelle
 * @param {Array<Object>} props.twinLines - Lignes jumelles
 */
function TwinLinesList({ currentLine, twinLines }) {
  if (twinLines.length === 0) return null;
  
  return (
    <Box mt="3">
      <Text size="1" weight="bold" mb="2" as="div">
        📋 Lignes jumelles détectées ({twinLines.length + 1} fournisseur(s) au total) :
      </Text>
      
      {currentLine && <LineDetails line={currentLine} isCurrent={true} />}
      
      {twinLines.map((twin) => (
        <Flex key={twin.id} align="center" gap="2" mt="2" wrap="wrap">
          <LineBadges 
            isSelected={twin.is_selected}
            quoteReceived={twin.quote_received}
            status={extractOrderInfo(twin.supplier_order_id).status}
          />
          <Text size="1" weight="medium">{extractOrderInfo(twin.supplier_order_id).supplier}</Text>
          <OrderLink 
            orderId={extractOrderInfo(twin.supplier_order_id).orderId}
            orderNumber={extractOrderInfo(twin.supplier_order_id).orderNumber}
          />
          {twin.quote_price && (
            <Text size="1" weight="bold" color="green">
              {parseFloat(twin.quote_price).toFixed(2)} €
            </Text>
          )}
        </Flex>
      ))}
    </Box>
  );
}

TwinLinesList.propTypes = {
  currentLine: PropTypes.object,
  twinLines: PropTypes.arrayOf(PropTypes.object).isRequired,
};

/**
 * Section des solutions proposées pour débloquer les erreurs
 * @param {Object} props
 * @param {Array<Object>} props.linesWithWrongStatus - Lignes avec statut incorrect
 * @param {boolean} props.hasMultipleSelected - Si plusieurs lignes sont sélectionnées
 * @param {number} props.selectedCount - Nombre de lignes sélectionnées
 */
function ErrorSolutions({ linesWithWrongStatus, hasMultipleSelected, selectedCount }) {
  return (
    <Box mt="3" p="2" style={{ backgroundColor: 'var(--red-3)', borderRadius: '6px' }}>
      <Text weight="bold" size="2" as="div" mb="2">💡 Solutions pour débloquer :</Text>
      
      {linesWithWrongStatus.length > 0 && (
        <Box mb="2">
          <Text size="2" as="div" weight="medium" mb="1">
            🔄 Statut incorrect ({linesWithWrongStatus.length} ligne(s)) :
          </Text>
          <Text size="1" as="div" color="gray" mb="1">
            → Ces lignes doivent être en statut &quot;SENT&quot; (demande de devis envoyée)
          </Text>
          {linesWithWrongStatus.map(l => {
            const { status, supplier } = extractOrderInfo(l.supplier_order_id);
            return (
              <Text key={l.id} size="1" as="div" ml="3" color="gray">
                • {supplier} : statut actuel = <Badge color="orange" size="1">{status}</Badge>
              </Text>
            );
          })}
        </Box>
      )}
      
      {hasMultipleSelected && (
        <Box mb="2">
          <Text size="2" as="div" weight="medium" mb="1">
            ☑️ Trop de lignes sélectionnées ({selectedCount}) :
          </Text>
          <Text size="1" as="div" color="gray" mb="1">
            → Désélectionnez toutes les lignes sauf la meilleure offre
          </Text>
          <Text size="1" as="div" color="gray" mb="1">
            → Comparez les prix et délais avant de choisir
          </Text>
        </Box>
      )}
      
      {!hasMultipleSelected && linesWithWrongStatus.length === 0 && (
        <Text size="1" as="div" color="gray">
          → Vérifiez que toutes les lignes jumelles respectent les règles ci-dessus
        </Text>
      )}
    </Box>
  );
}

ErrorSolutions.propTypes = {
  linesWithWrongStatus: PropTypes.arrayOf(PropTypes.object).isRequired,
  hasMultipleSelected: PropTypes.bool.isRequired,
  selectedCount: PropTypes.number.isRequired,
};

/**
 * Section d'erreur de validation
 * @param {Object} props
 * @param {Object} props.currentLine - Ligne actuelle
 * @param {Array<Object>} props.twinLines - Lignes jumelles
 * @param {Array<string>} props.validationErrors - Erreurs de validation
 */
function ErrorSection({ currentLine, twinLines, validationErrors }) {
  const allLines = currentLine ? [currentLine, ...twinLines] : twinLines;
  const linesWithWrongStatus = allLines.filter(l => {
    const { status } = extractOrderInfo(l.supplier_order_id);
    return status !== 'SENT';
  });
  const selectedCount = allLines.filter(l => l.is_selected === true).length;
  const hasMultipleSelected = selectedCount > 1;
  
  const { name: articleName, ref: articleRef } = extractStockItemInfo(currentLine);
  
  return (
    <Callout.Root color="red" size="2" mb="3">
      <Callout.Icon>
        <AlertTriangle size={18} />
      </Callout.Icon>
      <Callout.Text>
        <Box>
          <Text weight="bold" size="2" mb="2" as="div">
            ⚠️ Validation des jumelles échouée - Action requise
          </Text>
          
          <ArticleInfo name={articleName} ref={articleRef} />
          
          {validationErrors.map((error, idx) => (
            <Text key={idx} size="2" as="div" mb="1" color="red" weight="medium">• {error}</Text>
          ))}
          
          <ErrorSolutions 
            linesWithWrongStatus={linesWithWrongStatus}
            hasMultipleSelected={hasMultipleSelected}
            selectedCount={selectedCount}
          />
          
          <TwinLinesList currentLine={currentLine} twinLines={twinLines} />
        </Box>
      </Callout.Text>
    </Callout.Root>
  );
}

ErrorSection.propTypes = {
  currentLine: PropTypes.object,
  twinLines: PropTypes.arrayOf(PropTypes.object).isRequired,
  validationErrors: PropTypes.arrayOf(PropTypes.string).isRequired,
};

/**
 * Comparatif des offres pour les avertissements
 * @param {Object} props
 * @param {Object} props.currentLine - Ligne actuelle
 * @param {Array<Object>} props.twinLines - Lignes jumelles
 */
function OffersComparison({ currentLine, twinLines }) {
  if (twinLines.length === 0) return null;
  
  return (
    <Box mt="3">
      <Text size="1" weight="bold" mb="2" as="div">
        📊 Comparatif des offres ({twinLines.length + 1} fournisseur(s)) :
      </Text>
      
      {currentLine && <LineDetails line={currentLine} isCurrent={true} />}
      
      {twinLines.map((twin) => {
        const { supplier, orderId, orderNumber } = extractOrderInfo(twin.supplier_order_id);
        
        return (
          <Flex key={twin.id} align="center" gap="2" mt="2" wrap="wrap">
            <Badge 
              color={getSelectionBadgeColor(twin.is_selected)} 
              size="1"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              {twin.is_selected ? <Check size={12} /> : <Circle size={12} />}
              {twin.is_selected ? 'Sélectionnée' : 'À évaluer'}
            </Badge>
            <Badge 
              color={getQuoteBadgeColor(twin.quote_received)} 
              size="1"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              {twin.quote_received ? <Check size={12} /> : <Clock size={12} />}
              {twin.quote_received ? 'Devis reçu' : 'Devis en attente'}
            </Badge>
            <Text size="1" weight="medium">{supplier}</Text>
            <OrderLink orderId={orderId} orderNumber={orderNumber} />
            {twin.quote_price ? (
              <Text size="1" weight="bold" color="green">
                💰 {parseFloat(twin.quote_price).toFixed(2)} €
              </Text>
            ) : (
              <Text size="1" color="gray">Prix non renseigné</Text>
            )}
          </Flex>
        );
      })}
    </Box>
  );
}

OffersComparison.propTypes = {
  currentLine: PropTypes.object,
  twinLines: PropTypes.arrayOf(PropTypes.object).isRequired,
};

/**
 * Section des recommandations pour les avertissements
 * @param {Object} props
 * @param {Array<Object>} props.linesWithoutQuote - Lignes sans devis
 * @param {number} props.selectedCount - Nombre de lignes sélectionnées
 */
function WarningRecommendations({ linesWithoutQuote, selectedCount }) {
  return (
    <Box mt="3" p="2" style={{ backgroundColor: 'var(--amber-3)', borderRadius: '6px' }}>
      <Text weight="bold" size="2" as="div" mb="2">📝 Recommandations :</Text>
      
      {linesWithoutQuote.length > 0 && (
        <Box mb="2">
          <Text size="2" as="div" weight="medium" mb="1">
            ⏳ En attente de devis ({linesWithoutQuote.length} fournisseur(s)) :
          </Text>
          {linesWithoutQuote.map(l => {
            const { supplier } = extractOrderInfo(l.supplier_order_id);
            return (
              <Text key={l.id} size="1" as="div" ml="3" color="gray">
                • {supplier} : en attente de réponse
              </Text>
            );
          })}
          <Text size="1" as="div" color="gray" mt="1" ml="3">
            → Relancez les fournisseurs si nécessaire
          </Text>
        </Box>
      )}
      
      {selectedCount === 0 && (
        <Box mb="2">
          <Text size="2" as="div" weight="medium" mb="1">
            ☑️ Aucune ligne sélectionnée :
          </Text>
          <Text size="1" as="div" color="gray" ml="3" mb="1">
            → Comparez les prix, délais et qualité des fournisseurs
          </Text>
          <Text size="1" as="div" color="gray" ml="3">
            → Sélectionnez la meilleure offre avant de commander
          </Text>
        </Box>
      )}
      
      {selectedCount === 1 && linesWithoutQuote.length === 0 && (
        <Box>
          <Text size="2" as="div" weight="medium" mb="1" color="green">
            ✓ Tout est prêt pour la commande
          </Text>
          <Text size="1" as="div" color="gray" ml="3">
            → Vous pouvez passer au statut ORDERED
          </Text>
        </Box>
      )}
    </Box>
  );
}

WarningRecommendations.propTypes = {
  linesWithoutQuote: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedCount: PropTypes.number.isRequired,
};

/**
 * Section d'avertissement de validation
 * @param {Object} props
 * @param {Object} props.currentLine - Ligne actuelle
 * @param {Array<Object>} props.twinLines - Lignes jumelles
 * @param {Array<string>} props.validationWarnings - Avertissements
 */
function WarningSection({ currentLine, twinLines, validationWarnings }) {
  const allLines = currentLine ? [currentLine, ...twinLines] : twinLines;
  const linesWithoutQuote = allLines.filter(l => !l.quote_received);
  const selectedCount = allLines.filter(l => l.is_selected === true).length;
  
  const { name: articleName, ref: articleRef } = extractStockItemInfo(currentLine);
  
  return (
    <Callout.Root color="amber" size="2" mb="3">
      <Callout.Icon>
        <Info size={18} />
      </Callout.Icon>
      <Callout.Text>
        <Box>
          <Text weight="bold" size="2" mb="2" as="div">
            💡 Comparaison de devis recommandée
          </Text>
          
          <ArticleInfo name={articleName} ref={articleRef} />
          
          {validationWarnings.map((warning, idx) => (
            <Text key={idx} size="2" as="div" mb="1" color="orange">• {warning}</Text>
          ))}
          
          <WarningRecommendations 
            linesWithoutQuote={linesWithoutQuote}
            selectedCount={selectedCount}
          />
          
          <OffersComparison currentLine={currentLine} twinLines={twinLines} />
        </Box>
      </Callout.Text>
    </Callout.Root>
  );
}

WarningSection.propTypes = {
  currentLine: PropTypes.object,
  twinLines: PropTypes.arrayOf(PropTypes.object).isRequired,
  validationWarnings: PropTypes.arrayOf(PropTypes.string).isRequired,
};

// ===== MAIN COMPONENT =====

/**
 * Composant d'alerte pour la validation des lignes jumelles
 * 
 * Affiche un message selon l'état de validation (erreurs, avertissements, succès).
 * Propose des solutions pour débloquer les erreurs et compare les offres.
 * 
 * @component
 * @param {Object} props
 * @param {Array<Object>} props.twinLines - Liste des lignes jumelles
 * @param {Array<string>} props.validationErrors - Erreurs de validation
 * @param {Array<string>} props.validationWarnings - Avertissements
 * @param {boolean} props.loading - État de chargement
 * @param {Object} props.currentLine - Ligne actuelle pour analyse détaillée
 * @returns {JSX.Element|null} Alerte de validation ou null si pas de jumelles
 * 
 * @example
 * <TwinLinesValidationAlert
 *   twinLines={twinLinesData}
 *   validationErrors={["Statut incorrect"]}
 *   validationWarnings={[]}
 *   loading={false}
 *   currentLine={currentLineData}
 * />
 */
export default function TwinLinesValidationAlert({ 
  twinLines, 
  validationErrors, 
  validationWarnings,
  loading,
  currentLine,
}) {
  // Ne rien afficher si pas de jumelles
  if (!loading && twinLines.length === 0) {
    return null;
  }

  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <Callout.Root color="gray" size="1" mb="3">
        <Callout.Icon>
          <Info size={16} />
        </Callout.Icon>
        <Callout.Text>
          Vérification des lignes jumelles...
        </Callout.Text>
      </Callout.Root>
    );
  }

  // Afficher les erreurs en priorité
  if (validationErrors.length > 0) {
    return (
      <ErrorSection 
        currentLine={currentLine}
        twinLines={twinLines}
        validationErrors={validationErrors}
      />
    );
  }

  // Afficher les avertissements
  if (validationWarnings.length > 0) {
    return (
      <WarningSection 
        currentLine={currentLine}
        twinLines={twinLines}
        validationWarnings={validationWarnings}
      />
    );
  }

  // Tout est OK
  return (
    <Callout.Root color="green" size="1" mb="3">
      <Callout.Icon>
        <CheckCircle2 size={16} />
      </Callout.Icon>
      <Callout.Text>
        <Text size="2" as="span">
          ✓ Comparaison de devis validée ({twinLines.length} fournisseur(s))
        </Text>
      </Callout.Text>
    </Callout.Root>
  );
}

TwinLinesValidationAlert.propTypes = {
  twinLines: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    is_selected: PropTypes.bool,
    quote_received: PropTypes.bool,
    quote_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    supplier_order_id: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.object
    ]),
  })),
  validationErrors: PropTypes.arrayOf(PropTypes.string),
  validationWarnings: PropTypes.arrayOf(PropTypes.string),
  loading: PropTypes.bool,
  currentLine: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    is_selected: PropTypes.bool,
    quote_received: PropTypes.bool,
    quote_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    supplier_order_id: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.object
    ]),
    stock_item_id: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.object
    ]),
    stockItem: PropTypes.object,
  }),
};

TwinLinesValidationAlert.defaultProps = {
  twinLines: [],
  validationErrors: [],
  validationWarnings: [],
  loading: false,
  currentLine: null,
};
