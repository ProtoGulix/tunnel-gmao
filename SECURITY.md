# Sécurité

## Signaler une vulnérabilité

Merci de ne pas ouvrir d'issue publique. Utilisez le signalement privé de GitHub
(onglet « Security » du dépôt, « Report a vulnerability »). Décrivez la version, la
configuration et les étapes pour reproduire. Vous recevrez une réponse sous quelques
jours.

## Déploiement

- Tunnel sert du HTTP : toute instance accessible hors du réseau de l'usine doit être
  placée derrière un proxy HTTPS (voir deploy/README.md).
- Ne publiez jamais d'autre port que celui du service web.

## Versions corrigées

- 5.0.0 : les droits par rôle n'étaient pas appliqués aux routes métier (tout
  utilisateur authentifié pouvait modifier les données). Corrigé en 5.1.0 : la matrice
  des permissions est vérifiée à chaque requête (ADR 0007). Mettez à jour.
