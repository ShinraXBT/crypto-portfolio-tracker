# Plan d'Implémentation - Crypto Portfolio Tracker

## Vue d'ensemble
Application web de suivi de performance de portfolio crypto avec Vue.js (frontend) et FastAPI (backend).

---

## Architecture

```
crypto-portfolio-tracker/
├── backend/
│   ├── main.py                 # Point d'entrée FastAPI
│   ├── database.py             # Configuration SQLite
│   ├── models.py               # Modèles SQLAlchemy
│   ├── schemas.py              # Schémas Pydantic
│   ├── routers/
│   │   ├── wallets.py          # CRUD wallets
│   │   ├── entries.py          # CRUD entrées (mensuel/journalier)
│   │   ├── alerts.py           # Gestion alertes
│   │   └── metrics.py          # Calculs de performance
│   └── services/
│       ├── crypto_prices.py    # API prix BTC/ETH (CoinGecko)
│       └── calculations.py     # Calculs ROI, drawdown, etc.
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.vue       # Vue principale
│   │   │   ├── WalletTable.vue     # Tableau des wallets
│   │   │   ├── MonthlyView.vue     # Vue mensuelle (comme Excel 2024/2025)
│   │   │   ├── DailyView.vue       # Vue journalière (comme Octobre)
│   │   │   ├── Charts/
│   │   │   │   ├── LineChart.vue   # Évolution temporelle
│   │   │   │   ├── BarChart.vue    # Comparaisons
│   │   │   │   └── PieChart.vue    # Allocation
│   │   │   ├── AlertsPanel.vue     # Gestion des alertes
│   │   │   └── MetricsCard.vue     # KPIs (ROI, drawdown...)
│   │   ├── views/
│   │   │   ├── HomeView.vue
│   │   │   ├── WalletsView.vue
│   │   │   ├── AnalyticsView.vue
│   │   │   └── AlertsView.vue
│   │   ├── stores/                 # Pinia stores
│   │   └── services/               # API calls
│   └── package.json
├── data/
│   └── portfolio.db            # Base SQLite
└── README.md
```

---

## Phase 1: Configuration du Projet

### 1.1 Backend FastAPI
- [ ] Initialiser le projet Python avec virtual environment
- [ ] Installer dépendances: `fastapi`, `uvicorn`, `sqlalchemy`, `pydantic`, `httpx`
- [ ] Configurer SQLite avec SQLAlchemy
- [ ] Créer les modèles de données

### 1.2 Frontend Vue.js
- [ ] Créer projet Vue 3 avec Vite
- [ ] Installer dépendances: `vue-router`, `pinia`, `chart.js`, `vue-chartjs`, `axios`
- [ ] Configurer TailwindCSS pour le styling
- [ ] Mettre en place la structure de base

---

## Phase 2: Modèles de Données

### Tables SQLite

```sql
-- Wallets (Solana, Degen, Rabby, Tron, etc.)
CREATE TABLE wallets (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7),  -- Pour l'affichage
    created_at TIMESTAMP
);

-- Entrées mensuelles (comme votre tableau 2024/2025)
CREATE TABLE monthly_entries (
    id INTEGER PRIMARY KEY,
    wallet_id INTEGER REFERENCES wallets(id),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    value_usd DECIMAL(15,2),
    btc_price DECIMAL(15,2),
    notes TEXT,
    created_at TIMESTAMP
);

-- Entrées journalières (comme votre tableau Octobre)
CREATE TABLE daily_entries (
    id INTEGER PRIMARY KEY,
    wallet_id INTEGER REFERENCES wallets(id),
    date DATE NOT NULL,
    value_usd DECIMAL(15,2),
    notes TEXT,
    created_at TIMESTAMP
);

-- Alertes configurées
CREATE TABLE alerts (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100),
    alert_type VARCHAR(50),  -- 'value_threshold', 'variation_percent', 'btc_price'
    condition VARCHAR(20),   -- 'above', 'below'
    threshold DECIMAL(15,2),
    wallet_id INTEGER REFERENCES wallets(id),  -- NULL = global
    is_active BOOLEAN DEFAULT TRUE,
    triggered_at TIMESTAMP,
    created_at TIMESTAMP
);

-- Historique des prix BTC/ETH (cache local)
CREATE TABLE price_history (
    id INTEGER PRIMARY KEY,
    symbol VARCHAR(10),
    date DATE,
    price_usd DECIMAL(15,2)
);
```

---

## Phase 3: API Backend

### Endpoints REST

#### Wallets
- `GET /api/wallets` - Liste tous les wallets
- `POST /api/wallets` - Créer un wallet
- `PUT /api/wallets/{id}` - Modifier un wallet
- `DELETE /api/wallets/{id}` - Supprimer un wallet

