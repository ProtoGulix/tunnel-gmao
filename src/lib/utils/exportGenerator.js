/**
 * Générateurs d'exports CSV et emails pour paniers fournisseurs
 * Business logic extrait de exportConfig.js
 */

import { CSV_CONFIG, EMAIL_CONFIG } from '@/config/exportConfig';

const uniqueValues = (list = []) => Array.from(new Set(list.filter(Boolean)));
const toPlainText = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\r?\n/g, ' ').trim();
};

const formatSpecs = (specs = []) => {
  const defaultSpec = specs.find((s) => s.is_default) || specs[0];
  const defaultText = defaultSpec ? `${defaultSpec.title}: ${defaultSpec.spec_text}` : '';
  const fullSpecs = specs
    .map((s) => `${s.title}: ${s.spec_text}`)
    .filter(Boolean)
    .join(' | ');

  return {
    defaultText,
    fullSpecs: fullSpecs || defaultText,
  };
};

/**
 * Normalise les lignes pour centraliser toutes les infos article.
 */
export const normalizeLinesForExport = (lines = []) =>
  lines.map((line, index) => {
    const item = line?.stock_item_id || {};
    const manufacturer = item.manufacturer_item_id || {};
    const purchaseRequests = line?.purchase_requests || [];

    const requesters = uniqueValues(
      purchaseRequests.map((pr) => pr.purchase_request_id?.requested_by)
    );

    const interventions = uniqueValues(
      purchaseRequests.map((pr) => {
        const inter = pr.purchase_request_id?.intervention_id;
        if (!inter) return null;
        if (typeof inter === 'object') return inter.code || inter.id;
        return inter;
      })
    );

    const specs = item.stock_item_standard_spec || [];
    const { defaultText, fullSpecs } = formatSpecs(specs);

    return {
      index: index + 1,
      name: toPlainText(item.name || line.item_label || '—'),
      internalRef: toPlainText(item.ref || ''),
      supplierRef: toPlainText(line.supplier_ref_snapshot || ''),
      manufacturerRef: toPlainText(manufacturer.manufacturer_ref || ''),
      manufacturerName: toPlainText(manufacturer.manufacturer_name || ''),
      manufacturerDesignation: toPlainText(manufacturer.designation || ''),
      family: toPlainText(item.family_code || ''),
      subFamily: toPlainText(item.sub_family_code || ''),
      dimension: toPlainText(item.dimension || ''),
      location: toPlainText(item.location || ''),
      unit: toPlainText(item.unit || line.unit || 'pcs'),
      quantity: Number(line.quantity) || 0,
      defaultSpecText: defaultText || '—',
      fullSpecs: fullSpecs || '—',
      requesters,
      interventions,
    };
  });

/**
 * Génère le contenu CSV pour un panier
 */
export function generateCSVContent(lines) {
  const normalized = normalizeLinesForExport(lines);
  const rows = normalized.map((line) => [
    line.name,
    line.internalRef,
    line.supplierRef,
    line.manufacturerRef,
    line.manufacturerName,
    line.manufacturerDesignation,
    line.family,
    line.subFamily,
    line.dimension,
    line.location,
    line.defaultSpecText,
    line.fullSpecs,
    line.quantity,
    line.unit,
    line.requesters.join(', '),
    line.interventions.join(', '),
  ]);

  const escapeCell = (cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`;

  return [
    CSV_CONFIG.headers.join(CSV_CONFIG.separator),
    ...rows.map((row) => row.map(escapeCell).join(CSV_CONFIG.separator)),
  ].join('\n');
}

/**
 * Génère le corps de l'email en texte formaté
 * (mailto ne supporte pas le HTML)
 */
export function generateEmailBody(order, lines) {
  const normalized = normalizeLinesForExport(lines);
  const totalQty = normalized.reduce((sum, line) => sum + line.quantity, 0);
  const supplierName = order.supplier_id?.name || '';
  const contactName = order.supplier_id?.contact_name || '';

  let body = `${EMAIL_CONFIG.body.greeting(supplierName, contactName)}\r\n\r\n`;
  body += `${EMAIL_CONFIG.body.intro(order.order_number)}\r\n\r\n`;

  normalized.forEach((line) => {
    const details = [
      line.dimension && `Dim: ${line.dimension}`,
      line.family && `Fam: ${line.family}`,
      line.subFamily && `Sous-fam: ${line.subFamily}`,
      line.location && `Loc: ${line.location}`,
    ]
      .filter(Boolean)
      .join(' | ');

    body += `${line.index}. ${line.name}\r\n`;
    body += `   Ref interne: ${line.internalRef || '—'} | Ref fournisseur: ${
      line.supplierRef || '—'
    }\r\n`;
    body += `   Fabricant: ${line.manufacturerName || '—'}${
      line.manufacturerRef ? ` (réf: ${line.manufacturerRef})` : ''
    }${line.manufacturerDesignation ? ` - ${line.manufacturerDesignation}` : ''}\r\n`;
    if (details) {
      body += `   Détails: ${details}\r\n`;
    }
    if (line.defaultSpecText && line.defaultSpecText !== '—') {
      body += `   Spéc: ${line.defaultSpecText}\r\n`;
    }
    if (line.fullSpecs && line.fullSpecs !== '—' && line.fullSpecs !== line.defaultSpecText) {
      body += `   Spéc (complètes): ${line.fullSpecs}\r\n`;
    }
    body += `   Qté: ${line.quantity} ${line.unit}\r\n`;
    if (line.requesters.length) {
      body += `   Demandeur(s): ${line.requesters.join(', ')}\r\n`;
    }
    if (line.interventions.length) {
      body += `   Intervention(s): ${line.interventions.join(', ')}\r\n`;
    }
    body += `\r\n`;
  });

  body += `\r\n------------------\r\n`;
  body += `TOTAL : ${normalized.length} article${
    normalized.length > 1 ? 's' : ''
  } - ${totalQty} unité${totalQty > 1 ? 's' : ''}\r\n\r\n`;

  body += `${EMAIL_CONFIG.body.outro}`;

  return body;
}

/**
 * Génère l'email complet en HTML pour copier-coller
 */
export function generateFullEmailHTML(order, lines) {
  const normalized = normalizeLinesForExport(lines);
  const totalQty = normalized.reduce((sum, line) => sum + line.quantity, 0);
  const supplierName = order.supplier_id?.name || '';
  const contactName = order.supplier_id?.contact_name || '';

  let greeting = 'Bonjour,';
  if (contactName) {
    greeting = `Bonjour ${contactName},`;
  } else if (supplierName) {
    greeting = `Bonjour,<br><br>À l'attention de ${supplierName}`;
  }

  const intro = `Nous souhaitons obtenir un devis pour les articles suivants (Réf. ${order.order_number}) :`;
  const outro =
    "Merci de nous transmettre votre meilleur prix ainsi que vos délais de livraison.<br><br>Dans l'attente de votre retour,<br>Cordialement";

  const tableHTML = EMAIL_CONFIG.generateTableHTML(normalized);

  return `
    ${EMAIL_CONFIG.tableStyle}
    <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">
      <p>${greeting}</p>
      <p>${intro}</p>
      ${tableHTML}
      <div class="total">
        TOTAL : ${normalized.length} article${
    normalized.length > 1 ? 's' : ''
  } - ${totalQty} unité${totalQty > 1 ? 's' : ''}
      </div>
      <p>${outro}</p>
    </div>
  `;
}
