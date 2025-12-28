/**
 * Configuration des exports CSV et emails pour les paniers fournisseurs
 * Configuration pure - la business logic est dans src/lib/utils/exportGenerator.js
 */

export const CSV_CONFIG = {
  separator: ';',
  encoding: 'utf-8',
  headers: [
    'Article',
    'Référence interne',
    'Référence fournisseur',
    'Référence fabricant',
    'Fabricant',
    'Désignation fabricant',
    'Famille',
    'Sous-famille',
    'Dimension',
    'Localisation',
    'Spécifications (défaut)',
    'Spécifications (complètes)',
    'Quantité',
    'Unité',
    'Demandeurs',
    'Interventions',
  ],
  fileNamePattern: (orderNumber, supplierName) => `demande_prix_${orderNumber}_${supplierName}.csv`,
};

export const EMAIL_CONFIG = {
  subject: (orderNumber) => `Demande de prix - Réf. ${orderNumber}`,

  body: {
    greeting: (supplierName, contactName) => {
      if (contactName) {
        return `Bonjour ${contactName},`;
      }
      if (supplierName) {
        return `Bonjour,\r\n\r\nÀ l'attention de ${supplierName}`;
      }
      return 'Bonjour,';
    },
    intro: (orderNumber) =>
      `Nous souhaitons obtenir un devis pour les articles suivants (Réf. ${orderNumber}) :`,
    outro:
      "Merci de nous transmettre votre meilleur prix ainsi que vos délais de livraison.\r\n\r\nDans l'attente de votre retour,\r\nCordialement",
  },

  tableStyle: `
    <style>
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 20px 0;
        font-family: Arial, sans-serif;
      }
      th {
        background-color: #1f3a5f;
        color: white;
        padding: 10px;
        text-align: left;
        font-weight: 700;
        font-size: 13px;
      }
      td {
        padding: 10px;
        border-bottom: 1px solid #e5e7eb;
        vertical-align: top;
        font-size: 13px;
      }
      tr:nth-child(even) { background-color: #f9fafb; }
      tr:hover { background-color: #f3f4f6; }
      .mono { font-family: "Roboto Mono", Consolas, monospace; }
      .item-name { font-weight: 600; color: #111827; }
      .item-meta { color: #6b7280; font-size: 12px; margin-top: 4px; }
      .muted { color: #6b7280; font-size: 12px; }
      .spec-title { font-weight: 600; color: #1f3a5f; }
      .spec-muted { color: #6b7280; font-size: 12px; margin-top: 4px; white-space: pre-wrap; }
      .quantity { text-align: center; font-weight: 700; }
      .qty { font-size: 16px; }
      .unit { color: #6b7280; font-size: 12px; }
      .total { margin-top: 20px; font-weight: 700; font-size: 15px; }
    </style>
  `,

  generateTableHTML: (normalizedLines) => {
    const rows = normalizedLines
      .map((line) => {
        const metaParts = [
          line.dimension && `📐 ${line.dimension}`,
          line.family && `🏷️ ${line.family}`,
          line.subFamily && line.subFamily !== line.family ? line.subFamily : '',
          line.location && `📍 ${line.location}`,
        ]
          .filter(Boolean)
          .join(' • ');

        const requesters = line.requesters.length ? line.requesters.join(', ') : '—';
        const interventions = line.interventions.length ? line.interventions.join(', ') : '—';

        return `
      <tr>
        <td class="mono">${line.index}</td>
        <td>
          <div class="item-name">${line.name}</div>
          ${metaParts ? `<div class="item-meta">${metaParts}</div>` : ''}
        </td>
        <td>
          <div><strong>Interne:</strong> ${line.internalRef || '—'}</div>
          <div><strong>Fournisseur:</strong> ${line.supplierRef || '—'}</div>
          <div><strong>Fabricant:</strong> ${line.manufacturerName || '—'}${
          line.manufacturerRef ? ` (${line.manufacturerRef})` : ''
        }</div>
          ${
            line.manufacturerDesignation
              ? `<div class="muted">${line.manufacturerDesignation}</div>`
              : ''
          }
        </td>
        <td>
          <div class="spec-title">${line.defaultSpecText || '—'}</div>
          ${
            line.fullSpecs && line.fullSpecs !== line.defaultSpecText
              ? `<div class="spec-muted">${line.fullSpecs}</div>`
              : ''
          }
        </td>
        <td class="quantity">
          <div class="qty">${line.quantity}</div>
          <div class="unit">${line.unit}</div>
        </td>
        <td>
          <div><strong>Demandeur(s):</strong> ${requesters}</div>
          <div><strong>Intervention(s):</strong> ${interventions}</div>
        </td>
      </tr>
      `;
      })
      .join('');

    return `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Article / Famille</th>
            <th>Références</th>
            <th>Spécifications</th>
            <th>Qté</th>
            <th>Demandes</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  },
};
