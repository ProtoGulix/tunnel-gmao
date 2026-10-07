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

## Limites connues (5.0.0)

Les droits par rôle ne sont pas encore appliqués aux routes métier : tout utilisateur
authentifié peut modifier les données métier. Réservez les comptes aux personnes de
confiance. Corrigé dans la prochaine version (matrice des permissions appliquée,
ADR 0007).
