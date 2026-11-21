# 0034. Onglet « État » allégé : définitions au survol, mini-courbes

- Statut : accepté (2026-11-21, décisions de l'utilisateur)
- Date : 2026-11-21
- Prolonge : ADR 0033 (page Bilan du service) ; changement d'API (statuts, seuils,
  tendances) demandé par l'utilisateur le 2026-11-21 ; modifie la règle « définition écrite à
  côté de chaque indicateur » des ADR 0021 et 0032

## Contexte

Essai à l'écran de l'onglet « État » (ADR 0033) le 2026-11-21, avis de l'utilisateur : tout
est regroupé mais mal organisé, on s'y perd, trop verbeux. Constats sur les captures : huit
cartes portant chacune un paragraphe de définition ; formats de nombres mélangés
(« 115.2 % », « 28,6 % », « 807.0h ») ; cinq grands graphiques de trois barres pour trois
mois ; trois encadrés d'explication et une alerte qui répètent les chiffres ; préventif en
phrases tout en bas.

## Décision

1. **On garde la structure** (décision de l'utilisateur) : bandeau de chiffres clés en tête,
   puis le détail (temps et capacité, organisation du travail, préventif), allégé.
2. **Les définitions passent derrière une icône ⓘ** (décision de l'utilisateur) placée à
   côté du libellé, affichées au survol et au focus clavier. Les textes ne changent pas (ADR
   0021 : les courbes doivent rester comparables) ; ils ne sont plus écrits en clair à côté
   du chiffre. Cette règle vaut pour l'onglet « État » ; l'onglet « Audit » garde son
   affichage tant que l'utilisateur ne l'a pas demandé.
3. **Mini-courbes** (décision de l'utilisateur) : chaque chiffre du bandeau qui a une série
   mensuelle porte une petite courbe de la période ; les grands graphiques mensuels sont
   retirés. Le tableau « Valeurs par mois », replié, garde toutes les valeurs, dont les
   journées à trois interventions ou plus.
4. **Le statut est porté par le chiffre** : charge, fragmentation et pilotage reçoivent un
   badge coloré selon les seuils existants ; l'encadré « Règles de lecture » et l'alerte
   critique séparée sont retirés, leurs seuils vont dans la définition.
5. **Un seul format de nombres** : virgule décimale et espace avant l'unité (« 115,2 % »,
   « 807 h »), comme les chiffres d'Organisation.
6. **Détail replié** : les tableaux des causes de la fragmentation et du temps par site sont
   repliés ; leurs textes d'explication passent dans une ⓘ. La répartition du temps devient
   une barre empilée compacte (production, dépannage, pilotage, fragmentation) suivie de la
   barre des heures par type d'intervention, chacune nommée pour ne pas les confondre. Les
   tuiles du préventif deviennent des chiffres courts avec badge.
7. Aucune bibliothèque ajoutée (courbes dessinées en SVG).

Suite à l'essai du 2026-11-21 (décisions de l'utilisateur) :

8. **Les seuils de statut viennent de l'API seule.** Écart relevé : les définitions du web
   annonçaient charge > 85 %, fragmentation > 25 %, pilotage < 15 %, alors que l'API colore
   avec charge 75 / 100 %, fragmentation 5 / 15 %, pilotage 20 / 10 %. L'utilisateur garde
   ceux de l'API. `GET /stats/service-status` renvoie ses seuils :
   `thresholds: {charge|fragmentation|pilotage: {direction: "above"|"below", orange, red}}`
   (above : orange dès valeur ≥ orange, rouge dès ≥ red ; below : orange dès valeur ≤
   orange, rouge dès ≤ red). Le web affiche ces seuils dans la définition au lieu de les
   recopier, et ne garde aucun seuil ni texte de statut de repli : sans statut, pas de badge.
9. **Badges d'un mot**, texte donné par l'API : charge Normale / Élevée / Au plafond ;
   fragmentation Maîtrisée / Notable / Élevée ; pilotage Présent / Limité / Absent.
10. **Tendance sur la période** : `GET /stats/organisation` renvoie
    `trends: {urgent_share, interrupted_share, avg_interventions_per_tech_day,
    scattered_days_share, preventive_hours_share}`, chacun `"up"`, `"down"`, `"stable"` ou
    `null`. Calcul : pente des moindres carrés sur les valeurs mensuelles non nulles de la
    période (mois courant compris), au moins 3 mois, sinon `null` ; variation estimée =
    pente × (nombre de mois − 1) ; « stable » si sa valeur absolue est sous 2 points pour
    une part, sous 0,1 pour les interventions par journée. La charge, la fragmentation et le
    pilotage n'ont pas de série mensuelle : pas de tendance (choix de l'utilisateur, plutôt
    que la comparaison avec la période précédente). Le web affiche une flèche neutre, en
    gris, sans jugement (le badge porte le jugement).
11. **Rendu** : mini-courbes lissées ; valeurs écrites dans les segments des barres de temps
    au lieu d'une légende.
12. **Courbe et tendance pour les huit chiffres** (demande de l'utilisateur du 2026-11-21,
    qui complète le point 10) :
    - `GET /stats/service-status` renvoie `monthly: [{month: "AAAA-MM", total_hours,
      capacity_hours, charge_percent, frag_percent, pilot_percent}]`, un élément par mois
      calendaire touché par la période, mêmes règles de classement que les totaux ; la
      capacité d'un mois est proratisée sur ses jours compris dans la période ; un mois sans
      heure donne des pourcentages `null`. Il renvoie aussi `trends: {charge_percent,
      frag_percent, pilot_percent}` (même calcul qu'au point 10, « stable » sous 2 points).
    - `GET /stats/organisation` ajoute à chaque mois `waiting_parts_count` : nombre
      d'interventions en attente de pièces au dernier jour du mois (aujourd'hui pour le mois
      courant), reconstitué depuis `intervention_status_log` (dernier changement de statut à
      cette date) ; `null` pour un mois antérieur au premier enregistrement du journal
      (janvier 2025 en dev). `trends.waiting_parts_count` : même calcul, « stable » sous une
      intervention.
    - Le web affiche courbe et flèche sur les huit cartes.

## Alternatives écartées

- Trois blocs « questions » (a-t-on de la marge, le travail est-il coupé, qu'est-ce qui
  attend) : écarté par l'utilisateur au profit de la structure actuelle allégée.
- Glossaire replié en bas, ou une ligne courte sous chaque chiffre : moins direct que l'ⓘ
  (écarté par l'utilisateur).
- Un seul graphique à choix, ou tableau seul : perd la tendance d'un coup d'œil.
- Tendance par comparaison avec la période précédente de même durée : couvrirait aussi la
  charge, mais l'utilisateur a choisi le sens sur la période.
- Flèche verte ou rouge selon un « bon sens » par indicateur : une hausse n'est pas bonne
  ou mauvaise dans l'absolu (écarté par l'utilisateur).
- Seuils des définitions du web (85 / 25 / 15 %) : écartés par l'utilisateur.
