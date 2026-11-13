# CLO-04. Web : Terminé et Annuler passent par la fenêtre de motif d'audit

- Statut : faite, en attente de validation à l'écran (2026-11-13)
- Agent : frontend-dev
- Branche : feat/cloture-taches-coordination
- Dépend de : CLO-02, CLO-03, ADR 0016 (version réécrite)
- Périmètre d'écriture : `web/src/components/tasks/`. Exclus : backend, mobile,
  `web/src/lib/api/`, `web/src/components/ui/Audit*` (réutilisés tels quels), CHANGELOG.

## Contexte

CLO-02 a ajouté une saisie de raison maison et codé reason_code OTHER. Le front a déjà
le mécanisme commun : sur la demande de motif du backend, l'intercepteur
(web/src/lib/api/auditGuard.js) ouvre AuditReasonDialog (branché dans Layout.jsx) et
rejoue la requête.

## Critères d'acceptation

- [x] Terminé envoie `{status: "done"}`, Annuler `{status: "skipped"}`, sans reason_code,
      reason_text ni skip_reason ; la saisie de raison maison est retirée
- [x] l'abandon de la fenêtre de motif laisse la tâche inchangée, sans message d'erreur
      parasite ; une autre erreur s'affiche par TaskErrorNotice
- [x] la ligne se met à jour après succès (statut, boutons)
- [x] le bouton Ignorer au survol suit la même règle (CLAUDE.md section 2.4, ajoutée
      le 2026-11-13) : statut seul, motif par la fenêtre d'audit, saisie maison retirée
- [x] scripts/check.sh vert, aucune assertion existante modifiée

## Compte rendu final

frontend-dev, trois passages (2026-11-13) :
- TaskCloseButtons : Terminé et Annuler envoient le statut seul ; saisie maison et OTHER
  retirés ; abandon de la fenêtre (isAuditCancelled) silencieux.
- Ignorer aligné partout sur le web : TaskActionButtons, TaskDetail (onglet de la page
  Tâches) et GammeProgressBlock (code mort : importé nulle part, backlog).
- check.sh vert, aucune assertion modifiée. ESLint (hors check.sh) signale complexité et
  max-lines sur TaskDetail et GammeProgressBlock, fonctions préexistantes, non comparé.
- Contrôle de l'agent principal : diff --stat conforme, check.sh et test-integration.sh
  (93) relancés verts.
- NON VÉRIFIÉ : rendu et rejeu dans le navigateur.
