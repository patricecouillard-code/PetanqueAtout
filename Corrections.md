# Corrections à faire — `index.html`

Liste de travail des anomalies et bizarreries. On décide d'abord, une par une, ce qu'il faut faire ;
les corrections seront ensuite faites **en un seul coup**, en se référant à ce fichier.

Légende : ✅ corrigé · 📝 décidé (à faire) · ❓ à décider

La numérotation est celle de l'analyse du fichier (17 points).

---

## Déjà corrigées

- ✅ **#1 — Pointages négatifs** : les cases acceptent −5, −10, etc.
- ✅ **#2, #3, #4 — Comptage des 15** : déduit du total selon les règles ; question seulement si le total est possible avec ou sans le 15 ; au plus un 15 par joueur et par manche ; Nb 15 recalculé quand on corrige ou efface.
- ✅ **#7 — Supprimer un joueur** : le joueur est *retiré* (quitte la liste et les tirages) mais garde toutes ses données ; il peut être réintégré.

---

## #6 — Plusieurs parties par jour, rien n'est effacé 📝

**Décision**

- On peut jouer **plusieurs parties dans une même journée**.
- **Générer les équipes crée toujours une nouvelle partie.** Les parties déjà faites, terminées ou non, ne sont **jamais effacées**.
- Refaire les équipes = simplement générer de nouvelles équipes pour une nouvelle partie.
- **Aucune question** à l'utilisateur dans le déroulement normal.

**Comment (proposition)**

- Une « partie » au sens de l'application = un tirage d'équipes avec sa feuille (Partie 1 et Partie 2). On note la date **et l'heure** de création.
- Une partie est **terminée** quand toutes les cases des deux feuilles sont remplies ; sinon elle est **en cours**.
- **Partie en cours — continuer ou pas ?**
  - À l'accueil, si une partie est en cours : un gros bouton **« ▶ Continuer la partie en cours »** (avec l'heure et les équipes), au-dessus de « Nouvelle partie ».
  - Si on choisit plutôt « Nouvelle partie », l'ancienne reste telle quelle (en cours) : on pourra y revenir plus tard. Aucune question.
- **Liste des parties** : une page qui montre les parties (date, heure, équipes, total de chaque équipe, terminée / en cours). Toucher une partie l'ouvre pour la consulter ou la continuer.
- **Effacer ou recommencer une partie** (cas exceptionnels) : boutons dans la feuille de pointage.
  - « Recommencer » vide les pointages et garde les équipes ; « Supprimer » enlève la partie.
  - Pas de question : un message **« Partie supprimée — Annuler »** apparaît quelques secondes, ce qui permet de revenir en arrière en cas d'erreur.

---

## À décider

- ❓ **#5 — « Importer des données » remplace tout sans confirmation** : un mauvais fichier efface toutes les données.
- ❓ **#8 — Un joueur peut devenir Fantôme par accident** : en s'appelant « Fantôme » ; le renommage ne vérifie pas non plus les doublons.
- ❓ **#9 — Moyennes faussées par les parties incomplètes** : une partie compte comme « jouée » dès qu'une seule manche est saisie.
- ❓ **#10 — Aucune vérification des limites** : rien n'empêche un 60 en Cœur (maximum 55), ni un total impossible.
- ❓ **#11 — Le Fantôme peut être supprimé** pendant qu'il fait partie d'une équipe.
- ❓ **#12 — Le dossier `lib/` manque** dans le dépôt : la page reste blanche sans lui.
- ❓ **#13 — Démarrage lent sur téléphone** : Babel compile le code à chaque ouverture.
- ❓ **#14 — Cases petites sur téléphone** : le texte descend à 11 pixels sur écran étroit.
- ❓ **#15 — Le bouton « Quitter »** ne fonctionne pas dans la plupart des navigateurs.
- ❓ **#16 — Pas de notion de saison** : les statistiques s'accumulent depuis le début.
- ❓ **#17 — Le vainqueur de chaque partie** n'est enregistré nulle part.
