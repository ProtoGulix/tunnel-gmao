/**
 * Template d'email pour demande de prix avec spécifications standard
 *
 * Ce template montre comment intégrer les spécifications techniques détaillées
 * dans une demande de prix envoyée aux fournisseurs
 */

import { formatSpecsForExport, getFullSpecification } from '@/lib/utils/specsFormatter';
import { fetchStockItemStandardSpecs } from '@/lib/api';

/**
 * Génère le contenu HTML d'un email de demande de prix
 * @param {Object} order - Commande fournisseur
 * @param {Array} orderLines - Lignes de commande
 * @param {Object} supplier - Informations du fournisseur
 * @returns {Promise<string>} HTML de l'email
 */
export const generatePriceRequestEmail = async (order, orderLines, supplier) => {
  // Charger les spécifications pour chaque ligne
  const linesWithSpecs = await Promise.all(
    orderLines.map(async (line) => {
      const specs = await fetchStockItemStandardSpecs(line.stock_item_id?.id);
      return {
        ...line,
        specs,
        specsHtml: formatSpecsForExport(specs, 'html'),
        specsText: getFullSpecification(specs),
      };
    })
  );

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demande de Prix - ${order.order_number}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: #1F3A5F;
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #F4F6F8;
      padding: 20px;
      border: 1px solid #e5e7eb;
    }
    .order-info {
      background: white;
      padding: 15px;
      border-radius: 6px;
      margin: 15px 0;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: white;
    }
    .items-table th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #e5e7eb;
    }
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .item-row {
      vertical-align: top;
    }
    .specs-box {
      margin: 10px 0;
      padding: 10px;
      background: #f5f5f5;
      border-left: 3px solid #1F3A5F;
      font-size: 0.9em;
    }
    .specs-title {
      color: #1F3A5F;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .specs-text {
      color: #666;
      white-space: pre-wrap;
    }
    .footer {
      margin-top: 30px;
      padding: 15px;
      background: #f9fafb;
      border-top: 2px solid #e5e7eb;
      font-size: 0.9em;
      color: #666;
    }
    .highlight {
      background: #fef3c7;
      padding: 2px 4px;
      border-radius: 3px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Demande de Prix</h1>
    <p>Référence: <strong>${order.order_number}</strong></p>
    <p>Date: ${new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
  </div>

  <div class="content">
    <div class="order-info">
      <h2>À l'attention de ${supplier.name}</h2>
      <p>Madame, Monsieur,</p>
      <p>
        Nous vous prions de bien vouloir nous établir un devis pour les articles suivants,
        conformément aux spécifications détaillées ci-dessous.
      </p>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 10%">Réf.</th>
          <th style="width: 25%">Désignation</th>
          <th style="width: 10%">Références</th>
          <th style="width: 35%">Spécifications techniques</th>
          <th style="width: 15%">Quantité</th>
        </tr>
      </thead>
      <tbody>
        ${linesWithSpecs
          .map(
            (line) => `
        <tr class="item-row">
          <td><strong>${line.stock_item_id?.ref || 'N/A'}</strong></td>
          <td>
            <strong>${line.stock_item_id?.name || line.item_label}</strong>
            ${
              line.stock_item_id?.dimension
                ? `<br/><small>Dimension: ${line.stock_item_id.dimension}</small>`
                : ''
            }
          </td>
          <td style="font-size: 0.9em;">
            ${
              line.stock_item_id?.manufacturer_item_id
                ? `<div><strong>Fab:</strong> ${
                    line.stock_item_id.manufacturer_item_id.manufacturer_ref || 'N/A'
                  }</div>`
                : ''
            }
            ${
              line.supplier_ref_snapshot
                ? `<div><strong>Fourni:</strong> ${line.supplier_ref_snapshot}</div>`
                : ''
            }
          </td>
          <td>
            ${
              line.specs && line.specs.length > 0
                ? `
              <div class="specs-box">
                <div class="specs-title">${
                  line.specs.find((s) => s.is_default)?.title || line.specs[0]?.title
                }</div>
                <div class="specs-text">${
                  line.specs.find((s) => s.is_default)?.spec_text || line.specs[0]?.spec_text
                }</div>
              </div>
            `
                : `<em style="color: #999;">Spécification à déterminer avec le service technique</em>`
            }
            ${line.notes ? `<br/><small><strong>Note:</strong> ${line.notes}</small>` : ''}
          </td>
          <td>
            <strong>${line.quantity}</strong> ${line.unit || 'pcs'}
          </td>
        </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <div class="order-info">
      <h3>Informations complémentaires</h3>
      <ul>
        <li><strong>Délai souhaité:</strong> <span class="highlight">Dans les meilleurs délais</span></li>
        <li><strong>Conditions de paiement:</strong> Selon nos conditions habituelles</li>
        <li><strong>Livraison:</strong> Franco de port</li>
      </ul>
      
      ${
        order.notes
          ? `
        <p><strong>Remarques:</strong></p>
        <p style="padding: 10px; background: #fff3cd; border-left: 3px solid #ffc107;">${order.notes}</p>
      `
          : ''
      }
    </div>

    <div class="order-info">
      <p>
        Nous vous remercions de nous faire parvenir votre meilleure offre dans les plus brefs délais,
        en précisant :
      </p>
      <ul>
        <li>Prix unitaire HT</li>
        <li>Délai de livraison</li>
        <li>Conditions de paiement</li>
        <li>Validité de l'offre</li>
      </ul>
    </div>
  </div>

  <div class="footer">
    <p>
      <strong>Contact:</strong><br/>
      Service Achats<br/>
      Email: achats@votreentreprise.fr<br/>
      Tél: +33 (0)X XX XX XX XX
    </p>
    <p style="font-size: 0.85em; color: #999;">
      Cet email a été généré automatiquement par le système GMAO.
      En cas de question, merci de répondre directement à cet email.
    </p>
  </div>
</body>
</html>
  `;
};

/**
 * Génère une version texte simple de l'email (fallback)
 */
export const generatePriceRequestEmailText = async (order, orderLines, supplier) => {
  const linesWithSpecs = await Promise.all(
    orderLines.map(async (line) => {
      const specs = await fetchStockItemStandardSpecs(line.stock_item_id?.id);
      return {
        ...line,
        specsText: getFullSpecification(specs),
      };
    })
  );

  return `
DEMANDE DE PRIX
Référence: ${order.order_number}
Date: ${new Date(order.created_at).toLocaleDateString('fr-FR')}

À l'attention de ${supplier.name}

Madame, Monsieur,

Nous vous prions de bien vouloir nous établir un devis pour les articles suivants:

${linesWithSpecs
  .map(
    (line, index) => `
${index + 1}. ${line.stock_item_id?.name || line.item_label}
   Référence interne: ${line.stock_item_id?.ref || 'N/A'}
   ${line.stock_item_id?.dimension ? `Dimension: ${line.stock_item_id.dimension}` : ''}
   ${
     line.stock_item_id?.manufacturer_item_id
       ? `Référence fabricant: ${line.stock_item_id.manufacturer_item_id.manufacturer_ref || 'N/A'}`
       : ''
   }
   ${line.supplier_ref_snapshot ? `Référence fournisseur: ${line.supplier_ref_snapshot}` : ''}
   Quantité: ${line.quantity} ${line.unit || 'pcs'}
   
   Spécifications techniques:
   ${line.specsText || 'Spécification à déterminer avec le service technique'}
   ${line.notes ? `\n   Note: ${line.notes}` : ''}
`
  )
  .join('\n')}

Informations complémentaires:
- Délai souhaité: Dans les meilleurs délais
- Conditions de paiement: Selon nos conditions habituelles
- Livraison: Franco de port

${order.notes ? `Remarques:\n${order.notes}\n` : ''}

Nous vous remercions de nous faire parvenir votre meilleure offre en précisant:
- Prix unitaire HT
- Délai de livraison
- Conditions de paiement
- Validité de l'offre

Cordialement,
Service Achats
Email: achats@votreentreprise.fr
  `;
};
