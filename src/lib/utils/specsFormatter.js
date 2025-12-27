/**
 * Utilitaires pour formater les spécifications standard
 */

/**
 * Formate les spécifications pour affichage dans un email ou export
 * @param {Array} specs - Tableau de spécifications
 * @param {string} format - Format de sortie ('text', 'html', 'markdown')
 * @returns {string} Texte formaté
 */
export const formatSpecsForExport = (specs = [], format = "text") => {
  if (!specs || specs.length === 0) {
    return format === "html"
      ? "<em>Aucune spécification définie</em>"
      : "Aucune spécification définie";
  }

  // Prendre la spec par défaut ou la première
  const defaultSpec = specs.find((s) => s.is_default) || specs[0];

  switch (format) {
    case "html":
      return `
        <div style="margin: 10px 0; padding: 10px; background: #f5f5f5; border-left: 3px solid #1F3A5F;">
          <strong style="color: #1F3A5F;">${defaultSpec.title}</strong>
          ${
            defaultSpec.is_default
              ? '<span style="font-size: 0.85em; color: #666;"> (par défaut)</span>'
              : ""
          }
          <br/>
          <span style="white-space: pre-wrap; color: #666;">${
            defaultSpec.spec_text
          }</span>
        </div>
      `;

    case "markdown":
      return `
**${defaultSpec.title}**${defaultSpec.is_default ? " _(par défaut)_" : ""}

${defaultSpec.spec_text}
      `.trim();

    case "text":
    default:
      return `${defaultSpec.title}${
        defaultSpec.is_default ? " (par défaut)" : ""
      }\n${defaultSpec.spec_text}`;
  }
};

/**
 * Extrait le texte de la spécification par défaut
 * @param {Array} specs - Tableau de spécifications
 * @returns {string} Texte de la spécification
 */
export const getDefaultSpecText = (specs = []) => {
  if (!specs || specs.length === 0) return "";
  const defaultSpec = specs.find((s) => s.is_default) || specs[0];
  return defaultSpec.spec_text || "";
};

/**
 * Extrait le titre de la spécification par défaut
 * @param {Array} specs - Tableau de spécifications
 * @returns {string} Titre de la spécification
 */
export const getDefaultSpecTitle = (specs = []) => {
  if (!specs || specs.length === 0) return "";
  const defaultSpec = specs.find((s) => s.is_default) || specs[0];
  return defaultSpec.title || "";
};

/**
 * Combine titre et texte pour un affichage complet
 * @param {Array} specs - Tableau de spécifications
 * @returns {string} Spécification complète
 */
export const getFullSpecification = (specs = []) => {
  const title = getDefaultSpecTitle(specs);
  const text = getDefaultSpecText(specs);

  if (!title && !text) return "";
  if (!text) return title;
  if (!title) return text;

  return `${title}: ${text}`;
};
