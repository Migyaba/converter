# HTML → Elementor

Convertisseur Node.js qui transforme une page HTML en **modèle Elementor** importable.

Entrée : un fichier `.html` (CSS inline / `<style>`, images en base64, structure libre).  
Sortie : un JSON au format template Elementor (`containers` flex/grid + widgets classiques), avec styles et images extraites.

---

## Fonctionnalités

- Mapping HTML → widgets Elementor : `heading`, `text-editor`, `image`, `button`, `icon-list`, `container`
- Transposition CSS → contrôles Elementor (typo, couleurs, padding/margin, flex, grid, bordures…)
- Breakpoints responsive (`tablet` / `mobile`) à partir des `@media (max-width: …)`
- Extraction des images `data:` URI vers de vrais fichiers
- Validation des contrôles contre une knowledge base Elementor embarquée
- **UI web** : upload → téléchargement d’un `.zip`
- **CLI** pour scripts et CI

---

## Prérequis

- [Node.js](https://nodejs.org/) **18+**
- WordPress + Elementor avec **Flexbox Container** activé (pour l’import)

---

## Installation

```bash
git clone <url-du-repo>.git
cd converter   # si le dépôt est le monorepo parent
npm install
```

---

## Démarrage rapide (UI)

```bash
npm start
```

Ouvrir **http://127.0.0.1:4599**

1. Déposer un fichier HTML  
2. (Optionnel) indiquer l’URL publique où seront hébergées les images  
3. Convertir → télécharger le `.zip`

Le zip contient :

| Fichier | Contenu |
|---------|---------|
| `*.elementor.json` | Modèle à importer dans Elementor |
| `*.style-report.json` | Diagnostic (valeurs rejetées, trous) |
| `assets/` | Images extraites |
| `README.txt` | Rappel d’import |

Scripts équivalents : `npm run serve`, `npm run dev`.

---

## Ligne de commande

```bash
# Sortie à côté du HTML source
npm run convert -- page.html

# Fichier de sortie explicite
npm run convert -- page.html out.elementor.json

# Réécrire les URLs d’images vers un dossier public
npm run convert -- page.html out.elementor.json \
  --assets-base=https://exemple.com/wp-content/uploads/page
```

Sans `--assets-base`, les images restent en base64 dans le JSON. Elementor les remplace souvent par un placeholder à l’import : hébergez `assets/`, puis reconvertissez avec l’URL publique.

Binaire disponible après install locale :

```bash
npx html-to-elementor page.html
```

---

## Import dans WordPress

1. Elementor → activer **Flexbox Container**
2. **Modèles → Modèles enregistrés → Importer des modèles** → choisir le `.elementor.json`
3. Insérer le modèle dans une page
4. Si des images ont été extraites : uploader le dossier `assets/` à l’URL utilisée (`--assets-base` ou champ de l’UI)
5. Polices Google : Elementor → Réglages → activer Google Fonts, puis **Outils → Régénérer le CSS & les données**

---

## Configuration serveur

Variables d’environnement (voir `.env.example`) :

| Variable | Défaut | Description |
|----------|--------|-------------|
| `PORT` | `4599` | Port HTTP |
| `HOST` | `127.0.0.1` | Interface d’écoute |
| `MAX_BODY_MB` | `200` | Taille max du HTML uploadé |

```bash
# Local
npm start

# Derrière Nginx / Caddy
HOST=0.0.0.0 PORT=4599 npm start
```

Healthcheck : `GET /health` → `{ "ok": true }`

> Le serveur **n’authentifie pas** les requêtes. Ne pas l’exposer directement sur Internet sans reverse-proxy, HTTPS et contrôle d’accès.

---

## API

`POST /convert?name=<slug>&base=<url-images-optionnelle>`

- Corps : HTML brut (`text/html` ou `text/plain`)
- Réponse : archive ZIP (`application/zip`)
- Stats : en-tête `X-Convert-Stats` (JSON)

---

## Structure du projet

```
converter/
├── data/                 # Knowledge base widgets / controls Elementor
├── src/
│   ├── cli.js            # CLI
│   ├── server.js         # UI + API
│   ├── convert.js        # Pipeline principal
│   ├── mapper.js         # HTML → arbre Elementor
│   ├── style-map.js      # CSS → contrôles
│   ├── validate.js       # Validation KB
│   ├── assets.js         # Extraction images base64
│   ├── zip.js            # Écriture ZIP (sans dépendance)
│   ├── fallback.js       # Extension cas ambigus (inerte par défaut)
│   └── css/              # Parseur CSS, cascade, breakpoints
├── validation/           # Harness WP Playground (optionnel)
├── .env.example
└── package.json
```

---

## Limites connues

- Widgets classiques uniquement (pas les atomic widgets Elementor)
- Pas d’héritage CSS à l’intérieur des breakpoints
- Gradients complexes, `box-shadow`, `transform` : couverture partielle
- Formulaires / galeries natives Elementor non mappés (souvent remplacés par containers + images)
- Les sélecteurs avec pseudo-classes d’état (`:hover`, `::before`) sont ignorés

---

## Licence

Projet privé (`"private": true` dans `package.json`).
