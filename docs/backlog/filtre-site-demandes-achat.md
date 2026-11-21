# Filtre de site sur les demandes d'achat

L'accueil acheteur avait un filtre de site sans effet : `/purchase-requests/list` n'a aucun
filtre par équipement ou site (le paramètre `site` envoyé était ignoré). Le filtre a été
retiré (DEMO-01).

Besoin : un paramètre `machine_id` avec descendants sur `/purchase-requests/list`, comme
sur `/intervention-requests`. C'est une extension d'API publique : à décider par
l'utilisateur.
