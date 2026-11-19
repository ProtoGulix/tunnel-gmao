# Code d'équipement cliquable dans le composant partagé

Constat de PREV-06 (2026-11-18) : `EntityCodeLink` (ADR 0009) ne gère que l'intervention
et la demande d'achat. L'échéancier du préventif a donc son propre
`web/src/components/preventive/MachineCodeLink.jsx` (même règle : code et icône = lien
vers `/equipements?id=`).

Décision de l'utilisateur du 2026-11-18 : le garder à part dans ce chantier, puis
l'intégrer à `EntityCodeLink` (type « équipement »), ce qui complète l'ADR 0009 par un
nouvel ADR, et remplacer les liens d'équipement écrits à la main ailleurs dans le web.
