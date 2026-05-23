# Chasse au trésor à Montmartre 🗺️

Petite web app statique pour faire vivre une chasse au trésor à tes potes dans Montmartre.

- **Pas de backend, pas de build** — du HTML/CSS/JS vanilla
- **Une URL à partager** — chaque équipe ouvre la page sur son tél
- **Énigmes éditables** dans `etapes.json`
- **Réponses cachées en SHA-256** pour empêcher de tricher en ouvrant le code source

## Démarrage rapide

```bash
# Cloner puis servir localement
python3 -m http.server 8000
# Ouvrir http://localhost:8000/
```

Pour partager à tes potes&nbsp;: déploie sur **GitHub Pages** (cf. plus bas) et envoie-leur le lien.

## Le parcours par défaut

7 étapes, ~1 h 30 à pied, depuis le métro Abbesses jusqu'au Sacré-Cœur&nbsp;:

1. Métro Abbesses (départ)
2. Le Mur des Je t'aime
3. Le Bateau-Lavoir
4. Le Passe-Muraille
5. La Maison Rose / Place Dalida
6. Le Clos Montmartre
7. Le Sacré-Cœur (final&nbsp;: révélation de la cache du trésor)

Tu peux **remplacer entièrement le parcours** en éditant `etapes.json`.

## Personnaliser

### 1. Adapter les énigmes

Édite `etapes.json`. Chaque étape ressemble à&nbsp;:

```json
{
  "texte": "L'énigme à afficher.",
  "reponseHash": "hash sha256 de la réponse normalisée",
  "indices": ["1er indice", "2e indice"]
}
```

### 2. Générer un hash pour une nouvelle réponse

Ouvre `admin.html` dans ton navigateur (local), tape la réponse attendue → tu obtiens le hash à coller dans `etapes.json`.

La normalisation appliquée avant le hash est&nbsp;: `trim` → `lowercase` → suppression des accents. Donc `Sacré-Cœur`, `sacré-cœur` et `SACRE-COEUR` donnent tous le même hash.

### 3. Indiquer où est le trésor

Édite la clé `final.message` dans `etapes.json` pour décrire où ton équipe a planqué le trésor (genre&nbsp;: « sous le 3ᵉ banc à droite du parvis »).

### 4. Repérage avant le jour J

Les énigmes proposées s'appuient sur des détails observables sur place (un nombre sur une plaque, un nom gravé). Fais le parcours une fois en repérage pour&nbsp;:
- vérifier que chaque détail-réponse est toujours là
- ajuster une réponse si une plaque a bougé / disparu
- chronométrer pour estimer la durée

## Déployer sur GitHub Pages

1. Push sur `main` (ou la branche de ton choix)
2. Repo → **Settings → Pages**
3. **Source**&nbsp;: branche `main`, dossier `/ (root)`
4. Attends 1-2 min → URL `https://<ton-user>.github.io/chasse-aux-tresors/`
5. Partage le lien à tes potes (un par équipe)

Le fichier `.nojekyll` est déjà là pour éviter tout traitement Jekyll côté Pages.

## Côté gameplay

- **Chaque tél = une équipe.** L'état (nom, étape, indices, chrono) est stocké en `localStorage` du navigateur.
- **Indices** : 2 par énigme, à demander à la demande. Le compteur reste visible. C'est le tie-breaker honorifique en fin de partie.
- **Recommencer** : un lien sur l'écran d'étape (et le bouton « Recommencer » sur l'écran final) repart de zéro.
- **Plusieurs équipes sur le même tél**&nbsp;: pas supporté tel quel (un seul état stocké). Utilise des navigateurs différents (Safari + Chrome) ou la navigation privée si vraiment nécessaire.

## Limites assumées

- Si un pote ouvre les DevTools et compare le hash de sa saisie à ceux du JSON, il peut deviner par brute-force sur des réponses courtes. Acceptable pour des potes&nbsp;; pas une forteresse.
- Pas de classement multi-équipes en temps réel. Vous comparez les temps oralement à la fin&nbsp;: pour 2-3 équipes c'est largement suffisant.
- Pas de géolocalisation&nbsp;: l'app fait confiance à l'équipe pour aller au bon endroit. La validation se fait via un détail observable sur place.

## Structure

```
.
├── index.html      # Coquille HTML (3 écrans : accueil, étape, final)
├── style.css       # Styling mobile-first
├── app.js          # Machine à états, hash, persistence
├── etapes.json     # Contenu éditable (lieux, énigmes, final)
├── admin.html      # Utilitaire de génération de hash
├── .nojekyll       # GitHub Pages
└── README.md
```
