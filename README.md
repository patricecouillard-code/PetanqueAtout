# Pétanque Atout — Pointage

Application de pointage des parties de **Pétanque Atout** et de statistiques des joueurs.
Elle s'installe sur une tablette, un téléphone ou un ordinateur et fonctionne **sans Internet**.

- Règles du jeu : [`ReglesPetanqueAtout.md`](ReglesPetanqueAtout.md)
- Corrections faites et en suspens : [`Corrections.md`](Corrections.md)
- Idées pour plus tard : [`idées.md`](idées.md)

## Utiliser l'application

### Mise en ligne (une seule fois)

Sur github.com, dans ce dépôt : **Settings → Pages → Build and deployment**,
*Source* : **Deploy from a branch**, branche **Main**, dossier **/ (root)**, puis **Save**.
Après une ou deux minutes, GitHub affiche l'adresse de l'application
(`https://patricecouillard-code.github.io/PetanqueAtout/`).

### Installation sur la tablette ou le téléphone

Ouvrir l'adresse une fois avec Internet, puis :
- **Android (Chrome)** : menu ⋮ → **Installer l'application** (ou « Ajouter à l'écran d'accueil ») ;
- **iPad / iPhone (Safari)** : bouton Partager → **Sur l'écran d'accueil**.

Ensuite l'application s'ouvre depuis son icône, même en mode avion. Les mises à jour arrivent
toutes seules quand l'appareil est connecté (elles s'appliquent à l'ouverture suivante).

Sur un ordinateur, on peut aussi simplement ouvrir `index.html` (avec le dossier `lib/` à côté).

### Sauvegarde sur GitHub

Les données sont enregistrées sur l'appareil. **💾 Sauvegarder et quitter** les envoie aussi dans le
dépôt privé `PetanqueAtout-Data` (fichier `petanque-atout.json`). Sans Internet, l'envoi attend et
se fait à la prochaine ouverture de l'application avec Internet.

Préparation, une fois par appareil : créer un jeton sur github.com (photo → Settings → Developer settings →
Personal access tokens → **Fine-grained tokens** → *Generate new token*), limité au dépôt
**PetanqueAtout-Data**, avec **Contents : Read and write**. Le coller dans l'application :
**⚙️ Sauvegarde GitHub** (en bas de l'accueil) → *Tester la connexion*.

## Modifier l'application

Le code source est dans `src/` (`src/app.jsx` pour l'application). Les fichiers `index.html`, `app.js`,
`app.css`, `sw.js` et `lib/` sont **produits automatiquement** : ne pas les modifier à la main.

```sh
npm install      # une seule fois
npm run build    # prépare l'application après chaque modification de src/
```
