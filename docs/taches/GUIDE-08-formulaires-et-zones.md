# GUIDE-08. Formulaires et zones précises dans le guide

- Statut : faite (2026-11-27), périmètre réduit aux notifications
- Agent : principal (outil), general-purpose (inventaire et captures)
- Branche : docs/captures-zones (depuis docs/captures-guide)
- Dépend de : GUIDE-07
- Périmètre d'écriture : docs/site/scripts/captures.json, docs/site/public/captures/,
  docs/site/**/*.md (insertion des images et de leur texte alternatif), cette fiche.
  Exclu : backend/, web/, mobile/, deploy/, le scénario de démo, captures.mjs (sauf bogue
  des zones, signalé dans le compte rendu).

## Contexte

Les captures sont des écrans entiers. L'utilisateur relève qu'il manque les formulaires et des
zones plus précises. Le script sait maintenant limiter une capture à un élément (`zone`),
agrandir la fenêtre (`hauteur`) et remplir un champ (`saisir`). Avant chaque version, les
captures sont reprises (CLAUDE.md, section 12.3).

## Critères d'acceptation

- [x] `zone`, `hauteur` et `saisir` dans captures.mjs, décrits dans `_aide` et docs/site/README.md
- [x] scripts/verifier-captures.mjs dans check.sh : image citée sans entrée, entrée non citée,
  fichier absent ou orphelin font échouer
- [x] inventaire : chaque page qui décrit un formulaire ou une boîte de dialogue montre sa capture
  (ou la fiche dit pourquoi non)
- [x] `npm run docs:screenshots` rejoue toutes les captures de bout en bout, sans échec
- [x] `npm run docs:build` sans lien mort ; check.sh vert
- [x] CHANGELOG (« Non publié ») à jour

## Compte rendu final

Périmètre réduit à la demande de l'utilisateur : zone des notifications seulement ; l'inventaire
des formulaires est arrêté, les captures se valideront une par une.

Captures ajoutées : web-direction-notifications-zone (haut du menu, cloche fermée avec compteur),
web-direction-notifications-panneau (panneau ouvert), mobile-technicien-notifications-cloche
(en-tête de l'accueil mobile). Insérées dans responsable/accueil, technicien/notifications (mobile
puis web), comprendre/preventif et responsable/preventif.

Modifications de captures.mjs : `saisir` accepte `placeholder` (champ sans libellé associé ; le
libellé « Nom » correspondait aussi à « Prénom ») ; `zone.hauteurMax` limite la hauteur
(haut de la barre latérale). Décrites dans `_aide`.

Résultats : `zone` fonctionne (dialogues, cartes, barre latérale) ; `saisir` par libellé ou
placeholder fonctionne ; `hauteur` fonctionne. Les anciennes captures n'ont pas été rejouées.

### Brouillons non retenus

Entrées retirées de captures.json (images supprimées). Dix ont produit une image en essai
(intervention-creation, equipement-creation, plan-creation, utilisateur-creation, export-fiches,
action-formulaire, type-intervention, demande-achat-creation, piece-creation, fournisseur-creation) ;
demande-rejet, tache-creation, mobile-demande-achat et qualification ont échoué (sélecteurs à revoir).

