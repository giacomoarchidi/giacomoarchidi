# 🎓 Tutoring Platform

Una piattaforma completa di tutoring online con AI, pagamenti integrati e gestione multi-ruolo.

## 🚀 Caratteristiche

### 👥 Multi-Ruolo
- **Studenti**: Prenotazione lezioni, accesso materiali, tracking progressi
- **Tutor**: Gestione disponibilità, lezioni, studenti assegnati
- **Genitori**: Monitoraggio figli, report mensili, gestione pagamenti
- **Admin**: Gestione piattaforma, utenti, statistiche

### 💡 Funzionalità Core
- ✅ **Sistema Lezioni**: Booking, aule virtuali Jitsi, gestione stati
- ✅ **Pagamenti Stripe**: Checkout, webhook, refund automatici
- ✅ **AI Integration**: Appunti automatici post-lezione, report mensili
- ✅ **Email System**: Notifiche, reminder, conferme automatiche
- ✅ **File Management**: Upload sicuro, storage S3/MinIO
- ✅ **Dashboard Responsive**: Interface moderne per tutti i ruoli

### 🔧 Stack Tecnologico

#### Backend
- **FastAPI** - API REST moderna e veloce
- **SQLAlchemy 2.0** - ORM con relazioni complesse
- **PostgreSQL** - Database principale
- **Redis** - Cache e sessioni
- **Celery** - Task asincroni (AI, email, report)
- **Stripe** - Pagamenti online
- **OpenAI** - AI per appunti e report
- **MinIO/S3** - Storage file

#### Frontend
- **React 18** - UI moderna e reattiva
- **TypeScript** - Type safety completa
- **Tailwind CSS** - Design system coerente
- **Zustand** - State management leggero
- **React Router** - Navigazione SPA
- **Vite** - Build tool veloce

#### DevOps
- **Docker Compose** - Ambiente di sviluppo
- **GitHub Actions** - CI/CD pipeline
- **Pytest** - Test backend
- **Vitest** - Test frontend
- **Pre-commit** - Quality gates

## 🛠️ Setup Sviluppo

### Prerequisiti
- Python 3.11+
- Node.js 20+
- Docker & Docker Compose
- Git

### 1. Clone Repository
```bash
git clone <repository-url>
cd tutoring-platform
```

### 2. Setup Backend
```bash
cd backend

# Crea virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Installa dipendenze
pip install -r requirements.txt

# Setup variabili ambiente
cp .env.example .env.dev
# Modifica .env.dev con le tue configurazioni
```

### 3. Setup Frontend
```bash
cd frontend

# Installa dipendenze
npm install

# Setup variabili ambiente
cp .env.example .env.local
# Modifica .env.local se necessario
```

### 4. Avvia con Docker Compose
```bash
# Dalla root del progetto
docker-compose -f ops/docker-compose.dev.yml up
```

### 5. Setup Database
```bash
cd backend
source venv/bin/activate

# Crea migrazioni
alembic upgrade head

# Crea utente admin (opzionale)
python scripts/create_admin.py
```

## 📱 Accesso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Admin Panel**: http://localhost:5173/admin/dashboard

## 🧪 Test

### Backend
```bash
cd backend
source venv/bin/activate

# Linting
ruff check .
mypy .

# Test
pytest tests/ -v --cov=app
```

### Frontend
```bash
cd frontend

# Linting
npm run lint

# Type checking
npm run type-check

# Test
npm run test
npm run test:coverage
```

### End-to-End
```bash
# Test completi
docker-compose -f ops/docker-compose.test.yml up --abort-on-container-exit
```

## 📊 Monitoraggio

### Health Checks
- **Backend**: `GET /api/health`
- **Database**: `GET /api/health/db`
- **Redis**: `GET /api/health/redis`
- **Storage**: `GET /api/health/storage`

### Logs
```bash
# Logs backend
docker-compose -f ops/docker-compose.dev.yml logs backend

# Logs frontend
docker-compose -f ops/docker-compose.dev.yml logs frontend

# Logs tutti i servizi
docker-compose -f ops/docker-compose.dev.yml logs -f
```

## 🚀 Deploy

### Staging
```bash
# Deploy automatico su push a develop
git push origin develop
```

### Production
```bash
# Deploy automatico su push a main
git push origin main
```

### Manual Deploy
```bash
# Build immagini
docker-compose -f ops/docker-compose.prod.yml build

# Deploy
docker-compose -f ops/docker-compose.prod.yml up -d
```

## 🔧 Configurazione

### Variabili Ambiente

#### Backend (.env.dev)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tp_db
DB_USER=tp_user
DB_PASSWORD=tp_pass

# Redis
REDIS_URL=redis://localhost:6379

# JWT
SECRET_KEY=your-secret-key
JWT_ALGO=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Stripe
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OpenAI
OPENAI_API_KEY=sk-...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@tutoring-platform.com

# Storage
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=tutoring-platform
```

#### Frontend (.env.local)
```env
VITE_API_BASE_URL=http://localhost:8000
```

## 📁 Struttura Progetto

```
tutoring-platform/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── core/           # Configurazione core
│   │   ├── models/         # Modelli SQLAlchemy
│   │   ├── schemas/        # Schemi Pydantic
│   │   ├── services/       # Business logic
│   │   ├── routers/        # API endpoints
│   │   └── migrations/     # Migrazioni Alembic
│   ├── templates/          # Template email/PDF
│   ├── tests/             # Test backend
│   └── requirements.txt
├── frontend/               # React frontend
│   ├── src/
│   │   ├── api/           # API clients
│   │   ├── components/    # Componenti React
│   │   ├── pages/         # Pagine
│   │   ├── store/         # State management
│   │   └── types/         # TypeScript types
│   ├── src/test/          # Test frontend
│   └── package.json
├── ops/                   # Operazioni e deploy
│   └── docker-compose.*.yml
└── .github/               # GitHub Actions
    └── workflows/
```

## 🤝 Contribuire

1. Fork il repository
2. Crea un branch feature (`git checkout -b feature/amazing-feature`)
3. Commit le modifiche (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Apri una Pull Request

### Code Style
- **Backend**: Black + isort + flake8 + mypy
- **Frontend**: ESLint + Prettier + TypeScript strict mode
- **Commits**: Conventional Commits

## 📄 Licenza

Questo progetto è licenziato sotto MIT License - vedi il file [LICENSE](LICENSE) per dettagli.

## 🆘 Supporto

- **Documentazione**: [Wiki](https://github.com/your-repo/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)

## 🙏 Ringraziamenti

- FastAPI per l'ecosistema Python moderno
- React team per l'ecosistema frontend
- Tailwind CSS per il design system
- OpenAI per le capacità AI
- Stripe per i pagamenti sicuri

---

**Sviluppato con ❤️ per l'educazione digitale**