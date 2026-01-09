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
        margin: 5px 0;
        font-family: Arial, sans-serif;
      }
      th {
        background-color: #1f3a5f;
        color: white;
        padding: 5px;
        text-align: left;
        font-weight: 700;
        font-size: 12px;
      }
      td {
        padding: 5px;
        border-bottom: 1px solid #e5e7eb;
        vertical-align: top;
        font-size: 12px;
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
        return `
      <tr>
        <td class="mono">${line.index}</td>
        <td class="item-name">${line.name}</td>
        <td>${line.manufacturerName || '—'}</td>
        <td>${line.manufacturerRef || '—'}</td>
        <td>${line.defaultSpecText || '—'}</td>
        <td class="quantity">
          <div class="qty">${line.quantity}</div>
          <div class="unit">${line.unit}</div>
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
            <th>Référence stock</th>
            <th>Fabricant</th>
            <th>Ref fabricant</th>
            <th>Specs</th>
            <th>Qté</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  },
};