```json
{"id": "web-direction-export-fiches", "compte": "direction", "app": "web", "chemin": "/interventions", "attente": {"texte": "Exporter les fiches fermées"}, "etapes": [{"clic": "Exporter les fiches fermées"}, {"pause": 1500}, {"pause": 1000}], "zone": {"selecteur": "[role=dialog]"}}
{"id": "web-acheteur-demande-achat-creation", "compte": "acheteur", "app": "web", "chemin": "/achats?tab=requests", "attente": {"texte": "Nouvelle demande"}, "etapes": [{"clic": "Nouvelle demande"}, {"pause": 1500}, {"pause": 1000}], "zone": {"selecteur": "[role=dialog]"}, "hauteur": 1000}
{"id": "web-acheteur-piece-creation", "compte": "acheteur", "app": "web", "chemin": "/stock?tab=items", "attente": {"texte": "Nouvelle pièce"}, "etapes": [{"clic": "Nouvelle pièce"}, {"pause": 1500}, {"pause": 1000}], "hauteur": 1000}
{"id": "web-acheteur-fournisseur-creation", "compte": "acheteur", "app": "web", "chemin": "/stock?tab=suppliers", "attente": {"texte": "Nouveau fournisseur"}, "etapes": [{"clic": "Nouveau fournisseur"}, {"pause": 1500}, {"pause": 1000}], "zone": {"selecteur": "[role=dialog]"}}
{"id": "web-direction-intervention-creation", "compte": "direction", "app": "web", "chemin": "/interventions", "attente": {"texte": "Nouvelle intervention"}, "etapes": [{"clic": "Nouvelle intervention"}, {"saisir": {"champ": "", "placeholder": "Rechercher un équipement", "valeur": "Presse"}}, {"pause": 1500}, {"clicPremier": "[role=dialog] >> text=Presse à injecter 350 t"}, {"attendre": "Demandes ouvertes"}, {"pause": 1000}], "zone": {"selecteur": "[role=dialog]"}, "hauteur": 1000}
{"id": "web-direction-equipement-creation", "compte": "direction", "app": "web", "chemin": "/equipements", "attente": {"texte": "Nouvel équipement"}, "etapes": [{"clic": "Nouvel équipement"}, {"saisir": {"champ": "", "placeholder": "Scie principale", "valeur": "Convoyeur de sortie 2"}}, {"saisir": {"champ": "", "placeholder": "Atelier A", "valeur": "Atelier 2"}}, {"pause": 1000}], "zone": {"selecteur": "[role=dialog]"}, "hauteur": 1000}
{"id": "web-direction-plan-creation", "compte": "direction", "app": "web", "chemin": "/preventive", "attente": {"texte": "Plans"}, "etapes": [{"clicPremier": "button:text-is('Nouveau')"}, {"attendre": "Code"}, {"saisir": {"champ": "", "placeholder": "Maintenance hebdomadaire", "valeur": "Contrôle trimestriel du convoyeur"}}, {"saisir": {"champ": "", "placeholder": "PM-SCIE", "valeur": "PRE-CONVOY-TRIM"}}, {"pause": 1000}], "zone": {"selecteur": ".rt-Card", "contenant": "Nouveau plan préventif"}}
{"id": "web-admin-utilisateur-creation", "compte": "admin", "app": "web", "chemin": "/admin?tab=users", "attente": {"texte": "Marchand"}, "etapes": [{"clic": "Nouvel utilisateur"}, {"attendre": "Créer"}, {"saisir": {"champ": "", "placeholder": "Jean", "valeur": "Julie"}}, {"saisir": {"champ": "", "placeholder": "Dupont", "valeur": "Lambert"}}, {"saisir": {"champ": "Email", "valeur": "julie.lambert@exemple.fr"}}, {"saisir": {"champ": "", "placeholder": "JD", "valeur": "JL"}}, {"pause": 1000}], "zone": {"selecteur": "[role=dialog]"}, "hauteur": 1000}
{"id": "web-direction-demande-rejet", "compte": "direction", "app": "web", "chemin": "/intervention-requests", "attente": {"texte": "DI-"}, "etapes": [{"pause": 1500}, {"clicPremier": "text=/^DI-/"}, {"clic": "Rejeter"}, {"attendre": "Confirmer"}, {"pause": 1000}], "zone": {"selecteur": "[role=dialog]"}}
{"id": "web-direction-tache-creation", "compte": "direction", "app": "web", "chemin": "/interventions", "attente": {"selecteur": "text=/^[A-Z]{2}-\\d{2}$/"}, "etapes": [{"clicPremier": "text=/^[A-Z]{2}-\\d{2}$/"}, {"clicPremier": "[role=tab]:has-text(\"Tâches\")"}, {"clic": "Ajouter une tâche"}, {"pause": 1000}], "zone": {"selecteur": "[role=dialog]"}, "hauteur": 1000}
{"id": "web-technicien-action-formulaire", "compte": "technicien", "app": "web", "chemin": "/", "attente": {"selecteur": "main, [role='main'], h1, h2"}, "etapes": [{"pause": 1500}, {"clicPremier": "[title='Logger du temps']"}, {"pause": 1500}, {"pause": 1000}], "zone": {"selecteur": "[role=dialog]"}, "hauteur": 1100}
{"id": "mobile-technicien-demande-achat", "compte": "technicien", "app": "web", "chemin": "/interventions?tab=liste", "attente": {"texte": "Détection fin de bande"}, "etapes": [{"clic": "Détection fin de bande"}, {"attendre": "Ajouter une action"}, {"clicPremier": "button:has(svg.lucide-shopping-cart)"}, {"attendre": "Nouvelle demande d'achat"}, {"pause": 1000}]}
{"id": "web-acheteur-qualification", "compte": "acheteur", "app": "web", "chemin": "/achats?tab=requests", "attente": {"texte": "Nouvelle demande"}, "etapes": [{"clic": "À qualifier"}, {"pause": 1500}, {"clicPremier": "text=/^DA-/"}, {"clic": "Qualifier"}, {"pause": 1500}, {"pause": 1000}], "zone": {"selecteur": ".rt-Card", "contenant": "Pièce catalogue"}}
{"id": "web-admin-type-intervention", "compte": "admin", "app": "web", "chemin": "/admin?tab=referentiel&ref=interventions", "attente": {"texte": "Nouveau type"}, "etapes": [{"clic": "Nouveau type"}, {"attendre": "Créer"}, {"pause": 1000}], "zone": {"selecteur": "[role=dialog]"}}
```

