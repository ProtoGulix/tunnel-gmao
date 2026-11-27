# Utilisateurs

Écran : **Administration**, onglet **Utilisateurs**.

![Administration, onglet Utilisateurs : tableau des comptes avec initiales, courriel, rôle, statut et boutons d'action](/captures/web-admin-utilisateurs.webp)

Le tableau liste les comptes avec leurs initiales, leur nom, leur courriel, leur rôle et
leur statut (Actif ou Inactif). Vous pouvez chercher un nom, filtrer par statut (Tous,
Actifs, Inactifs) et filtrer par rôle.

## Créer un compte

1. Cliquez sur **Nouvel utilisateur**.
2. Remplissez le prénom, le nom, le courriel, les initiales (5 caractères au plus) et le rôle.
3. Saisissez le mot de passe, puis confirmez-le. Il doit compter au moins 8 caractères,
   dont une majuscule et un chiffre.
4. Cliquez sur **Créer**.

![Fenêtre Nouvel utilisateur : prénom, nom, courriel, initiales, rôle et mot de passe](/captures/web-admin-utilisateur-creation.webp)

Les initiales sont enregistrées en majuscules. Elles servent à repérer la personne dans les
listes.

Le rôle se choisit dans une liste chargée depuis le serveur : elle présente tous les rôles
définis dans Tunnel (par exemple Administrateur, Responsable, Technicien, Acheteur), avec leur
libellé suivi du code. Un rôle ajouté côté serveur apparaît donc sans mise à jour de l'écran.
Le même choix sert au changement de rôle et au filtre du tableau.

## Modifier un compte

Cliquez sur le crayon de la ligne. Vous pouvez changer le prénom, le nom, le courriel et
les initiales. Le rôle et le mot de passe se changent par leurs propres boutons.

![Fenêtre Modifier l'utilisateur : prénom, nom, courriel et initiales](/captures/web-admin-utilisateur-modifier.webp)

## Changer le rôle

1. Cliquez sur le bouclier de la ligne.
2. Choisissez le nouveau rôle.
3. Cliquez sur **Confirmer**.

Cette action révoque toutes les sessions actives de la personne : elle devra se
reconnecter.

![Fenêtre Changer le rôle, liste des rôles ouverte : libellé suivi du code](/captures/web-admin-utilisateur-role-liste.webp)

## Désactiver ou réactiver un compte

Cliquez sur le bouton d'alimentation de la ligne, puis confirmez. Une personne désactivée
est déconnectée tout de suite. Réactiver le compte le rend de nouveau utilisable.

Désactiver est la façon normale de retirer l'accès à quelqu'un.

![Fenêtre Désactiver l'utilisateur](/captures/web-admin-utilisateur-desactiver.webp)

## Réinitialiser un mot de passe

1. Cliquez sur la clé de la ligne, puis sur **Réinitialiser**.
2. Tunnel génère un mot de passe temporaire. Il s'affiche **une seule fois**.
3. Cliquez sur **Copier**, puis transmettez-le à la personne.

![Fenêtre Réinitialiser le mot de passe, avant confirmation](/captures/web-admin-utilisateur-mot-de-passe.webp)

Fermez la fenêtre seulement après l'avoir copié : il n'est pas possible de le revoir.
Demandez ensuite à la personne de choisir son propre mot de passe.

## Le mot de passe de chacun

Chaque utilisateur change son mot de passe depuis son propre profil. Le nouveau mot de
passe doit avoir au moins 8 caractères, avec une majuscule et un chiffre.

![Mon profil, onglet Mot de passe](/captures/web-technicien-profil-mot-de-passe.webp)
