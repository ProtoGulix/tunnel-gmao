/**
 * URL, titre et libellé d'un code interne (ADR 0009).
 * Seul endroit du front où ces deux URL sont écrites.
 */

export function entityCodeUrl(type, id) {
  if (type === 'intervention') return `/interventions?id=${id}`;
  if (type === 'purchase_request') return `/achats?tab=requests&requestId=${id}`;
  return null;
}

export function entityCodeTitle(type, code) {
  const target = type === 'purchase_request' ? "la demande d'achat" : "l'intervention";
  return code ? `Ouvrir ${target} ${code}` : `Ouvrir ${target}`;
}

export function entityCodeLabel(code) {
  return code || 'sans code';
}
