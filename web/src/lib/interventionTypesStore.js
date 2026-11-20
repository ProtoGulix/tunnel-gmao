/**
 * Cache partagé des types d'intervention (référentiel en base, ADR 0026).
 * Sans dépendance à React ni à l'API : la fonction de chargement est injectée,
 * ce qui permet de tester le chargement et le repli.
 */

/** Message de validation d'un type absent à la création (aucun type par défaut) */
export const TYPE_REQUIRED_MESSAGE = "Choisissez le type d'intervention";

/** Libellé d'un type ; repli sur le code brut tant que la liste manque ou si le code est inconnu */
export function labelOf(types, code) {
  if (!code) return code;
  return types.find((t) => t.id === code)?.title ?? code;
}

/** Couleur Radix d'un type ; grise tant que la liste manque ou si le code est inconnu */
export function colorOf(types, code) {
  return types.find((t) => t.id === code)?.color ?? 'gray';
}

export function createTypesStore(fetchFn) {
  let types = [];
  let loaded = false;
  let pending = null;
  const listeners = new Set();

  const notify = () => listeners.forEach((l) => l());

  return {
    getSnapshot: () => types,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    /** Recharge après une modification d'administration */
    reload() {
      loaded = false;
      return this.load();
    },
    /** Charge une seule fois ; un échec n'est pas mémorisé (nouvel essai au prochain appel) */
    load() {
      if (loaded) return Promise.resolve();
      if (!pending) {
        pending = fetchFn()
          .then((data) => {
            types = Array.isArray(data) ? data : [];
            loaded = true;
            notify();
          })
          .catch(() => {})
          .finally(() => { pending = null; });
      }
      return pending;
    },
  };
}
