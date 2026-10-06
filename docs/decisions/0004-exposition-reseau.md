# 0004. Exposition réseau : services en local, seul le proxy web est joignable

- Statut : accepté
- Date : 2026-10-06
- Affine : CLAUDE.md section 6.5

## Contexte

Un audit interne de l'instance de développement (2026-10-06) a montré des
services publiés sur toutes les interfaces de la machine (base de données,
outils d'administration, API), une documentation interactive de l'API publique à
cause d'une valeur d'API_ENV mal orthographiée, et un proxy qui relayait
l'en-tête X-Forwarded-For fourni par le client. Les corrections ont été faites
sur l'instance ; cette décision fixe les règles qui en découlent pour toute
installation.

## Décision

1. Une seule chaîne publique : proxy HTTPS (externe, ADR 0006), puis le nginx de
   la stack. Base de données et API ne publient aucun port ; le port du nginx est
   lié à 127.0.0.1 par défaut.
2. API_ENV n'accepte que development, production et test : toute autre valeur
   empêche le démarrage, pour qu'une faute de frappe ne désactive jamais les
   garde-fous de production (/docs fermé, HSTS, refus d'AUTH_DISABLED).
3. L'IP du client est posée par nginx : l'adresse TCP par défaut, ou l'en-tête
   d'un proxy explicitement déclaré de confiance (TRUSTED_PROXIES,
   REAL_IP_HEADER). Un X-Forwarded-For envoyé par le client n'est jamais relayé.
4. Les secrets (mots de passe de la base, clé JWT) sont générés aléatoirement à
   l'installation et ne sont jamais versionnés.
5. Les outils d'administration (client SQL, pgAdmin) s'utilisent par tunnel SSH,
   jamais en ouvrant un port.

## Alternatives écartées

- Pare-feu de l'hôte devant des ports publiés sur 0.0.0.0 : Docker contourne les
  règles ufw classiques, une seule erreur exposerait tout.
- Laisser /docs public en développement : une instance de développement
  joignable depuis Internet se comporte comme une production.

## Conséquences

- Le code lit le premier élément de X-Forwarded-For : c'est sûr parce que nginx
  l'écrase toujours. Toute nouvelle façon d'exposer l'API doit garder cette
  propriété.
- Accéder à l'API sans passer par le nginx de la stack n'est pas supporté.
