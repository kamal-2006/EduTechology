# AI-Powered Personalized Learning & Skill Assessment Platform

A full-stack web application that combines React/Vite, Node.js/Express, MongoDB, and a Python Flask ML microservice to deliver AI-driven personalized learning experiences.

---

## Architecture Overview

```
EducationPSG/
├── frontend/          ← React + Vite  (port 5173)
│   └── src/
│       ├── pages/     ← Login, Register, Dashboard, CoursePage, QuizPage, Analytics
│       ├── components/← Navbar, ProtectedRoute
│       ├── services/  ← api.js (Axios)
│       ├── App.jsx
│       └── main.jsx
│
├── backend/           ← Node.js + Express  (port 5000)
│   ├── config/        ← db.js (Mongoose connection)
│   ├── models/        ← User, Course, Quiz, Progress
│   ├── controllers/   ← authController, courseController, quizController, analyticsController
│   ├── routes/        ← authRoutes, courseRoutes, quizRoutes, analyticsRoutes
│   ├── middleware/    ← authMiddleware (protect, authorise)
│   ├── seed.js        ← Dummy data seeder
│   └── server.js
│
└── ml-service/        ← Python Flask  (port 5001)
    ├── train_model.py ← Trains & saves the Decision Tree model
    ├── app.py         ← Flask API exposing POST /predict
    ├── model/         ← saved_model.pkl, le_perf.pkl, le_risk.pkl (auto-created)
    └── requirements.txt
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| MongoDB | ≥ 6 (local or Atlas) |
| Python | ≥ 3.9 |
| pip | latest |

---

## Setup Instructions

### 1 – MongoDB

Start your local MongoDB instance (default port 27017) **or** update `MONGO_URI` in `backend/.env` to point to MongoDB Atlas.

### 2 – Backend

```bash
cd backend
npm install
```

**Configure environment variables** – edit `backend/.env` if needed:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/educationpsg
JWT_SECRET=supersecretjwtkey_change_in_production
JWT_EXPIRES_IN=7d
ML_SERVICE_URL=http://localhost:5001
NODE_ENV=development
```

**Seed the database** with demo users, courses, quizzes, and progress records:

```bash
node seed.js
```

**Start the backend server:**

```bash
node server.js         # or: npx nodemon server.js
```

### 3 – ML Microservice

```bash
cd ml-service
pip install -r requirements.txt
python train_model.py   # trains the model and writes model/*.pkl
python app.py           # starts Flask on port 5001
```

> The backend calls the ML service automatically after every quiz submission. If the service is unavailable, it falls back to default predictions (Medium / No).

### 4 – Frontend

```bash
cd frontend
npm install
npm run dev             # starts Vite dev server on port 5173
```

Open **http://localhost:5173** in your browser.

---

## Environment Variables

### `backend/.env`

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Express server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/educationpsg` |
| `JWT_SECRET` | Secret key for JWT signing | *(change this!)* |
| `JWT_EXPIRES_IN` | JWT token lifespan | `7d` |
| `ML_SERVICE_URL` | Base URL of Flask ML service | `http://localhost:5001` |
| `NODE_ENV` | Environment mode | `development` |

### `frontend/.env`

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:5000/api` |

---

## Demo Accounts (after running seed.js)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@educationpsg.com | admin1234 |
| Student | alice@test.com | student1234 |
| Student | bob@test.com | student1234 |
| Student | carol@test.com | student1234 |

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ✗ | Register new student |
| POST | `/api/auth/login` | ✗ | Login and receive JWT |
| GET | `/api/auth/me` | ✓ | Get current user |

**Register body:**
```json
{ "name": "Jane", "email": "jane@test.com", "password": "secret123" }
```

**Login body:**
```json
{ "email": "jane@test.com", "password": "secret123" }
```

### Courses

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/courses` | ✓ | any | List all courses |
| GET | `/api/courses/:id` | ✓ | any | Get single course |
| POST | `/api/courses` | ✓ | admin | Create course |
| PUT | `/api/courses/:id` | ✓ | admin | Update course |
| DELETE | `/api/courses/:id` | ✓ | admin | Delete course |

### Quizzes

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/quiz/:courseId` | ✓ | any | Get quizzes for a course |
| GET | `/api/quiz/detail/:quizId` | ✓ | any | Get single quiz |
| POST | `/api/quiz` | ✓ | admin | Create quiz |
| POST | `/api/quiz/submit` | ✓ | student | Submit quiz answers |

**Submit body:**
```json
{
  "quizId":   "<quiz_id>",
  "courseId": "<course_id>",
  "timeTaken": 12,
  "answers": {
    "<questionId>": "selected answer text"
  }
}
```

**Submit response:**
```json
{
  "success": true,
  "data": {
    "quizScore": 75,
    "correct": 3,
    "total": 4,
    "recommendedLevel": "Intermediate",
    "predictedPerformance": "High",
    "dropoutRisk": "No",
    "progressId": "..."
  }
}
```

### Analytics

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/analytics/student/:id` | ✓ | student/admin | Student performance data |
| GET | `/api/analytics/admin` | ✓ | admin | Platform-wide analytics |

### ML Microservice (Flask)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/predict` | Predict performance and dropout risk |

**Predict body:**
```json
{ "quizScore": 55, "attempts": 2, "timeTaken": 30 }
```

**Predict response:**
```json
{ "predictedPerformance": "Medium", "dropoutRisk": "No" }
```

---

## AI & ML Logic

### Rule-Based Recommendation (Node.js backend)

After every quiz submission the backend immediately calculates a `recommendedLevel`:

```
quizScore < 40   →  Beginner
40 ≤ score ≤ 75  →  Intermediate
quizScore > 75   →  Advanced
```

### ML Prediction (Python Flask)

The Flask microservice runs a **Multi-Output Decision Tree** trained on 1,000 synthetic records. Features: `quizScore`, `attempts`, `timeTaken`. Outputs:

- `predictedPerformance`: Low / Medium / High  
- `dropoutRisk`: Yes / No

The model artifacts (`saved_model.pkl`, `le_perf.pkl`, `le_risk.pkl`) are stored in `ml-service/model/`.

---

## Role-Based Access

| Feature | Student | Admin |
|---------|---------|-------|
| Register / Login | ✓ | ✓ |
| Browse courses | ✓ | ✓ |
| Take quizzes | ✓ | – |
| View own analytics | ✓ | – |
| View platform analytics | – | ✓ |
| Create courses / quizzes | – | ✓ |
| View all students | – | ✓ |
| View at-risk students | – | ✓ |

---

## Testing

You can test all API endpoints using **curl**, **Postman**, or **Insomnia**.

1. Register or login to obtain a JWT token.
2. Pass the token as `Authorization: Bearer <token>` header.
3. Use the seed data (courses, quizzes) for end-to-end tests.

Quick smoke-test sequence:

```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"student1234"}'

# 2. List courses (use token from step 1)
curl http://localhost:5000/api/courses \
  -H "Authorization: Bearer <TOKEN>"

# 3. Admin analytics
curl http://localhost:5000/api/analytics/admin \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# 4. ML service health
curl http://localhost:5001/health
```

---

## Production Checklist

- [ ] Set strong `JWT_SECRET` in `backend/.env`
- [ ] Replace `CORS({ origin: "*" })` with specific allowed origins
- [ ] Use MongoDB Atlas or a dedicated MongoDB server
- [ ] Containerise services with Docker / Docker Compose
- [ ] Serve frontend build (`npm run build`) via a CDN or Nginx
- [ ] Add rate limiting (`express-rate-limit`) to auth routes
- [ ] Add HTTPS (TLS/SSL) for all services
