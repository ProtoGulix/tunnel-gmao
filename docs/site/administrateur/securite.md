# Sécurité et clés d'API

Écran : **Administration**, onglet **Sécurité**. Quatre sous-onglets : **Logs**, **IP
Bloquées**, **Domaines** et **Clés API**. Cet onglet est réservé à l'administrateur par
défaut.

## Logs de sécurité

Le tableau liste les événements de sécurité avec la date, le type d'événement, l'utilisateur,
l'IP et un détail. Vous pouvez filtrer par type et par période. Les types proposés :

- échec de connexion et connexion réussie ;
- jeton révoqué ;
- changement de rôle ;
- utilisateur désactivé ;
- IP bloquée ;
- accès refusé ;
- permission modifiée.

L'IP affichée dépend de l'installation : derrière un proxy, elle n'est fiable que si le
proxy est déclaré. Voir [Installation](../installation/docker-compose).

## IP bloquées

Une IP bloquée ne peut plus se connecter : sa tentative de connexion est refusée.

1. Cliquez sur **Bloquer une IP**.
2. Saisissez l'adresse IP.
3. Ajoutez une raison si vous le souhaitez.
4. Choisissez la durée : permanent, 1 heure, 24 heures, 7 jours ou 30 jours.
5. Cliquez sur **Bloquer**.

Le tableau montre la raison, la date de fin du blocage (ou « Permanent ») et l'auteur du
blocage. **Débloquer** lève le blocage après confirmation.

## Domaines de courriel

Cette règle limite les connexions selon le domaine du courriel (la partie après le @).

- Liste vide : tous les domaines sont acceptés.
- Dès qu'une règle existe, seuls les domaines autorisés peuvent se connecter. Cela vaut
  pour tous les comptes, le vôtre compris.

Cliquez sur **Ajouter un domaine** et saisissez-le (par exemple `example.com`). Si la règle
exclurait votre propre compte, Tunnel refuse l'ajout et affiche un message : vous ne
pouvez pas vous enfermer dehors. La corbeille supprime une règle après confirmation ;
Tunnel peut aussi la refuser pour la même raison.

## Clés d'API

Une clé d'API permet à une application externe de lire les données de Tunnel. Elle porte
le rôle MCP, qui est en lecture seule.

1. Cliquez sur **Nouvelle cle API** (libellé affiché sans accent) et donnez-lui un nom (par exemple « Serveur MCP
   production »).
2. Tunnel affiche le secret **une seule fois**. Copiez-le tout de suite et rangez-le dans
   un coffre à secrets. Il n'est pas possible de le revoir.
3. Dans le tableau, vous voyez le nom, le début de la clé, le rôle, le statut, la date
   d'expiration et la dernière utilisation.

Pour arrêter une clé, utilisez **Desactiver** (réversible avec **Activer**) ou **Revoquer** (libellés affichés sans accent)
(définitif, après confirmation).

Ne partagez jamais une clé par courriel ou dans un document. Si elle a pu fuiter, révoquez-la
et créez-en une nouvelle.

## Mode démonstration

Sur une instance publique de démonstration, ces réglages sont verrouillés (mots de passe,
comptes, droits, clés d'API, règles de sécurité) et aucun courriel n'est envoyé. Cela ne
concerne pas une installation normale.
