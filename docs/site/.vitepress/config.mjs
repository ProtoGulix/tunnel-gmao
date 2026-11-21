import { defineConfig } from "vitepress";

// Guide utilisateur de Tunnel GMAO (ADR 0037) : français, rangé par rôle.
const repoLink = "https://github.com/ProtoGulix/tunnel-gmao";

// Barre latérale : une section par rôle, repliée sauf la section ouverte.
const section = (text, base, pages) => ({
  text,
  link: `${base}/`,
  collapsed: true,
  items: pages.map(([label, page]) => ({ text: label, link: `${base}/${page}` })),
});

const roleSidebar = [
  { text: "Découvrir Tunnel", link: "/decouvrir/" },
  section("Technicien", "/technicien", [
    ["Mes tâches", "mes-taches"],
    ["Saisir une action", "saisir-une-action"],
    ["Signaler un problème", "signaler-un-probleme"],
    ["Demander une pièce", "demander-une-piece"],
    ["Clore ou rouvrir", "cloturer-rouvrir"],
    ["Notifications et compte", "notifications"],
  ]),
  section("Responsable", "/responsable", [
    ["Accueil direction technique", "accueil"],
    ["Traiter les demandes", "demandes"],
    ["Interventions et tâches", "interventions-taches"],
    ["Coordination", "coordination"],
    ["Préventif", "preventif"],
    ["Équipements", "equipements"],
    ["Bilan du service", "bilan"],
    ["Audit et motifs", "audit-motifs"],
  ]),
  section("Acheteur", "/acheteur", [
    ["Accueil acheteur", "accueil"],
    ["Demandes d'achat", "demandes-achat"],
    ["Répartir et comparer", "repartition"],
    ["Commandes fournisseurs", "commandes-fournisseurs"],
    ["Pièces et fournisseurs", "pieces-fournisseurs"],
    ["Import CSV", "import-csv"],
  ]),
  section("Administrateur", "/administrateur", [
    ["Utilisateurs", "utilisateurs"],
    ["Rôles et permissions", "roles-permissions"],
    ["Référentiels", "referentiels"],
    ["Audit : règles et raisons", "audit"],
    ["Sécurité et clés d'API", "securite"],
  ]),
  section("Installation", "/installation", [
    ["Prérequis et installation", "docker-compose"],
    ["Mise à jour et sauvegarde", "mise-a-jour"],
  ]),
  { text: "Feuille de route", link: "/feuille-de-route" },
];

export default defineConfig({
  title: "Tunnel GMAO",
  description: "Guide utilisateur de Tunnel, la GMAO open source des petites équipes de maintenance.",
  lang: "fr-FR",
  base: "/",
  lastUpdated: false,
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: "Accueil", link: "/" },
      { text: "Découvrir Tunnel", link: "/decouvrir/" },
      {
        text: "Par rôle",
        items: [
          { text: "Technicien", link: "/technicien/" },
          { text: "Responsable", link: "/responsable/" },
          { text: "Acheteur", link: "/acheteur/" },
          { text: "Administrateur", link: "/administrateur/" },
        ],
      },
      { text: "Installation", link: "/installation/" },
      { text: "Feuille de route", link: "/feuille-de-route" },
    ],
    sidebar: roleSidebar,
    socialLinks: [{ icon: "github", link: repoLink }],
    search: {
      provider: "local",
      options: {
        translations: {
          button: { buttonText: "Rechercher", buttonAriaLabel: "Rechercher" },
          modal: {
            displayDetails: "Afficher le détail",
            resetButtonTitle: "Effacer la recherche",
            backButtonTitle: "Fermer la recherche",
            noResultsText: "Aucun résultat pour",
            footer: {
              selectText: "Sélectionner",
              selectKeyAriaLabel: "entrée",
              navigateText: "Naviguer",
              navigateUpKeyAriaLabel: "flèche haut",
              navigateDownKeyAriaLabel: "flèche bas",
              closeText: "Fermer",
              closeKeyAriaLabel: "échap",
            },
          },
        },
      },
    },
    outline: { label: "Sur cette page" },
    docFooter: { prev: "Page précédente", next: "Page suivante" },
    darkModeSwitchLabel: "Apparence",
    lightModeSwitchTitle: "Passer au thème clair",
    darkModeSwitchTitle: "Passer au thème sombre",
    sidebarMenuLabel: "Menu",
    returnToTopLabel: "Retour en haut",
    langMenuLabel: "Changer de langue",
    skipToContentLabel: "Aller au contenu",
    notFound: {
      title: "Page introuvable",
      quote: "Cette page n'existe pas ou a été déplacée.",
      linkLabel: "Retour à l'accueil",
      linkText: "Retour à l'accueil",
    },
    footer: {
      message: "Publié sous licence AGPL-3.0.",
    },
  },
});
