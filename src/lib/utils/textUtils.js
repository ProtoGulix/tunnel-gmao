/**
 * Utilitaires de manipulation de texte
 */

/**
 * Normalise un texte en supprimant les accents
 * Utilisé pour les recherches insensibles aux accents
 * @param {string} text - Texte à normaliser
 * @returns {string} Texte normalisé sans accents
 */
export const normalizeText = (text) => {
  if (!text) return "";
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

/**
 * Recherche insensible à la casse et aux accents
 * @param {string} text - Texte dans lequel chercher
 * @param {string} search - Texte à rechercher
 * @returns {boolean} True si le texte contient la recherche
 */
export const searchInText = (text, search) => {
  if (!text || !search) return false;
  return normalizeText(text.toLowerCase()).includes(
    normalizeText(search.toLowerCase())
  );
};

/**
 * Filtre un tableau d'objets par recherche textuelle
 * @param {Array} items - Tableau d'objets à filtrer
 * @param {string} searchTerm - Terme de recherche
 * @param {Array<string>} fields - Champs à rechercher dans chaque objet
 * @returns {Array} Tableau filtré
 */
export const filterBySearch = (items, searchTerm, fields) => {
  if (!searchTerm || searchTerm.length < 2) return items;

  const normalizedSearch = normalizeText(searchTerm.toLowerCase());

  return items.filter((item) =>
    fields.some((field) => {
      const value = field.split(".").reduce((obj, key) => obj?.[key], item);
      if (!value) return false;
      return normalizeText(String(value).toLowerCase()).includes(
        normalizedSearch
      );
    })
  );
};
