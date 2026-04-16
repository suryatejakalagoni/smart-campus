# 🎓 Smart Campus Resource Management System

A comprehensive, full-stack ecosystem designed to modernize campus operations. Featuring role-based dashboards, automated scheduling, and a real-time notification engine.

## ✨ Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS 4, Recharts, React Icons
- **Backend**: Django REST Framework, PostgreSQL
- **Deployment**: Render (API), Vercel (Web), Whitenoise (Static Assets)

## 🛠️ Local Setup

### 1. Backend (Django)
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo_data
python manage.py runserver
```

### 2. Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

## 🔐 Default Credentials
| Role | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` |
| **Student** | `student1` | `student123` |
| **Faculty** | `faculty1` | `faculty123` |

## 🚀 Deployment Instructions

### Backend (Render)
1. Link your GitHub repository to Render.
2. Select **Web Service** and use `backend/render.yaml` or follow these settings:
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn smartcampus.wsgi:application`
3. Add environment variables: `FRONTEND_URL`, `SECRET_KEY`, `DATABASE_URL`.

### Frontend (Vercel)
1. Link the `frontend` directory to Vercel.
2. Configure **Environment Variables**:
   - `VITE_API_URL`: `https://your-api.onrender.com/api/`
3. The `vercel.json` will handle the SPA routing automatically.

## 📸 Dashboard Preview
*(Optional: Add screenshots here)*
![Admin Dashboard](https://raw.githubusercontent.com/placeholder/smartcampus/main/preview.png)

---
*Developed with precision for modern academic requirements.*
