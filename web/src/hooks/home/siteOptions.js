/**
 * @fileoverview Dérivation des options du filtre de site depuis les équipements racines.
 * @module hooks/home/siteOptions
 */

/**
 * Transforme les équipements racines en options de filtre. Le filtre n'a de sens qu'avec
 * au moins deux sites : sinon la liste est vide et le sélecteur est masqué.
 * @param {Array<{id: string, code?: string, name?: string}>} roots
 * @returns {Array<{value: string, label: string}>}
 */
export function deriveSiteOptions(roots) {
  if (!Array.isArray(roots) || roots.length < 2) return [];
  return roots.map((r) => ({
    value: r.id,
    label: r.name || r.code || r.id,
  }));
}
