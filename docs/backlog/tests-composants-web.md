# Tests de rendu des composants du front web

Le front web n'a que node:test pour la logique pure (npm test, lancé par check.sh). Tester le rendu d'un composant (par exemple EntityCodeLink sans id : badge sans icône, ADR 0009) demande vitest, @testing-library/react et jsdom : dépendances à valider avec l'utilisateur. Node 21 minimum pour le glob de npm test.
