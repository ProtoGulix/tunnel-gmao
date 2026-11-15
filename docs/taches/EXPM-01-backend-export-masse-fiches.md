# EXPM-01. Backend : export de masse des fiches PDF des interventions fermées

- Statut : faite (2026-11-16), reviewer APPROUVÉ, validée à l'écran par l'utilisateur
- Agent : backend-dev
- Branche : feat/export-masse-fiches (depuis develop, ADR 0008)
- Dépend de : ADR 0007 (matrice des droits)
- Périmètre d'écriture : backend/api/exports/, backend/tests/, déclaration du nouveau droit
  dans le catalogue et la matrice de départ (là où sont déclarés les droits des autres
  endpoints d'export), docs/endpoints/ (export), CHANGELOG.md (« Non publié »).
  Exclu : toute migration de schéma, toute écriture dans la base de dev, toute dépendance
  ajoutée, le front.

## Contexte

Il existe déjà GET /exports/interventions/{id}/pdf (WeasyPrint + Jinja2). L'utilisateur veut
exporter en une fois les fiches des interventions fermées sur une période, au choix en ZIP
(un PDF par fiche, pour télécharger) ou en un seul PDF (pour imprimer). Pas de colonne de
date de fermeture : la date retenue est celle du dernier passage à `ferme` dans
intervention_status_log (vérifié le 2026-11-15 en lecture seule : les 266 fermées de la
base de dev ont toutes cette ligne).

## Critères d'acceptation

- [x] GET /exports/interventions/closed?date_from=AAAA-MM-JJ&date_to=AAAA-MM-JJ&equipement_id=<uuid, optionnel>&format=zip|pdf
      (date_from et date_to obligatoires, bornes incluses, date_from <= date_to, sinon 400 ValidationError).
- [x] Ne retient que les interventions dont status_actual = 'ferme' et dont la date du dernier
      passage à 'ferme' tombe dans la période ; tri par cette date puis par code.
- [x] Plafond de 100 fiches (abaissé de 200 le 2026-11-15) : au-delà, refus explicite (ValidationError, message qui demande
      de réduire la période), jamais de troncature silencieuse. Aucune fiche : 404 ou 400 clair.
- [x] Les fiches sont produites par le même chemin que l'export unitaire
      (ExportRepository.get_intervention_export_data + PDFGenerator, même modèle) ; pas de duplication du gabarit.
- [x] format=zip : archive zipfile (bibliothèque standard), un PDF par fiche nommé par son code
      assaini (même règle que l'export unitaire, noms uniques).
- [x] format=pdf : un seul PDF, assemblé avec WeasyPrint (rendu de chaque fiche puis
      concaténation des pages), aucune dépendance ajoutée.
- [x] Nom de fichier de la réponse : fiches-fermees_<from>_<to>.zip|.pdf ; Content-Disposition
      attachment pour zip, inline pour pdf.
- [x] Nouveau droit au catalogue ouvert à ADMIN et RESP seulement ; TECH, ACHETEUR et la clé MCP
      refusés (403). Limite de débit plus basse que l'unitaire (par exemple 2/minute).
- [x] SQL paramétré (%s), identifiants dynamiques par liste blanche ; aucun message brut
      d'exception vers le client.
- [x] Tests : droits par rôle, validation des dates et du format, plafond, contenu du ZIP
      (noms, nombre), nombre de pages du PDF unique >= nombre de fiches, filtre équipement.
- [x] Route ajoutée avant /interventions/{intervention_id}/pdf si nécessaire pour éviter tout conflit de chemin.
- [x] scripts/check.sh vert ; scripts/test-integration.sh vert (matrice des droits touchée).
- [x] docs/endpoints et CHANGELOG (« Non publié ») à jour.

## Compte rendu final

Route GET /exports/interventions/closed (déclarée avant la route unitaire), méthode
ExportRepository.list_closed_interventions (date du dernier passage à `ferme`, plafond 100
détecté par LIMIT 101), PDF unique assemblé par WeasyPrint, ZIP par zipfile.
Droit : règle BULK_EXPORT_PATHS dans backend/db/default_permissions.py (RESP ; ADMIN passe
toujours ; TECH, ACHETEUR, MCP refusés). Le catalogue se synchronise depuis les routes ;
compteurs attendus du bootstrap passés à 253 / 217 (ADMIN / RESP).
Tests : tests/test_export_masse.py et tests/integration/test_export_masse_integration.py.
Format inconnu ou paramètre absent : 422 (validation FastAPI) ; autres erreurs : 400 ; liste vide : 404.
À savoir : sur une instance déjà installée, le droit n'existe dans tunnel_permission qu'après
une nouvelle exécution du bootstrap (non lancée ici).

Contrôle de l'agent principal (2026-11-15) : diff conforme au périmètre, check.sh et
test-integration.sh (334) relancés verts, seuls les compteurs attendus de deux tests ajustés
(+1 ADMIN et RESP). Requête vérifiée en lecture seule sur la base de dev (266 fermées, toutes
avec un passage à `ferme`). Reviewer : APPROUVÉ avec réserves non bloquantes.
Chronométrage en lecture seule sur 20 fiches réelles : 0,31 s et 23 Ko par fiche, soit
environ 62 s pour 200 (nginx coupe à 120 s). Plafond abaissé à 100 par décision de
l'utilisateur. Bootstrap rejoué sur la base de dev avec son accord : droit ouvert à ADMIN
et RESP, fermé à TECH, ACHETEUR et MCP (vérifié en base).
NON VÉRIFIÉ : durée sur le serveur de production, délai Cloudflare réel, rendu à l'écran.
