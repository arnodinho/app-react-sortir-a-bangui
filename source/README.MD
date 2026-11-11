# Sortir à bangui - React native 
# Support Issue
- https://github.com/passionui/support/issues
- https://codecanyon.net/user/passionui

# Facebook

- https://www.facebook.com/passionui/

# Youtube

- https://www.youtube.com/channel/UCt_7rXE3zgj_a_UbGCFUz6Q

watchman watch-del '/Users/arnaudyanga-esso/Projects/listar-pro-wordpress/source' ; watchman watch-project '/Users/arnaudyanga-esso/Projects/listar-pro-wordpress/source'

===================================================================================================

Lorsque vos utilisateurs vont télécharger l'application sur les stores, leurs devices ne vont pas se connecter à votre serveur Node.JS. Déjà, parce que c'est impossible et ensuite, parce que vous n'allez pas faire tourner un serveur Node.JS éternellement sur votre machine. :D La solution est de générer nous-mêmes le fichier bundle Javascript et de l'intégrer dans le projet mobile natif. Ainsi, votre application, une fois sur le device de l'utilisateur, n'aura qu'à exécuter le fichier bundle Javascript qu'elle contient et à afficher le rendu à l'écran.

Pour générer un bundle, il faut exécuter la commande suivante, à la racine du projet

react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

