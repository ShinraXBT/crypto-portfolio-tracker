# Crypto Portfolio Tracker

Application web Next.js pour tracker les performances de votre portfolio crypto.

## Fonctionnalites

- **Tracking mensuel** - Suivi des valeurs par mois avec calcul des deltas
- **Tracking journalier** - Suivi quotidien detaille par wallet
- **Wallets multiples** - Gestion de plusieurs wallets (Solana, Rabby, Degen, etc.)
- **Graphiques interactifs** - Visualisation de l'evolution du portfolio
- **Metriques avancees** - ROI, drawdown, comparaison vs BTC
- **Systeme d'alertes** - Alertes sur seuil de valeur, variation %, prix BTC

## Stack Technique

- **Framework**: Next.js 14 (App Router)
- **UI**: React + TailwindCSS
- **Base de donnees**: Prisma + SQLite
- **Graphiques**: Chart.js + react-chartjs-2
- **Deploiement**: Vercel

## Installation

```bash
# Cloner le repo
git clone https://github.com/ShinraXBT/crypto-portfolio-tracker.git
cd crypto-portfolio-tracker

# Installer les dependances
npm install

# Initialiser la base de donnees
npx prisma generate
npx prisma db push

# Lancer en dev
npm run dev
```

L'application sera accessible sur http://localhost:3000

## Deploiement sur Vercel

1. Fork/clone ce repo sur GitHub
2. Connecte-toi a [Vercel](https://vercel.com)
3. Importe le projet depuis GitHub
4. Vercel detectera automatiquement Next.js
5. Clique sur **Deploy**

### Variable d'environnement

Pour la production, ajoute dans Vercel:
```
DATABASE_URL="file:./prod.db"
```

Ou utilise Vercel Postgres pour une base de donnees persistante.

## Structure du Projet

```
crypto-portfolio-tracker/
├── app/
│   ├── api/              # API Routes
│   │   ├── wallets/
│   │   ├── monthly/
│   │   ├── daily/
│   │   ├── metrics/
│   │   ├── alerts/
│   │   └── years/
│   ├── monthly/          # Page tracking mensuel
│   ├── daily/            # Page tracking journalier
│   ├── wallets/          # Page gestion wallets
│   ├── analytics/        # Page analytics
│   ├── alerts/           # Page alertes
│   ├── layout.tsx        # Layout principal
│   └── page.tsx          # Dashboard
├── components/
│   ├── Navbar.tsx
│   ├── MetricsCard.tsx
│   ├── AddEntryModal.tsx
│   └── charts/
│       └── LineChart.tsx
├── lib/
│   ├── prisma.ts         # Client Prisma
│   └── utils.ts          # Fonctions utilitaires
├── prisma/
│   └── schema.prisma     # Schema base de donnees
└── package.json
```

## API Endpoints

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/wallets` | Liste des wallets |
| POST | `/api/wallets` | Creer un wallet |
| PUT | `/api/wallets/[id]` | Modifier un wallet |
| DELETE | `/api/wallets/[id]` | Supprimer un wallet |
| GET | `/api/monthly/summary` | Resume mensuel avec deltas |
| POST | `/api/monthly/bulk` | Ajouter entrees en masse |
| GET | `/api/daily/snapshots` | Snapshots journaliers |
| POST | `/api/daily` | Ajouter entree journaliere |
| GET | `/api/metrics` | Metriques (ROI, drawdown) |
| GET/POST | `/api/alerts` | Gestion des alertes |

## Licence

MIT
