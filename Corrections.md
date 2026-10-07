# Corrections à faire — `index.html`

Liste de travail des anomalies et bizarreries. On décide d'abord, une par une, ce qu'il faut faire ;
les corrections seront ensuite faites **en un seul coup**, en se référant à ce fichier.

Légende : ✅ corrigé · 📝 décidé (à faire) · ❓ à décider

> **5 octobre 2026 — toutes les corrections décidées sont faites** (version 2 de l'application). Seuls les points « En suspens » restent ouverts.

La numérotation est celle de l'analyse du fichier (17 points).

---

## Déjà corrigées

- ✅ **#1 — Pointages négatifs** : les cases acceptent −5, −10, etc.
- ✅ **#2, #3, #4 — Comptage des 15** : déduit du total selon les règles ; question seulement si le total est possible avec ou sans le 15 ; au plus un 15 par joueur et par manche ; Nb 15 recalculé quand on corrige ou efface.
- ✅ **Planche confirmée** (5 octobre 2026) : le trou « 15 » vaut bien **+15** (la courte version à −15 était une erreur, annulée). Les pointages saisis entre-temps sont remis à jour automatiquement.
- ✅ **#7 — Supprimer un joueur** : le joueur est effacé **seulement de la liste des joueurs** (et donc des tirages). Son nom et toutes ses données sont **conservés partout ailleurs** (statistiques, anciennes parties). Il peut être réintégré.

---

## #6 — Plusieurs parties par jour, rien n'est effacé ✅

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

## #7 — Retouches ✅

- Enlever la mention **« (retiré) »** dans les statistiques : le nom s'affiche normalement.
- Enlever la section **« Joueurs retirés »** de la page des joueurs.
- Si on ajoute un joueur portant le nom d'un joueur effacé de la liste, il revient **automatiquement** avec toutes ses statistiques, sans question.

---

## #8 — Doublons de noms ✅

- Renommer un joueur avec le nom d'un autre joueur qui existe déjà est **refusé**, avec un message (même règle que pour l'ajout).

---

## Le Fantôme ✅

**Rôle** : le Fantôme sert à équilibrer les équipes quand le nombre de joueurs est impair. Les autres joueurs jouent un tour chacun à sa place.

**Décision**

