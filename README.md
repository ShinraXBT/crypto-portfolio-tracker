# Crypto Portfolio Tracker

Application web de suivi de performance de portfolio crypto avec Vue.js et FastAPI.

## Fonctionnalites

- **Tracking mensuel** - Suivi des valeurs de portfolio par mois avec calcul automatique des deltas
- **Tracking journalier** - Suivi quotidien detaille par wallet
- **Wallets multiples** - Gestion de plusieurs wallets (Solana, Rabby, Degen, Tron, etc.)
- **Graphiques interactifs** - Line charts, bar charts, pie charts pour visualiser les performances
- **Metriques avancees** - ROI, drawdown maximum, comparaison vs BTC
- **Systeme d'alertes** - Alertes sur seuil de valeur, variation %, prix BTC

## Architecture

```
crypto-portfolio-tracker/
├── backend/           # API FastAPI + SQLite
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── routers/
│   └── services/
├── frontend/          # Vue.js 3 + TailwindCSS
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── stores/
│   │   └── services/
│   └── public/
└── data/              # Base de donnees SQLite
```

## Installation

### Prerequis

- Python 3.10+
- Node.js 18+
- npm ou yarn

### Backend

```bash
cd backend

# Creer un environnement virtuel
python -m venv venv

# Activer l'environnement (Windows)
venv\Scripts\activate

# Activer l'environnement (Linux/Mac)
source venv/bin/activate

# Installer les dependances
pip install -r requirements.txt

# Lancer le serveur
uvicorn main:app --reload --port 8000
```

Le backend sera accessible sur http://localhost:8000

- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

### Frontend

```bash
cd frontend

# Installer les dependances
npm install

# Lancer le serveur de developpement
npm run dev
```

Le frontend sera accessible sur http://localhost:5173

## Utilisation

### 1. Creer des Wallets

Allez dans l'onglet "Wallets" et creez vos differents wallets:
- Solana
- Rabby
- Degen
- Tron
- etc.

### 2. Ajouter des Entrees Mensuelles

Dans l'onglet "Monthly":
1. Selectionnez l'annee
2. Cliquez sur "+ Add Entry"
3. Selectionnez le mois
4. Entrez les valeurs pour chaque wallet
5. Optionnellement, ajoutez le prix BTC du mois

### 3. Ajouter des Entrees Journalieres

Dans l'onglet "Daily":
1. Selectionnez le mois/annee
2. Cliquez sur "+ Add Entry"
3. Selectionnez la date
4. Entrez les valeurs pour chaque wallet

### 4. Consulter les Analytics

L'onglet "Analytics" affiche:
- ROI global
- Evolution du portfolio
- Performance mensuelle (bar chart)
- Allocation par wallet (pie chart)
- Drawdown depuis ATH
- Comparaison vs BTC

### 5. Configurer des Alertes

Dans l'onglet "Alerts":
- Creez des alertes sur seuil de valeur (ex: portfolio > $500k)
- Alertes sur variation % (ex: variation 24h < -10%)
- Alertes sur prix BTC (ex: BTC > $100k)

## API Endpoints

### Wallets
- `GET /api/wallets` - Liste des wallets
- `POST /api/wallets` - Creer un wallet
- `PUT /api/wallets/{id}` - Modifier un wallet
- `DELETE /api/wallets/{id}` - Supprimer un wallet

### Entrees Mensuelles
- `GET /api/monthly?year=2024` - Entrees d'une annee
- `GET /api/monthly/summary?year=2024` - Resume avec deltas
- `POST /api/monthly` - Ajouter une entree
- `POST /api/monthly/bulk` - Ajouter plusieurs entrees

### Entrees Journalieres
- `GET /api/daily?year=2024&month=10` - Entrees d'un mois
- `GET /api/daily/snapshots?year=2024&month=10` - Snapshots avec totaux
- `POST /api/daily` - Ajouter une entree

### Metriques
- `GET /api/metrics/summary` - Resume des KPIs
- `GET /api/metrics/roi?initial_investment=100000` - Details ROI
- `GET /api/metrics/drawdown` - Analyse drawdown
- `GET /api/metrics/vs-btc` - Comparaison vs BTC

### Alertes
- `GET /api/alerts` - Liste des alertes
- `POST /api/alerts` - Creer une alerte
- `GET /api/alerts/check/all` - Verifier alertes declenchees

### Prix Crypto
- `GET /api/prices/current?symbols=BTC,ETH` - Prix actuels
- `GET /api/prices/history/{symbol}?days=30` - Historique

## Technologies

### Backend
- FastAPI - Framework API moderne et performant
- SQLAlchemy - ORM pour la base de donnees
- SQLite - Base de donnees legere
- Pydantic - Validation des donnees
- httpx - Client HTTP async pour les prix crypto

### Frontend
- Vue.js 3 - Framework JavaScript reactif
- Pinia - State management
- Vue Router - Routing
- Chart.js / vue-chartjs - Graphiques
- TailwindCSS - Styling utilitaire
- Axios - Client HTTP

## Contribution

1. Fork le projet
2. Creez une branche (`git checkout -b feature/amelioration`)
3. Committez vos changements (`git commit -am 'Ajout de fonctionnalite'`)
4. Push sur la branche (`git push origin feature/amelioration`)
5. Creez une Pull Request

## Licence

MIT
