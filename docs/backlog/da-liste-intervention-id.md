# Lier l'intervention depuis la liste des demandes d'achat

PurchaseRequestListItem ne renvoie que intervention_code, pas l'id de l'intervention : la colonne Intervention de la vue acheteur (BuyerHomeView) ne peut donc pas être un lien. Ajouter intervention_id au schéma (modification d'API publique, accord requis), puis l'afficher avec EntityCodeLink (ADR 0009).