- Le Fantôme est **toujours là** : il ne peut pas être supprimé ni retiré de la liste des joueurs. *(règle aussi le #11)*
- Il entre dans une équipe seulement quand le nombre de joueurs présents est impair.
- Il a **ses propres statistiques de Fantôme**, affichées comme celles des autres joueurs (aujourd'hui, il est exclu des statistiques : à changer).
- Le nom « Fantôme » est **réservé** : aucun joueur ne peut être ajouté ou renommé « Fantôme ». *(règle une partie du #8)*

---

## #10 — Validation des totaux ✅

- L'application calcule, pour chaque manche, **tous les totaux possibles** selon les règles (3 boules, un trou par boule, atout en double, Tout atout tout en double). La liste des totaux impossibles est dans `ReglesPetanqueAtout.md`.
- Chaque pointage saisi est vérifié. S'il est impossible : simple message **« Total erroné »**, le curseur reste sur la case pour corriger.
- Pas d'autre question ; la saisie n'est pas bloquée.

---

## #12 — Dossier `lib/` ✅

- Claude fournit les bibliothèques au moment des corrections et les dépose dans le dépôt, pour que l'application fonctionne sans Internet.

---

## #13 — Démarrage rapide ✅

- Le code et l'apparence (Babel et Tailwind) sont préparés **une seule fois**, au moment des corrections, au lieu d'être recalculés à chaque ouverture.
- Même apparence et même fonctionnement ; `lib/` ne contient plus que React (≈ 140 Ko au lieu de plus de 3 Mo).
- Si le code de `index.html` est modifié à la main plus tard, il faudra refaire cette préparation (demander à Claude).

---

## #14 — Tablette et téléphone ✅

- **Tablette** (appareil habituel) : tableau complet, adapté aux doigts — cases d'au moins 44 pixels de haut, chiffres d'au moins 16 pixels.
- **Téléphone** : **mode paysage obligatoire**.
  - Application installée sur Android : l'écran est verrouillé en paysage.
  - Ailleurs (navigateur, iPhone) : si le téléphone est à la verticale, un écran « Tournez votre téléphone » cache l'application jusqu'à ce qu'on le tourne.
  - La tablette n'est pas touchée par cette règle : elle fonctionne dans les deux sens.

---

## #15 — « Sauvegarder et quitter » : données sur GitHub ✅

- Le bouton « Quitter » devient **« Sauvegarder et quitter »** : il envoie toutes les données (joueurs, présences, parties, saisons) dans un fichier sur GitHub, puis affiche **« ✔ Sauvegardé sur GitHub »**.
- Les données vont dans un **dépôt privé séparé** (`PetanqueAtout-Data`, créé le 4 octobre 2026) : l'application reste dans le dépôt public, les noms et pointages restent privés.
- **Sans Internet** : l'envoi est mis en attente et se fait tout seul dès que l'appareil retrouve une connexion. Aucune question.
- Accès par un **jeton GitHub** limité à ce seul dépôt de données, saisi une fois par appareil (révocable en un clic si un appareil est perdu).
- ✅ **Plusieurs appareils** (ajouté le 5 octobre 2026) : tous enregistrent dans le même fichier ; chaque sauvegarde fusionne avec ce qui s'y trouve (rien n'est écrasé) et l'application récupère les parties des autres appareils à l'ouverture. Un ami utilise un jeton séparé créé par Patrice.
- Limite : une application web ne peut pas toujours fermer sa propre fenêtre ; après « Sauvegardé », on la ferme normalement si elle reste ouverte.

**Préparatifs à faire par Patrice (Claude guidera pas à pas)**

1. ✅ Créer le dépôt **privé** `PetanqueAtout-Data` sur GitHub.
2. ⬜ Créer un jeton GitHub limité à ce dépôt (droit « Contents : Read and write ») et le saisir dans l'application (⚙️ Sauvegarde GitHub).

---

## Application installable, hors ligne (PWA) ✅

- L'application devient installable sur tablette, téléphone et ordinateur, et fonctionne **entièrement sans Internet** une fois installée.
- Publication sur **GitHub Pages** (gratuit), à partir du dépôt public. Internet n'est nécessaire qu'une fois, pour l'installer ; les mises à jour se font toutes seules quand l'appareil est connecté.
- Les données restent enregistrées **sur l'appareil** (et sur GitHub avec le bouton « Sauvegarder et quitter »).

---

## #16 — Saisons ✅

- Une saison va habituellement d'**octobre à mai-juin** de l'année suivante.
- Bouton **« Nouvelle saison »** (page des statistiques) : la nouvelle saison commence à la date du jour. Pas de date fixe imposée.
- Nom automatique d'après la date de début : une saison commencée en octobre 2026 s'appelle **« Saison 2026-2027 »**.
- Chaque partie appartient à la saison en cours au moment où elle est jouée.
- Les statistiques (meneur, classements, meilleur par manche, fiche du joueur) portent sur **une saison à la fois**, choisie dans une liste ; par défaut, la saison en cours.
- Les **anciennes saisons restent consultables**.
- Données actuelles : toutes les parties déjà enregistrées forment la première saison.

---

## #18 — Équipes : tirage automatique ou manuel ✅

Demande du 7 octobre 2026 : pouvoir former les équipes **automatiquement** (tirage au hasard, comme aujourd'hui)
ou **manuellement**. **Automatique par défaut.** Décidé le 7 octobre 2026 :

- ✅ **A. Le choix** : sur la page des joueurs, au-dessus du bouton « ⚡ Générer les équipes », un sélecteur
  **[ Automatique | Manuel ]**.
- ✅ **B.** Il revient **toujours à « Automatique »** quand on revient sur la page.
- ✅ **C. En manuel** : les boutons **[ Éq. 1 ] [ Éq. 2 ]** de chaque joueur présent **apparaissent seulement après
  avoir choisi « Manuel »** (en automatique, on ne les voit pas). On place les joueurs, puis « ▶ Commencer la partie ».
- ✅ **D.** En passant à « Manuel », les joueurs sont **déjà placés par un tirage au hasard** ; on déplace seulement
  ceux qu'on veut changer.
- ✅ **E. Fantôme** : si le nombre de joueurs est impair, il est ajouté automatiquement à l'équipe qui a un joueur
  de moins (toujours en dernier). On ne peut commencer que si les deux équipes ont le même nombre de joueurs
  (Fantôme compris).

---

## #19 — Choisir 1, 2 ou 3 parties par séance ✅

Demande du 7 octobre 2026 : pouvoir choisir **1, 2 ou 3 parties** dans la même journée (aujourd'hui, une séance
compte toujours 2 parties, avec les mêmes équipes).

Décidé et fait le 7 octobre 2026 (« on verra à l'usage ») :

- ✅ **A. Où se fait le choix ?** Proposition : sur la page des joueurs, à côté du choix Automatique / Manuel,
  un sélecteur **Parties : [ 1 | 2 | 3 ]**.
- ✅ **B. Valeur de départ ?** Proposition : **2** (comme aujourd'hui) chaque fois qu'on arrive sur la page.
  Autre possibilité : reprendre le dernier choix fait.
- ✅ **C. Changer d'idée pendant la séance ?** Proposition : sur la feuille de pointage, un bouton
  « ➕ Ajouter une partie » (jusqu'à 3). Une partie prévue mais pas jouée ne compte pas, comme aujourd'hui (#9).
- ✅ **D. Mêmes équipes ?** Proposition : oui, les mêmes équipes pour toutes les parties de la séance (comme
  aujourd'hui). Pour changer d'équipes, on génère une nouvelle séance (#6).
- ✅ **E. Statistiques :** proposition — rien ne change dans les calculs (moyenne par partie, etc.) ; la 3e partie
  apparaît simplement partout où les parties 1 et 2 apparaissent. Les anciennes séances restent à 2 parties.

---

## #17 — Victoires d'équipe : aucun changement ✔️

Les victoires sont des victoires d'**équipe** (les équipes changent à chaque partie) ; les meilleurs joueurs se retrouvent déjà dans les statistiques individuelles. **On ne suit pas les victoires.**

---

## #9 — Parties incomplètes : aucun changement ✔️

Les parties incomplètes sont rares, et c'est habituellement la 2e partie qui n'est pas jouée du tout : tous les joueurs sont alors traités également.
L'application fait déjà ce qu'il faut : une partie dont aucune manche n'a été saisie ne compte pas dans les moyennes. **On garde le fonctionnement actuel.**

---

## Document du 25 septembre 2026 (`Pétanque Atout - modifications_20260925.doc`)

Comparaison avec l'application actuelle et les décisions ci-dessus.

**Déjà en place dans `index.html`** (à conserver pendant les corrections)

- Ligne « Total » par équipe dans la feuille de pointage, total de l'équipe qui mène en rouge et en gras ; pas de ligne de totaux inutile, ni dans la feuille ni dans les statistiques du jour.
- Fantôme toujours le dernier de son équipe.
- Fenêtre du 15 sensible à la touche Tab (Oui / Non).
- Déplacement du curseur : J1 Éq.1, J1 Éq.2, J2 Éq.1, J2 Éq.2… manche par manche, jusqu'au dernier joueur de l'équipe 2.
- Statistiques avancées : meilleur pointage brut et meilleur pointage par partie (ordre décroissant), meilleur de chaque manche en orange, présences / absences, totaux de chaque manche par partie, 15 par partie et cumulés, nombre de parties, détail groupé par date.
- En-têtes de colonnes sur une seule ligne, sans défilement horizontal (abréviations sur petit écran).

**Remplacé par des décisions plus récentes**

- *Boîte de dialogue « Annuler / Conserver / Générer de nouveau »* quand des équipes existent déjà pour la journée → remplacée par le **#6** : plusieurs parties par jour, sans question ; « Conserver » devient le bouton « ▶ Continuer la partie en cours ».
- *Fenêtre du 15 dès que le total de la manche atteint 15, Nb 15 + 1 à chaque « Oui »* → remplacée par le **comptage des 15 (#2 à #4)** : le 15 est déduit du total selon les règles, question seulement en cas de doute, au plus un 15 par joueur et par manche (il n'y a qu'un trou à 15).

**À surveiller pendant les corrections**

- **#6** : avec plusieurs parties dans une journée, la fiche du joueur reste **groupée par date** et montre chacune des parties de cette date.
- **#14** : les cases agrandies pour la tablette doivent continuer à tenir **sans défilement horizontal**, en-têtes sur une seule ligne.
- **#12** : l'application ne doit dépendre d'aucune connexion Internet.

---

## En suspens

- ⏸️ **#5 — « Importer des données » remplace tout sans confirmation** : un mauvais fichier efface toutes les données. *On y reviendra plus tard.*

