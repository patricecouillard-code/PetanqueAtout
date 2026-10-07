# Pétanque Atout — notes pour Claude

Application web installable (PWA) pour le **pointage de la Pétanque Atout**, un jeu inventé par Patrice
(boules de pétanque lancées dans une planche à trous, manches nommées comme les couleurs de cartes).
Utilisée surtout sur **tablette**, parfois sur téléphone (en paysage), par Patrice et un ami.

## Façon de travailler (important)

- **Toujours répondre en français**, simplement : Patrice n'est pas programmeur.
- Les anomalies et changements se **décident d'abord un par un** dans `Corrections.md`
  (légende ✅ fait · 📝 décidé · ❓ à décider), puis se corrigent **en un seul coup**.
- Dans l'application : **pas de questions de confirmation**. On utilise plutôt un message
  « … — Annuler » pendant quelques secondes.
- **Ne jamais demander ni accepter le jeton GitHub** dans la conversation : Patrice le colle lui-même
  dans l'application (⚙️ Sauvegarde GitHub).
- Ne rien supprimer des données des joueurs sans décision explicite.

## Fichiers de référence (à lire avant de travailler)

- `ReglesPetanqueAtout.md` — règles du jeu. Planche : 2 trous ♠ 4, ♣ 6, ♦ 8, ♥ 10, **1 trou à +15**,
  2 trous à −5. Atout de la manche en double ; Tout atout : tout en double. 3 boules, une boule par trou,
  boule ratée = 0. (Le trou est bien **+15** : une version à −15 a été annulée le 5 octobre 2026.)
- `TotauxPossibles.md` — tous les totaux possibles par manche (généré par script, ne pas éditer à la main).
- `Corrections.md` — toutes les décisions et leur état.
- `idées.md` — idées pour plus tard.
- `README.md` — installation, sauvegarde GitHub, accès pour un ami, préparation.
- `Pétanque Atout - modifications_20260925.doc` — demandes d'origine de Patrice (déjà comparées).

## Code et préparation

- Source : `src/app.jsx` (React 18, un seul fichier), `src/styles.css` (Tailwind 3), `src/index.html`, `src/sw.js`.
- **Ne pas modifier à la main** : `index.html`, `app.js`, `app.css`, `sw.js`, `lib/` — produits par `build.mjs`.
- Préparer : `npm install` (une fois) puis `npm run build`. Toujours rebâtir et committer les fichiers produits.
- **Sauvegarde intouchable** : branche `sauvegarde-version-2-2026-10-07` = version 2 telle que publiée le 7 octobre 2026,
  avant le #18. Patrice a demandé qu'elle ne soit **jamais remplacée** : ne jamais y pousser ni la supprimer.
- Branche : **`Main`** (avec majuscule). Publication automatique sur GitHub Pages à chaque push :
  https://patricecouillard-code.github.io/PetanqueAtout/ (fichier `.nojekyll` : publié tel quel).
- Tester dans Chromium avec Playwright (serveur local `python3 -m http.server`), y compris téléphone en
  paysage avec clavier ouvert (petite hauteur d'écran).

## Données

- Sur l'appareil : `localStorage` (`carteAppData`). Réglages GitHub : `petanqueGitHub`,
  `petanqueGitHubEnAttente`, `petanqueGitHubDerniere`.
- Sauvegarde : dépôt **privé** `patricecouillard-code/PetanqueAtout-Data`, fichier `petanque-atout.json`,
  par l'API contents de GitHub. Chaque envoi **fusionne** avec le fichier existant (`mergeData`) : joueurs
  dédoublonnés par nom, parties par `modifie` le plus récent, parties supprimées dans `supprimees`.
- Toute modification du format des données doit passer par la migration (`migrateScores`) pour que les
  anciennes données restent valides.

## En attente (rien à faire sans l'accord de Patrice)

- **#5** — « Importer des données » remplace tout sans confirmation : en suspens.
- Bouton **« Recommencer à zéro »** (effacer parties, présences, saisons ; la sauvegarde GitHub doit suivre) :
  proposé, Patrice a dit « on ne fait rien pour l'instant ». Question ouverte : garder ou non les joueurs.
- Côté Patrice : son jeton GitHub (`PetanqueAtout-Patrice`) est créé et le test de connexion réussit (7 octobre 2026) ;
  première sauvegarde à confirmer. Jeton de l'ami pas encore créé. Navigateur de Patrice : DuckDuckGo (menu ☰ en bas à droite).
