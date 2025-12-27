/**
 * Configuration des exports CSV et emails pour les paniers fournisseurs
 */

const uniqueValues = (list = []) => Array.from(new Set(list.filter(Boolean)));
const toPlainText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\r?\n/g, " ").trim();
};

const formatSpecs = (specs = []) => {
  const defaultSpec = specs.find((s) => s.is_default) || specs[0];
  const defaultText = defaultSpec
    ? `${defaultSpec.title}: ${defaultSpec.spec_text}`
    : "";
  const fullSpecs = specs
    .map((s) => `${s.title}: ${s.spec_text}`)
    .filter(Boolean)
    .join(" | ");

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
        if (typeof inter === "object") return inter.code || inter.id;
        return inter;
      })
    );

    const specs = item.stock_item_standard_spec || [];
    const { defaultText, fullSpecs } = formatSpecs(specs);

    return {
      index: index + 1,
      name: toPlainText(item.name || line.item_label || "—"),
      internalRef: toPlainText(item.ref || ""),
      supplierRef: toPlainText(line.supplier_ref_snapshot || ""),
      manufacturerRef: toPlainText(manufacturer.manufacturer_ref || ""),
      manufacturerName: toPlainText(manufacturer.manufacturer_name || ""),
      manufacturerDesignation: toPlainText(manufacturer.designation || ""),
      family: toPlainText(item.family_code || ""),
      subFamily: toPlainText(item.sub_family_code || ""),
      dimension: toPlainText(item.dimension || ""),
      location: toPlainText(item.location || ""),
      unit: toPlainText(item.unit || line.unit || "pcs"),
      quantity: Number(line.quantity) || 0,
      defaultSpecText: defaultText || "—",
      fullSpecs: fullSpecs || "—",
      requesters,
      interventions,
    };
  });

export const CSV_CONFIG = {
  separator: ";",
  encoding: "utf-8",
  headers: [
    "Article",
    "Référence interne",
    "Référence fournisseur",
    "Référence fabricant",
    "Fabricant",
    "Désignation fabricant",
    "Famille",
    "Sous-famille",
    "Dimension",
    "Localisation",
    "Spécifications (défaut)",
    "Spécifications (complètes)",
    "Quantité",
    "Unité",
    "Demandeurs",
    "Interventions",
  ],
  fileNamePattern: (orderNumber, supplierName) =>
    `demande_prix_${orderNumber}_${supplierName}.csv`,
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
      return "Bonjour,";
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
          line.subFamily && line.subFamily !== line.family ? line.subFamily : "",
          line.location && `📍 ${line.location}`,
        ]
          .filter(Boolean)
          .join(" • ");

        const requesters = line.requesters.length
          ? line.requesters.join(", ")
          : "—";
        const interventions = line.interventions.length
          ? line.interventions.join(", ")
          : "—";

        return `
      <tr>
        <td class="mono">${line.index}</td>
        <td>
          <div class="item-name">${line.name}</div>
          ${metaParts ? `<div class="item-meta">${metaParts}</div>` : ""}
        </td>
        <td>
          <div><strong>Interne:</strong> ${line.internalRef || "—"}</div>
          <div><strong>Fournisseur:</strong> ${line.supplierRef || "—"}</div>
          <div><strong>Fabricant:</strong> ${line.manufacturerName || "—"}${
          line.manufacturerRef ? ` (${line.manufacturerRef})` : ""
        }</div>
          ${
            line.manufacturerDesignation
              ? `<div class="muted">${line.manufacturerDesignation}</div>`
              : ""
          }
        </td>
        <td>
          <div class="spec-title">${line.defaultSpecText || "—"}</div>
          ${
            line.fullSpecs && line.fullSpecs !== line.defaultSpecText
              ? `<div class="spec-muted">${line.fullSpecs}</div>`
              : ""
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
      .join("");

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
    line.requesters.join(", "),
    line.interventions.join(", "),
  ]);

  const escapeCell = (cell) =>
    `"${String(cell ?? "").replace(/"/g, '""')}"`;

  return [
    CSV_CONFIG.headers.join(CSV_CONFIG.separator),
    ...rows.map((row) => row.map(escapeCell).join(CSV_CONFIG.separator)),
  ].join("\n");
}

/**
 * Génère le corps de l'email en texte formaté
 * (mailto ne supporte pas le HTML)
 */
export function generateEmailBody(order, lines) {
  const normalized = normalizeLinesForExport(lines);
  const totalQty = normalized.reduce((sum, line) => sum + line.quantity, 0);
  const supplierName = order.supplier_id?.name || "";
  const contactName = order.supplier_id?.contact_name || "";

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
      .join(" | ");

    body += `${line.index}. ${line.name}\r\n`;
    body += `   Ref interne: ${line.internalRef || "—"} | Ref fournisseur: ${line.supplierRef || "—"}\r\n`;
    body += `   Fabricant: ${line.manufacturerName || "—"}${
      line.manufacturerRef ? ` (réf: ${line.manufacturerRef})` : ""
    }${line.manufacturerDesignation ? ` - ${line.manufacturerDesignation}` : ""}\r\n`;
    if (details) {
      body += `   Détails: ${details}\r\n`;
    }
    if (line.defaultSpecText && line.defaultSpecText !== "—") {
      body += `   Spéc: ${line.defaultSpecText}\r\n`;
    }
    if (
      line.fullSpecs &&
      line.fullSpecs !== "—" &&
      line.fullSpecs !== line.defaultSpecText
    ) {
      body += `   Spéc (complètes): ${line.fullSpecs}\r\n`;
    }
    body += `   Qté: ${line.quantity} ${line.unit}\r\n`;
    if (line.requesters.length) {
      body += `   Demandeur(s): ${line.requesters.join(", ")}\r\n`;
    }
    if (line.interventions.length) {
      body += `   Intervention(s): ${line.interventions.join(", ")}\r\n`;
    }
    body += `\r\n`;
  });

  body += `\r\n------------------\r\n`;
  body += `TOTAL : ${normalized.length} article${
    normalized.length > 1 ? "s" : ""
  } - ${totalQty} unité${totalQty > 1 ? "s" : ""}\r\n\r\n`;

  body += `${EMAIL_CONFIG.body.outro}`;

  return body;
}

/**
 * Génère l'email complet en HTML pour copier-coller
 */
export function generateFullEmailHTML(order, lines) {
  const normalized = normalizeLinesForExport(lines);
  const totalQty = normalized.reduce((sum, line) => sum + line.quantity, 0);
  const supplierName = order.supplier_id?.name || "";
  const contactName = order.supplier_id?.contact_name || "";

  let greeting = "Bonjour,";
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
        TOTAL : ${normalized.length} article${normalized.length > 1 ? "s" : ""} - ${totalQty} unité${totalQty > 1 ? "s" : ""}
      </div>
      <p>${outro}</p>
    </div>
  `;
}
