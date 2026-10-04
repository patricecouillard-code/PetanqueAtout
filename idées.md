# Idées pour l'application Pétanque Atout

## À faire

### Saisie des points en touchant les trous
Au lieu de taper le total d'un joueur, on touche les trous où ses boules sont tombées (par exemple ♥, ♣, −5), avec un bouton « à côté » pour une boule ratée.
- L'application calcule le total selon la manche (atout en double, Tout atout tout en double).
- Les « 15 » sont comptés automatiquement : plus besoin de la question « Y a-t-il eu un 15 ? ».
- Les règles se vérifient d'elles-mêmes : un trou par boule, 3 boules au maximum.
- Garder aussi la saisie directe d'un total, pour corriger rapidement.

### Nombres négatifs ✅ fait
Il faut **absolument** pouvoir saisir un pointage négatif.

### Vérification des pointages
Refuser ou signaler un pointage impossible pour la manche (voir les minimums et maximums dans `ReglesPetanqueAtout.md`). Par exemple, 60 dans la manche Cœur est une faute de frappe.

### Application installable (PWA)
- Installable sur téléphone et ordinateur.
- Fonctionne sans connexion Internet.
- Le bouton « Quitter » fonctionnera mieux une fois l'application installée.

### Enregistrement dans un fichier (File System Access API)
- Sur ordinateur (Chrome, Edge) : les données sont enregistrées directement et automatiquement dans un fichier choisi, au lieu d'exporter et d'importer du JSON à la main.
- Sur téléphone, cette API n'existe pas : on garde l'export et l'import d'un fichier.

### Plusieurs utilisateurs (plus tard)
Deux autres personnes pourraient utiliser l'application plus tard. À prévoir : un moyen de partager les données (par fichier au début, peut-être par un serveur de synchronisation ensuite).

## Problèmes trouvés dans l'application actuelle (`index.html`)

1. **Le dossier `lib/` manque dans le dépôt** (tailwind, react, react-dom, babel) : sans lui, la page reste blanche.
2. ✅ **Corrigé** — **Les pointages négatifs sont impossibles** : ils sont ramenés à 0.
3. ✅ **Corrigé** — **Le compteur « Nb 15 » peut se tromper** : si on modifie une case déjà validée à 15 ou plus, la question revient et le compteur peut augmenter deux fois. Si on efface la case, le compteur et le surlignage ne reculent pas.
4. ✅ **Corrigé** — **La question du 15 se trompe** : elle apparaît dès qu'une manche donne 15 points ou plus, même sans boule dans le trou à 15 (par exemple deux ♥ dans la manche Cœur = 40). La saisie en touchant les trous règle ce problème.
5. **Supprimer un joueur efface son historique** dans les statistiques des anciennes séances (il y apparaît comme « ? »).
6. **Le bouton « Quitter » ne fonctionne pas** dans la plupart des navigateurs.
7. **Il n'y a pas de notion de saison** : les statistiques regroupent toutes les données depuis le début, sans moyen de commencer une nouvelle saison.
8. **Démarrage lent sur téléphone** : Babel compile le code dans le navigateur à chaque ouverture.

## Comptage des 15 (en place)

L'application déduit le 15 du total de la manche, d'après les règles :
- total **impossible sans le 15** (ex. 21 en Pique) → 15 compté automatiquement ;
- total **impossible avec le 15** (ex. 40 en Cœur) → pas de 15, pas de question ;
- total **possible dans les deux cas** (ex. 5 = 15 − 5 − 5) → l'application demande.

Un joueur fait au plus un 15 par manche ; corriger ou effacer un pointage met le Nb 15 à jour.
La saisie en touchant les trous (plus haut) supprimerait complètement la question.

## À lire

- `Pétanque Atout - modifications_20260925.doc` : modifications demandées le 25 septembre 2026, pas encore analysées.
