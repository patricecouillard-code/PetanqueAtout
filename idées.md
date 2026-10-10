# Idées pour l'application Pétanque Atout

## À faire

> **7 octobre 2026** — Patrice aime toutes les idées de cette section (y compris les deux nouvelles ci-dessous),
> mais **on ne les applique pas tout de suite**. Les passer dans `Corrections.md` seulement quand il le demande.

### Équipes équilibrées (proposée le 7 octobre 2026)
Une troisième façon de former les équipes, à côté de « Automatique » et « Manuel » (#18) : l'application répartit
les joueurs présents selon leurs moyennes de la saison, pour que les deux équipes soient de force égale.

### Changer les coéquipiers (proposée le 7 octobre 2026)
Quand on joue plusieurs parties dans la même journée, le tirage automatique évite de remettre ensemble les mêmes
coéquipiers que dans la partie précédente.

### Cacher un joueur des statistiques (proposée le 10 octobre 2026)
Sur un joueur effacé de la liste, un bouton « Cacher aussi des statistiques » (avec « … — Annuler ») : il disparaît
des statistiques, mais ses pointages restent dans les anciennes parties. On peut le faire revenir.

### Supprimer les parties d'essai (proposée le 10 octobre 2026)
Pouvoir supprimer d'un coup les parties d'essai (par exemple celles jouées par des joueurs d'essai).

### Saisie des points en touchant les trous
Au lieu de taper le total d'un joueur, on touche les trous où ses boules sont tombées (par exemple ♥, ♣, −5), avec un bouton « à côté » pour une boule ratée.
- L'application calcule le total selon la manche (atout en double, Tout atout tout en double).
- Les « 15 » sont comptés automatiquement : plus besoin de la question « Y a-t-il eu un 15 ? ».
- Les règles se vérifient d'elles-mêmes : un trou par boule, 3 boules au maximum.
- Garder aussi la saisie directe d'un total, pour corriger rapidement.

### Saisie joueur par joueur (téléphone)
Sur petit écran, afficher seulement le joueur dont c'est le tour, avec une grande case, puis passer automatiquement au suivant dans l'ordre de jeu. Le tableau complet reste accessible pour consulter et corriger. Irait bien avec la saisie en touchant les trous.

### Classement « tous les temps »
Un classement qui additionne toutes les saisons. Pas prioritaire : idée conservée pour plus tard.

### Nombres négatifs ✅ fait
Il faut **absolument** pouvoir saisir un pointage négatif.

### Vérification des pointages ✅ fait
Refuser ou signaler un pointage impossible pour la manche (voir les minimums et maximums dans `ReglesPetanqueAtout.md`). Par exemple, 60 dans la manche Cœur est une faute de frappe.

### Application installable (PWA) ✅ fait
- Installable sur téléphone et ordinateur.
- Fonctionne sans connexion Internet.
- Le bouton « Quitter » fonctionnera mieux une fois l'application installée.

### Enregistrement dans un fichier (File System Access API)
- Sur ordinateur (Chrome, Edge) : les données sont enregistrées directement et automatiquement dans un fichier choisi, au lieu d'exporter et d'importer du JSON à la main.
- Sur téléphone, cette API n'existe pas : on garde l'export et l'import d'un fichier.

### Plusieurs utilisateurs ✅ fait
Chaque appareil enregistre dans le même fichier du dépôt privé `PetanqueAtout-Data` ; les données sont fusionnées à chaque sauvegarde et récupérées à l'ouverture (voir README).

## Problèmes trouvés dans l'application actuelle (`index.html`)

Voir **`Corrections.md`** : liste complète, décisions et état de chaque correction.

## Comptage des 15 (en place)

L'application déduit le 15 du total de la manche, d'après les règles :
- total **impossible sans le 15** (ex. 21 en Pique) → 15 compté automatiquement ;
- total **impossible avec le 15** (ex. 40 en Cœur) → pas de 15, pas de question ;
- total **possible dans les deux cas** (ex. 5 = 15 − 5 − 5) → l'application demande.

Un joueur fait au plus un 15 par manche ; corriger ou effacer un pointage met le Nb 15 à jour.
La saisie en touchant les trous (plus haut) supprimerait complètement la question.

## À lire

- `Pétanque Atout - modifications_20260925.doc` : lu et comparé ; voir la section correspondante dans `Corrections.md`.
