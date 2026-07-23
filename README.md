# HTML → Elementor

Mini-SaaS Node.js qui transforme une page HTML en **modèle Elementor** importable.

Entrée : un fichier `.html` (CSS inline / `<style>`, images en base64, structure libre).  
Sortie : un JSON au format template Elementor (`containers` flex/grid + widgets classiques), avec styles et images extraites.

Comptes utilisateurs, quotas mensuels, historique des conversions et **espace admin**.

---

## Fonctionnalités

- Mapping HTML → widgets Elementor : `heading`, `text-editor`, `image`, `button`, `icon-list`, `container`
- Transposition CSS → contrôles Elementor (typo, couleurs, padding/margin, flex, grid, bordures…)
- Breakpoints responsive (`tablet` / `mobile`) à partir des `@media (max-width: …)`
- Extraction des images `data:` URI vers de vrais fichiers
- Validation des contrôles contre une knowledge base Elementor embarquée
- **Auth** : inscription, connexion, sessions cookie HttpOnly
- **Quotas** mensuels par compte
- **Admin** : utilisateurs, activation, rôles, quotas, stats
- **CLI** pour scripts et CI (sans auth)

---

## Prérequis

- [Node.js](https://nodejs.org/) **22+** (SQLite natif `node:sqlite`)
- WordPress + Elementor avec **Flexbox Container** activé (pour l’import)

---

## Installation

```bash
git clone <url-du-repo>.git
cd converter
npm install
cp .env.example .env   # optionnel : éditer les variables
```

Créer le premier admin au démarrage :

```bash
export BOOTSTRAP_ADMIN_EMAIL=admin@example.com
export BOOTSTRAP_ADMIN_PASSWORD='choisissez-un-mot-de-passe-fort'
npm start
```

---

## Démarrage (SaaS)

```bash
npm start
```

Ouvrir **http://127.0.0.1:4599** — landing publique. L’outil est sur **/app** après connexion.

| Route | Accès | Rôle |
|-------|--------|------|
| `/` | Public | Landing / tunnel de vente |
| `/register` | Public* | Créer un compte |
| `/login` | Public | Connexion |
| `/app` | Connecté | Convertir + historique |
| `/admin` | Admin | Gestion utilisateurs & stats |
| `POST /convert` | Connecté | API conversion (ZIP) |
| `GET /health` | Public | Healthcheck |

\* Désactiver les inscriptions : `REGISTRATION_OPEN=0`

### Parcours utilisateur

1. Créer un compte / se connecter  
2. Déposer un HTML  
3. (Optionnel) indiquer l’URL publique des images  
4. Convertir → télécharger le `.zip`  
5. Suivre le quota mensuel dans la sidebar  

### Parcours admin

1. Se connecter avec le compte bootstrap  
2. Ouvrir **Admin**  
3. Ajuster les quotas, activer/désactiver des comptes, promouvoir des admins  

---

## Configuration

Voir `.env.example` :

| Variable | Défaut | Description |
|----------|--------|-------------|
| `PORT` | `4599` | Port HTTP |
| `HOST` | `127.0.0.1` | Interface d’écoute |
| `MAX_BODY_MB` | `200` | Taille max du HTML uploadé |
| `BOOTSTRAP_ADMIN_EMAIL` | — | E-mail du 1er admin |
| `BOOTSTRAP_ADMIN_PASSWORD` | — | Mot de passe du 1er admin |
| `REGISTRATION_OPEN` | `1` | Inscriptions publiques |
| `FREE_MONTHLY_QUOTA` | `3` | Quota plan Free |
| `STANDARD_MONTHLY_QUOTA` | `50` | Quota plan Standard |
| `PRO_MONTHLY_QUOTA` | `500` | Quota plan Pro |
| `SESSION_DAYS` | `14` | Durée de session |
| `COOKIE_SECURE` | — | `1` en HTTPS |
| `DB_PATH` | `storage/app.db` | Fichier SQLite |

```bash
# Derrière Nginx / Caddy
HOST=0.0.0.0 PORT=4599 COOKIE_SECURE=1 NODE_ENV=production npm start
```

> Mettez HTTPS + reverse-proxy. Les cookies de session sont HttpOnly / SameSite=Lax ; activez `COOKIE_SECURE=1` en production.

---

## Ligne de commande

La CLI reste disponible **sans** authentification (usage local / CI) :

```bash
npm run convert -- page.html
npm run convert -- page.html out.elementor.json \
  --assets-base=https://exemple.com/wp-content/uploads/page
```

---

## Import WordPress

1. Elementor → activer **Flexbox Container**
2. **Modèles → Modèles enregistrés → Importer des modèles** → `.elementor.json`
3. Uploader `assets/` à l’URL indiquée si des images ont été extraites
4. Polices Google : Elementor → Réglages → Google Fonts, puis **Régénérer le CSS**

---

## Structure

```
converter/
├── data/                 # Knowledge base Elementor
├── storage/              # SQLite (gitignore) — users, sessions, conversions
├── src/
│   ├── server.js         # SaaS HTTP (auth + admin + convert)
│   ├── auth.js           # Sessions, mots de passe (scrypt), quotas
│   ├── db.js             # Schéma SQLite
│   ├── web/ui.js         # Pages login / app / admin
│   ├── cli.js            # CLI
│   ├── convert.js        # Pipeline de conversion
│   └── …
├── .env.example
└── package.json
```

---

## Limites connues

- Widgets classiques uniquement (pas les atomic widgets Elementor)
- Pas encore de reset password / e-mail / OAuth / facturation Stripe
- Gradients complexes, `box-shadow`, `transform` : couverture partielle
- `node:sqlite` est encore marqué experimental dans Node.js

---

## Licence

Projet privé (`"private": true` dans `package.json`).