#### Entrées Mensuelles
- `GET /api/monthly?year=2024` - Entrées d'une année
- `POST /api/monthly` - Ajouter une entrée mensuelle
- `PUT /api/monthly/{id}` - Modifier
- `DELETE /api/monthly/{id}` - Supprimer
- `GET /api/monthly/summary` - Résumé avec deltas calculés

#### Entrées Journalières
- `GET /api/daily?month=10&year=2024` - Entrées d'un mois
- `POST /api/daily` - Ajouter entrée journalière
- `PUT /api/daily/{id}` - Modifier
- `DELETE /api/daily/{id}` - Supprimer

#### Métriques & Analytics
- `GET /api/metrics/roi` - ROI global et par période
- `GET /api/metrics/drawdown` - Drawdown maximum
- `GET /api/metrics/vs-btc` - Performance vs holding BTC
- `GET /api/metrics/summary` - Dashboard KPIs

#### Alertes
- `GET /api/alerts` - Liste des alertes
- `POST /api/alerts` - Créer alerte
- `PUT /api/alerts/{id}` - Modifier
- `DELETE /api/alerts/{id}` - Supprimer
- `GET /api/alerts/check` - Vérifier alertes déclenchées

#### Prix Crypto
- `GET /api/prices/current` - Prix actuel BTC/ETH
- `GET /api/prices/history?symbol=BTC&days=30` - Historique

---

## Phase 4: Interface Frontend

### 4.1 Dashboard Principal
- Vue consolidée du portfolio total
- KPIs cards (valeur totale, ROI, variation 24h/30j, drawdown)
- Graphique ligne évolution globale
- Liste des alertes actives

### 4.2 Vue Mensuelle
- Reproduire le tableau Excel 2024/2025
- Colonnes: Mois | Wallets | Delta $ | Delta % | BTC Price
- Couleurs conditionnelles (vert/rouge selon performance)
- Sélecteur d'année
- Ligne de résumé annuel (Delta total)

### 4.3 Vue Journalière
- Reproduire le tableau par jour (comme Octobre)
- Grille de cards par jour
- Chaque card montre les wallets et leurs valeurs
- Total et variation % par jour
- Navigation par mois

### 4.4 Vue Wallets
- Liste des wallets avec stats individuelles
- Graphique d'évolution par wallet
- Formulaire ajout/modification wallet

### 4.5 Vue Analytics
- Graphiques interactifs détaillés
- Line chart: évolution dans le temps
- Bar chart: comparaison mensuelle
- Pie chart: répartition actuelle par wallet
- Comparaison vs BTC benchmark

### 4.6 Vue Alertes
- Liste des alertes configurées
- Formulaire création d'alerte
- Historique des alertes déclenchées

---

## Phase 5: Fonctionnalités Avancées

### 5.1 Calculs de Performance
- **Delta $**: Différence valeur mois N - mois N-1
- **Delta %**: (valeur N - valeur N-1) / valeur N-1 * 100
- **ROI Global**: (valeur actuelle - investissement initial) / investissement initial * 100
- **Drawdown Max**: Plus grande chute depuis un ATH
- **Performance vs BTC**: Comparer si garder BTC aurait été mieux

### 5.2 Système d'Alertes
- Vérification périodique des conditions
- Notifications browser (Web Notifications API)
- Types d'alertes:
  - Seuil de valeur atteint (ex: portfolio > $500k)
  - Variation % dépassée (ex: -10% en 24h)
  - Prix BTC/ETH atteint

### 5.3 API Prix Externes
- Intégration CoinGecko API (gratuit)
- Cache local des prix pour réduire les appels
- Mise à jour automatique prix BTC pour les entrées

---

## Phase 6: Styling & UX

### Design System
- TailwindCSS pour le styling
- Couleurs:
  - Vert: #22c55e (gains)
  - Rouge: #ef4444 (pertes)
  - Bleu: #3b82f6 (neutre/info)
  - Headers: #1e40af (bleu foncé)
- Dark mode supporté
- Responsive design (mobile-friendly)

### Composants UI
- Tables avec tri et filtres
- Cards pour les métriques
- Modals pour les formulaires
- Toasts pour les notifications
- Loading states

---

## Commandes de Lancement

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

L'application sera accessible sur:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Résumé des Livrables

1. **Backend FastAPI** complet avec tous les endpoints
2. **Frontend Vue.js** reproduisant et améliorant vos tableaux Excel
3. **Base SQLite** pré-configurée
4. **Documentation** d'utilisation
5. **Scripts** de démarrage

