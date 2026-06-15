# HRMS — Human Resource Management System

A full-stack Human Resource Management System built with **Django REST Framework** (backend) and **React + Vite** (frontend). Designed to manage employees, departments, attendance, and HR operations with a clean REST API and a responsive UI.

---

## Tech Stack

| Layer | Technology |
|------------|----------------------------------------------|
| Backend | Python, Django, Django REST Framework |
| Frontend | React, Vite, JavaScript, CSS |
| Database | SQLite (development), PostgreSQL (production) |
| Deployment | Railway (backend), Vite build (frontend) |
| Server | Gunicorn |

---

## Project Structure

```
-HRMS/
├── backend/           # Django project (config.wsgi, APIs, models)
├── frontend/          # React + Vite app
├── .env.example       # Environment variable template
├── railway.json       # Railway deployment config
└── .gitignore
```

---

## Features

- Employee management — add, update, delete, list employees
- Department management with employee associations
- REST API with full CRUD operations
- CORS configured for frontend-backend communication
- PostgreSQL-ready for production, SQLite for local dev
- Deployed on Railway with Gunicorn server

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Git

---

### 1. Clone the repo

```bash
git clone https://github.com/akcodes-py/-HRMS.git
cd -HRMS
```

### 2. Setup environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
VITE_API_BASE_URL=http://localhost:8000
```

---

### 3. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Backend runs at: `http://localhost:8000`

---

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Deployment (Railway)

This project is configured for Railway deployment via `railway.json`.

The backend starts with:
```bash
cd backend && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```

Set these environment variables in your Railway project:
- `SECRET_KEY`
- `DEBUG=False`
- `ALLOWED_HOSTS=your-railway-domain`
- `DATABASE_URL` (Railway auto-injects PostgreSQL URL)
- `CORS_ALLOWED_ORIGINS=https://your-frontend-domain`

---

## API Endpoints

> Base URL: `http://localhost:8000/api/`

| Method | Endpoint | Description |
|--------|------------------------|--------------------------|
| GET | `/employees/` | List all employees |
| POST | `/employees/` | Create new employee |
| GET | `/employees/{id}/` | Get employee by ID |
| PUT | `/employees/{id}/` | Update employee |
| DELETE | `/employees/{id}/` | Delete employee |
| GET | `/departments/` | List all departments |
| POST | `/departments/` | Create new department |

---

## Environment Variables Reference

| Variable | Description |
|--------------------------|----------------------------------------------|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | `True` for dev, `False` for production |
| `ALLOWED_HOSTS` | Comma-separated list of allowed hosts |
| `DATABASE_URL` | PostgreSQL URL (auto-set by Railway in prod) |
| `CORS_ALLOWED_ORIGINS` | Frontend origin URLs |
| `VITE_API_BASE_URL` | Backend API URL used by frontend |

---

## Author

**Atul Kumar**
- GitHub: [@akcodes-py](https://github.com/akcodes-py)
- LinkedIn: [atul-kumar-365289294](https://linkedin.com/in/atul-kumar-365289294)
- 
