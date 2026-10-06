# Doublon d'appel get_facets dans equipements

api/equipements/routes.py appelle repo.get_facets() deux fois (vers les lignes 44-45). Supprimer le doublon. NON VÉRIFIÉ depuis la v4 : contrôler avant de corriger.