## Lot 2 (2026-11-27) : pages pauvres en captures

Demande de l'utilisateur : « Fait tout les points ». Schémas de Comprendre repris dans les pages
pratiques (4d7ed06). Captures à ajouter, chacune avec son entrée dans captures.json, insérée
près du texte qu'elle illustre (texte alternatif précis), dans le style des pages déjà faites :

1. Terrain : technicien/saisir-une-action (champs du formulaire mobile, message de refus),
   technicien/demander-une-piece (formulaire mobile), technicien/signaler-un-probleme
   (formulaire mobile rempli).
2. responsable/coordination (une zone par section, créer une intervention, clore une tâche),
   responsable/audit-motifs (fenêtre de motif, journal), acheteur/commandes-fournisseurs
   (changer le statut, devis par courriel, négociation, réception), acheteur/repartition
   (Aperçu du dispatch), acheteur/demandes-achat (qualification).
3. administrateur : referentiels (type d'intervention, motif), roles-permissions (matrice en
   zone), securite, audit.

Découvrir (decouvrir/index.md) : gardée, hors menu, elle sert les anciens liens.

Critères : verifier-captures.mjs vert ; chaque nouvelle entrée rejouée par
`CAPTURES_ONLY=... npm run docs:screenshots` ; docs:build sans lien mort ; aucune écriture
hors périmètre (docs/site/**/*.md, captures.json, public/captures/, cette fiche).

### Compte rendu du lot 2 (2026-11-27)

25 captures ajoutées, toutes rejouées et relues, insérées près du texte (verifier-captures
vert : 106 entrées ; docs:build sans erreur).

- technicien : mobile-technicien-action-champs, -action-refus (cadre Erreur, contrôle côté
  client sans appel API), -piece-formulaire, -demande-remplie.
- responsable/coordination : web-direction-coordination-planning, -equipements, -interventions,
  -creer, -clore. responsable/audit-motifs : web-direction-motif-autre (Autre raison, Précision
  obligatoire) ; le journal reprend web-admin-audit.
- acheteur : web-acheteur-commande-statut, -devis, -negociation, -livraison ;
  web-acheteur-dispatch-apercu ; web-acheteur-qualifier.
- administrateur : web-admin-referentiel-interventions, -type-nouveau ; web-admin-roles-vue-accueil ;
  web-admin-securite-ip-bloquer, -cles ; web-admin-audit-regles, -regle-nouvelle, -raisons,
  -raison-nouvelle.

Non capturé ou approché :
- Qualification : la démo n'a aucune demande « À qualifier ». La capture montre l'écran Modifier
  d'une demande « À dispatcher » (même formulaire) ; le texte alternatif le dit.
- Réception d'un panier : pas de saisie des quantités reçues dans Tunnel ; le menu Changer le
  statut d'un panier en livraison (Clôturer) illustre la page.
- Clés API : la démo n'a aucune clé, la capture montre l'état vide.
- Matrice des droits : zone du haut (colonnes de rôles et ligne Vue d'accueil) seulement.

Échecs corrigés : sélecteurs de demande-remplie (résultat de recherche cliqué par texte),
roles (attente et zone), securite-cles (libellé sans accent « Cles API »), dispatch (alertdialog),
qualifier (formulaire intégré, pas une fenêtre). Aucune validation d'écriture cliquée, hors le
refus côté client de action-refus. Démo non arrêtée.

## Clôture (agent principal, 2026-11-27)

Relecture point par point par l'utilisateur sur l'aperçu (DOCS_SRC). En plus des lots : trois
schémas du préventif (plan, statuts d'occurrence, déclenchement) ; scénario de démonstration
complété (plan désactivé, demande I207 à rattacher, DA326 à qualifier, clé d'API K1 au secret
jeté) avec test d'intégration ; accents de l'écran Clés API (web) ; section « mode
démonstration » retirée du guide à la demande de l'utilisateur. Passage complet 106/106,
docs:build sans lien mort, check.sh vert, test_demo_loader_integration 12 réussis.
Non fait : capture « Ignorer une occurrence » (statut en attente transitoire, constat produit
noté dans ETAT).
