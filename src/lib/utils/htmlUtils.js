import DOMPurify from "dompurify";

/**
 * Nettoie et sécurise le HTML
 * @param {string} html - HTML brut à nettoyer
 * @returns {string} HTML sécurisé
 */
export function sanitizeHtml(html) {
  if (!html) return "";

  // Configuration de DOMPurify
  const config = {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "b",
      "i",
      "ul",
      "ol",
      "li",
      "span",
      "div",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "code",
      "pre",
    ],
    ALLOWED_ATTR: ["class", "style"],
    ALLOWED_STYLES: {
      "*": {
        color: [/^#[0-9a-fA-F]{3,6}$/],
        "background-color": [/^#[0-9a-fA-F]{3,6}$/],
        "font-weight": [/^(normal|bold|[1-9]00)$/],
        "font-style": [/^(normal|italic|oblique)$/],
        "text-decoration": [/^(none|underline|line-through)$/],
      },
    },
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_TRUSTED_TYPE: false,
  };

  return DOMPurify.sanitize(html, config);
}

/**
 * Supprime toutes les balises HTML et retourne le texte brut
 * @param {string} html - HTML à nettoyer
 * @returns {string} Texte sans balises HTML
 */
export function stripHtml(html) {
  if (!html) return "";

  // Crée un élément temporaire pour extraire le texte
  const div = document.createElement("div");
  div.innerHTML = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });

  // Retourne le texte brut en nettoyant les espaces multiples
  return div.textContent || div.innerText || "".replace(/\s+/g, " ").trim();
}

/**
 * Tronque le HTML en conservant les balises
 * @param {string} html - HTML à tronquer
 * @param {number} maxLength - Longueur maximale du texte (sans les balises)
 * @returns {string} HTML tronqué et sécurisé
 */
export function truncateHtml(html, maxLength = 100) {
  if (!html) return "";

  // Nettoie d'abord le HTML
  const cleanHtml = sanitizeHtml(html);

  // Extrait le texte brut pour vérifier la longueur
  const textContent = cleanHtml.replace(/<[^>]*>/g, "");

  if (textContent.length <= maxLength) {
    return cleanHtml;
  }

  // Si trop long, tronque le texte et ajoute ...
  const div = document.createElement("div");
  div.innerHTML = cleanHtml;

  let currentLength = 0;
  const truncateNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const remaining = maxLength - currentLength;
      if (remaining <= 0) {
        node.textContent = "";
        return;
      }

      if (node.textContent.length > remaining) {
        node.textContent = node.textContent.substring(0, remaining) + "...";
        currentLength = maxLength;
      } else {
        currentLength += node.textContent.length;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach(truncateNode);
    }
  };

  truncateNode(div);
  return div.innerHTML;
}
