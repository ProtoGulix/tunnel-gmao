# 0047. Accueil direction : ce qui attend une décision

- Statut : accepté (2026-11-28)
- Date : 2026-11-28
- Affine : remplace ADR 0046 (bilan des demandes avant la liste) ; ADR 0039 (priorités)

## Contexte

L'accueil « Direction technique » de l'ADR 0046 montre un bilan d'analyse : il dit où en
est le stock, pas ce que la direction doit faire. L'utilisateur veut repartir de zéro sur
une seule question : « qu'est-ce qui attend ma décision ? » (fiche et maquette du
2026-11-28). La direction tranche les demandes et débloque ce que l'équipe n'a pas pu
débloquer seule, avec l'acheteur ou la production.

Constats vérifiés le 2026-11-28 (code et base de dev, lecture seule) :

- `intervention_request.priorite` existe mais n'est lue ni écrite nulle part : vide sur
  les 58 demandes à qualifier.
- La liste `GET /interventions` ne donne pas la date d'entrée dans le statut courant ;
  `intervention_status_log` n'a pas d'index sur `intervention_id`.
- Aucun écran n'écrit de note au changement de statut d'une intervention : les notes du
  journal sont des textes de la base (« Changement statut automatique », « Création
  intervention »).

## Décision

1. Écran, de haut en bas, lisible à largeur de téléphone :
   1. une ligne de bilan : demandes à qualifier, nombre de plus de 90 jours, entrées et
      sorties sur 8 semaines, sens de la tendance (`GET /stats/demandes`), et un lien qui
      déplie le bilan détaillé de l'ADR 0046 ;
   2. « À trancher » : demandes `nouvelle` et `en_attente`, urgentes d'abord, puis de la
      plus ancienne à la plus récente, celles de plus de 90 jours regroupées et tronquées.
      Chaque ligne porte les transitions de `allowed_transitions` (Accepter, En attente,
      Rejeter) : acceptation par AcceptRequestDialog, rejet par la fenêtre de motif
      d'audit commune ;
   3. une carte par interlocuteur, limitée aux interventions bloquées depuis plus de N
      jours, urgentes d'abord puis par durée : « À voir avec l'acheteur »
      (`attente_pieces`, cause tirée des demandes d'achat liées) et « À voir avec la
      production » (`attente_prod`, cause = dernière note du journal au passage dans le
      statut, hors textes écrits par la base, sinon « Aucun motif saisi ») ; carte vide :
      encart factuel ;
   4. « Côté maintenance » : liens vers les interventions sans action et les préventifs
      en retard ;
   5. « Où ça s'entasse » : barres par site puis par équipement, vers la liste filtrée.
2. Urgence d'une demande : `priorite` prend les codes de priorité des interventions
   (`faible`, `normal`, `important`, `urgent`, ADR 0039), saisie facultative dans les
   formulaires de création web et mobile, exposée en lecture, préremplit la priorité à
   l'acceptation. Contrainte en base : NULL ou une de ces valeurs (migration 0030, sans
   modification de données).
3. La direction peut changer l'urgence d'une demande ouverte : route d'écriture dédiée,
   ADMIN et RESP par défaut, tracée dans le journal d'audit.
4. Lecture `GET /stats/blocages?site_id=` : interventions `attente_pieces` et
   `attente_prod` bloquées depuis plus de N jours. Entrée dans le statut = dernière ligne
   du journal vers ce statut, à défaut la date de signalement. Le seuil, les causes et
   le tri sont calculés par l'API et le seuil est renvoyé dans la réponse. Ouverte à tous
   les connectés (règle de lecture par défaut, ADR 0007), sans migration.
5. N vient d'une variable d'environnement (7 par défaut, au moins 1), distincte de
   `REMINDER_INTERVAL_DAYS`.
6. Aucun chiffre par personne (ADR 0043, 0044), pas de tableau d'indicateurs sur l'accueil
   (ADR 0044). Les tuiles et le repli de l'ADR 0046 sont retirés.

## Alternatives écartées

- Champ `status_since` dans `GET /interventions` : une sous-requête de plus à chaque appel
  de la liste la plus utilisée, sans index, pour un seul écran ; le seuil resterait dans
  le front.
- Calcul de la durée dans le front à partir des détails : N appels et une règle métier
  côté client (CLAUDE.md section 4).
- « À trancher » sans bloc Urgentes : la direction ne verrait pas l'urgence signalée.
- Case « Urgent » seule : l'utilisateur préfère les quatre priorités déjà connues.
- Seuil en constante du code ou repris de `REMINDER_INTERVAL_DAYS` : un réglage
  d'installation est voulu, et une même valeur aurait deux sens.
- Contrôle de `priorite` par l'API seule : la base ne garantirait pas la valeur.

## Conséquences

- Migration 0030 (contrainte), une route d'écriture et une route de lecture de plus dans
  le catalogue (droits par défaut au démarrage de l'API), une variable d'environnement
  documentée dans deploy/README.md.
- Tant qu'aucun écran ne demande un motif au passage en attente production, la carte
  affiche « Aucun motif saisi » (motif obligatoire : hors périmètre, backlog).
- Hors périmètre, au backlog : revue par lot des demandes de plus de 90 jours, motif
  obligatoire au passage en attente production, donnée « machine arrêtée », validation
  d'achats par la direction, date de livraison prévue (`supplier_order.expected_delivery_date`
  existe, non affichée).
