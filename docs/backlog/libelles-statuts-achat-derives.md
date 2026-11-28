# Libellés des statuts dérivés d'une demande d'achat

Le front écrit ses propres libellés des statuts dérivés (`TO_QUALIFY`, `NO_SUPPLIER_REF`…) à
plusieurs endroits : `web/src/hooks/home/decisionQueue.js` (`PURCHASE_CAUSES`, accueil
direction, ADR 0047) et `web/src/components/purchase/CsvImportWizard.jsx`. Constaté par la
revue du chantier ADT le 2026-11-28. Piste : une table unique, idéalement servie par l'API
(comme les statuts de demande). Le schéma `DerivedStatus` de l'API omet aussi `CONSULTATION`.
