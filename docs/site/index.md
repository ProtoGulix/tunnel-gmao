---
layout: home
hero:
  name: Tunnel GMAO
  text: Ne vous contentez pas de gérer votre maintenance. Faites-la progresser.
  tagline: Une GMAO open source pour les équipes de maintenance de 1 à 10 personnes, installée chez vous.
  actions:
    - theme: brand
      text: Comprendre Tunnel
      link: /comprendre/
    - theme: alt
      text: Essayer la démonstration
      link: https://demo.frezille.fr
features:
  - title: Une demande, une intervention
    details: Toute nouvelle intervention part d'une demande, avec son demandeur et son équipement.
  - title: L'action est l'unité de travail
    details: Chaque action enregistre son temps, la nature du travail et sa complexité de 1 à 10.
  - title: Une trace fiable
    details: Chaque changement de statut est journalisé avec son auteur, et le journal d'audit ne peut être ni modifié ni effacé par l'application.
  - title: Un préventif qui s'automatise
    details: Plans par classe d'équipement, échéancier glissant, interventions créées une semaine avant l'échéance.
  - title: Pensé pour le terrain
    details: Les techniciens saisissent depuis leur téléphone, avec une interface mobile dédiée.
  - title: Chez vous, à vous
    details: Open source (AGPL-3.0), installé par Docker Compose ; aucune donnée ne sort de l'entreprise.
---

<script setup>
import { useData } from "vitepress";

const { theme } = useData();
</script>

::: info Ce guide décrit Tunnel {{ theme.tunnelVersion }}
Votre version s'affiche sur le web, en bas du menu latéral : le bouton
`v{{ theme.tunnelVersion }}` ouvre les « Nouveautés ». Si votre installation n'est pas à jour,
certains écrans peuvent différer : [mettez à jour](/installation/mise-a-jour), ou lisez le
guide de votre version dans le dossier `docs/site` du
[dépôt](https://github.com/ProtoGulix/tunnel-gmao/tags), au tag de votre version.
:::

![Le Bilan du service de Tunnel : charge, fragmentation, temps de pilotage, part d'urgences et leurs tendances](/captures/web-direction-bilan-etat.webp)

## Essayer la démonstration

La démonstration est ouverte sur [demo.frezille.fr](https://demo.frezille.fr). Trois comptes
publics, un par rôle :

| Compte | Pour voir |
| --- | --- |
| `technicien@demo.frezille.fr` | l'accueil et la saisie du technicien |
| `acheteur@demo.frezille.fr` | les demandes d'achat et les commandes |
| `direction@demo.frezille.fr` | la direction technique et le bilan du service |

Mot de passe indiqué sur le site de la démonstration.

Les données sont fictives et réinitialisées chaque nuit : vous pouvez tout essayer.
