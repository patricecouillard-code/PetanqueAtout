# Règles de la Pétanque Atout

La Pétanque Atout combine trois jeux : les **boules de pétanque** (on lance des boules), une **planche à trous** comme au jeu de poches, et les **cartes** (seulement pour les noms des manches : aucune carte n'est utilisée).

## La planche

| Trou | Nombre de trous | Valeur |
|---|---|---|
| ♠ Pique | 2 | 4 points |
| ♣ Trèfle | 2 | 6 points |
| ♦ Carreau | 2 | 8 points |
| ♥ Cœur | 2 | 10 points |
| 15 | 1 | 15 points |
| −5 | 2 | −5 points |

## Les équipes

- Les joueurs présents sont répartis en **2 équipes**.
- Si le nombre de joueurs est impair, un joueur **Fantôme** complète une équipe. Ses points comptent dans le total de son équipe.

## Une partie

Une partie compte **5 manches**, dans cet ordre :

1. ♠ Pique
2. ♣ Trèfle
3. ♦ Carreau
4. ♥ Cœur
5. ✦ Tout atout

La partie se termine quand tous les joueurs ont joué la manche Tout atout.

## Une manche

> **Règle essentielle : tous les trous comptent, peu importe la manche.** La manche ne fait que doubler la valeur des trous de sa couleur (et tout doubler au Tout atout).

- Chaque joueur lance **3 boules**.
- **Tous les trous comptent**, dans toutes les manches.
- **L'atout** : les trous de la couleur de la manche valent **le double**. Dans la manche Pique, par exemple, un trou ♠ vaut 8 points au lieu de 4. Les autres trous gardent leur valeur normale.
- **Tout atout** (5e manche) : **tout vaut le double**, même le 15 et les −5.
- Une boule qui ne tombe dans aucun trou vaut **0**.
- Une boule tombée dans un trou y reste jusqu'à la fin du tour du joueur (ses 3 boules) : **un trou ne peut recevoir qu'une seule boule par tour**.
- Le pointage d'un joueur peut être **négatif**.

### Ordre de jeu

Joueur 1 de l'équipe 1, joueur 1 de l'équipe 2, joueur 2 de l'équipe 1, joueur 2 de l'équipe 2, et ainsi de suite. Le pointage de chaque joueur est inscrit dès qu'il a lancé ses 3 boules. Quand tous les joueurs ont joué, on passe à la manche suivante.

### Valeur des trous selon la manche

| Manche | ♠ | ♣ | ♦ | ♥ | 15 | −5 |
|---|---|---|---|---|---|---|
| ♠ Pique | **8** | 6 | 8 | 10 | 15 | −5 |
| ♣ Trèfle | 4 | **12** | 8 | 10 | 15 | −5 |
| ♦ Carreau | 4 | 6 | **16** | 10 | 15 | −5 |
| ♥ Cœur | 4 | 6 | 8 | **20** | 15 | −5 |
| ✦ Tout atout | **8** | **12** | **16** | **20** | **30** | **−10** |

### Exemples

- Manche ♥, boules dans ♥, ♣ et −5 : 20 + 6 − 5 = **21**
- Manche ♠, boules dans 15, ♥ et ♥ : 15 + 10 + 10 = **35**
- Tout atout, boules dans 15, ♦ et −5 : 30 + 16 − 10 = **36**

### Pointages possibles pour un joueur

| Manche | Minimum | Maximum |
|---|---|---|
| ♠ Pique | −10 | 35 (15 + ♥ + ♥) |
| ♣ Trèfle | −10 | 39 (♣ + ♣ + 15) |
| ♦ Carreau | −10 | 47 (♦ + ♦ + 15) |
| ♥ Cœur | −10 | 55 (♥ + ♥ + 15) |
| ✦ Tout atout | −20 | 70 (15 + ♥ + ♥) |

## À confirmer

Ces points viennent de l'application actuelle (`index.html`) et n'ont pas encore été confirmés :

- Une séance (une journée) compte **2 parties**, avec les mêmes équipes.
- L'équipe gagnante d'une partie est celle qui a le plus haut total.
- Le classement de la saison compare les joueurs un par un (total des points, moyenne par partie, meilleur par manche, nombre de 15).
