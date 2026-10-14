# NoanOS — Portfolio de Noan Heinry

Portfolio en ligne au style « système d'exploitation » : **https://noanheinry.github.io/**

> Le dépôt s'appelle `NoanHeinry.github.io` : GitHub Pages publie donc le site directement à la racine de `noanheinry.github.io`.

## Contenu

| Fichier | Rôle |
| --- | --- |
| `index.html` | Version française du portfolio |
| `index_en.html` | Version anglaise |
| `style.css` | Styles communs aux deux versions du portfolio |
| `script.js` | Fenêtres, horloge, recherche (`Ctrl + K`), liens internes, compétences cliquables, dépôts GitHub du widget, changement de langue |
| `life.js` | Jeu de la vie jouable (fenêtre « game_of_life.exe ») |
| `terminal.js` | Fenêtre Terminal et ses commandes (`help`, `whoami`, `neofetch`, `cv`…) |
| `404.html` | Page d'erreur au style NoanOS, servie par GitHub Pages pour toute adresse inconnue |
| `documents/` | CV et présentations de projets (PDF) |
| `images/` | Photos, captures de projets et images d'aperçu pour le partage (`og-image.jpg`, `og-image-en.jpg`) |

## Astuces

- `Ctrl + K` (ou `⌘ + K`) : rechercher une compétence, un projet ou une section.
- `Échap` : fermer la fenêtre ouverte.
- Les fenêtres se déplacent par leur barre de titre ; double-clic pour agrandir, boutons pour réduire ou agrandir.
- Bouton **Start** : profil, toutes les sections, CV, contact et changement de langue.
- Fenêtre **Résumé** (ou bouton « Recruteur pressé ? ») : l'essentiel du profil en 30 secondes.
- Fenêtre **Terminal** : taper `help` pour la liste des commandes ; flèches haut et bas pour l'historique, `Tab` pour compléter.
- Compétences : un clic sur une technologie affiche les projets où elle a servi.
- BUT Info : chaque apprentissage critique renvoie vers ses preuves (projets, stage, documents).
- Le widget de l'accueil affiche les derniers dépôts GitHub via l'API publique (mis en cache 30 minutes dans la session).
- La séquence de démarrage n'apparaît qu'une fois par session (désactivée si l'utilisateur préfère réduire les animations).
- Lien direct vers une fenêtre : ajouter son identifiant après `#`, par exemple `index.html#projects`
  (`summary`, `about`, `projects`, `life`, `stage`, `skills`, `but-info`, `contact`, `terminal`).

## Développement

Site statique, sans dépendance ni étape de build : ouvrir `index.html` dans un navigateur suffit.
Toute modification poussée sur la branche `main` est publiée automatiquement par GitHub Pages.
