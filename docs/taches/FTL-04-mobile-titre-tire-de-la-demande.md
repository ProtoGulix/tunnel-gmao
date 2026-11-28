# FTL-04. Mobile : ne plus envoyer la description comme titre

- Statut : faite
- Agent : frontend-dev
- Branche : fix/acceptation-titre-long
- Dépend de : FTL-01 (titre déduit par l'API, titre fourni > 200 refusé en 400)
- Périmètre d'écriture : mobile/src/components/actions/InterventionCreateForm.jsx, mobile/src/components/interventions/InterventionForm.jsx, tests mobile, CHANGELOG.md, cette fiche. Exclu : backend, web.

## Contexte

Le mobile envoie la description de la demande comme titre (création avec demande existante ou saisie ; acceptation, titre prérempli). Avec FTL-01, l'API déduit le titre quand il est absent et refuse un titre fourni de plus de 200 caractères.

## Critères d'acceptation

- [x] InterventionCreateForm : plus de `title` dérivé de la description (demande existante ou nouvelle)
- [x] InterventionForm (acceptation) : titre vide par défaut, la description en indication ; saisi, il est limité à 200 caractères ; vide, il n'est pas envoyé
- [x] check.sh vert ; CHANGELOG

## Compte rendu

Fait : `title` retiré du payload de InterventionCreateForm (demande existante et nouvelle) ; InterventionForm : titre vide par défaut, indication « Repris de la demande », `maxLength` 200, vide non envoyé (`title.trim() || undefined`). Aucune règle pure nouvelle, pas de test ajouté. Non vérifié à l'écran.
