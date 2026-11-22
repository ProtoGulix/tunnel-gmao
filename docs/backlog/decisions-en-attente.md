# Décisions de l'utilisateur en attente (tri du 2026-11-19)

- Connexion : accepter les emails en `.local` ou `.test` ? (EmailStr, api/auth/routes.py:27 ;
  test_bootstrap_email.py acte le refus.)
- Relancer automatiquement une API « unhealthy » (chien de garde) ? HEALTHCHECK présent
  (backend/Dockerfile:36), aucune relance.
- Transitions et réparation des demandes réservées à RESP (db/default_permissions.py:151-152) :
  à confirmer avec l'usage des techniciens.
- Import CSV des demandes d'achat : exclure en un geste les lignes fautives ?
  (`excluded_rows` existe, purchase_requests/routes.py:259-309.)
- Données d'exemple d'usine (ADR 0006) : à relire avant livraison.
- Journaux bruts de la base (détail des DatabaseError) : à garder privés, à documenter.
- Écran Coordination du web : peu utilisé (utilisateur, 2026-11-21). Le garder, le
  retirer ou le fondre dans un autre écran ? Restent ouverts s'il est gardé : changements
  de statut et de priorité en ligne qui échouent sans message, « Créer inter » qui ne
  présélectionne pas la demande (constats vérifiés le 2026-11-21, ADR 0039).
