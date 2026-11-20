# Types d'intervention permis selon l'équipement

Demande de l'utilisateur du 2026-11-20, pendant l'essai à l'écran de l'ADR 0026 : limiter
les types proposés selon l'équipement choisi. Exemple : pas de BAT (bâtiment) sur un
équipement immatériel comme SUPP.

Constats en lecture seule sur la base de dev (2026-11-20) :

- SUPP n'est pas une classe mais un équipement (« Support au service téchnique »), sans
  classe (`machine.equipement_class_id` NULL) ; 14 interventions : PIL 8, CUR 3, COF 1,
  PRO 1, REA 1. Le CUR et le PRO sur un équipement immatériel montrent le même défaut de
  classement que celui qui a motivé l'ADR 0026.
- 73 classes d'équipement (`equipement_class`), dont SITE (site, stockage, bureau).

Questions à trancher avant tout code (CLAUDE.md 11.8) :

1. Niveau de la règle : par classe d'équipement (une table de liaison classe ↔ types
   permis) ou par équipement. La classe évite de régler chaque machine ; les équipements
   sans classe, comme SUPP, demanderaient alors une classe (par exemple « Immatériel »).
2. Sens de la règle : liste des types permis (rien = tous permis) ou liste des types
   interdits.
3. Historique : une intervention existante dont le type n'est plus permis reste lisible et
   modifiable sans changer de type (même logique que le type désactivé, ADR 0026).
4. Demande avec type suggéré non permis sur son équipement : lequel l'emporte.

Le backend doit vérifier la règle (CLAUDE.md 4 : pas de règle métier seulement dans un
front) ; changement de schéma, donc ADR et accord de l'utilisateur.
