# 🎓 EduTech — AI-Powered Personalized Learning Platform

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-4.22-FF6F00?style=for-the-badge&logo=tensorflow)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss)

**An intelligent educational platform powered by 5 deep learning models that adapts to each student's learning journey in real-time.**

[Getting Started](#-getting-started) · [Features](#-features) · [Architecture](#-architecture) · [AI Models](#-deep-learning-models) · [Database](#-database-schema)

</div>

---

## ✨ Features

### 🧑‍🎓 Student Portal
- **Personalized Dashboard** — AI-powered insights showing your level, trends, weak areas, predictions, and recommendations
- **Quiz System** — Take and create quizzes with real-time scoring and AI analysis
- **Reference Library** — Share and discover study resources with peer-posted references
- **NLP Text Analyzer** — Analyze any text for topic classification, keyword extraction, and difficulty estimation
- **Learning Path** — Visual progression through Foundation → Core Concepts → Advanced → Mastery

### 🛡️ Admin Portal
- **Analytics Dashboard** — Platform-wide AI analytics with student level distribution, subject performance, and leaderboards
- **Student Management** — View, search, and manage all registered students
- **Quiz Management** — Create, view, and delete quizzes across the platform
- **Reference Management** — Curate and manage shared learning resources
- **Admin Management** — Super admins can add/remove other administrators

### 🔐 Authentication System
- **Email & OTP Verification** — 6-digit OTP via SMTP email with auto-expiry
- **Password Reset Flow** — Forgot password → OTP verification → Reset
- **JWT Session Management** — Secure cookie-based auth with middleware protection
- **Role-Based Access Control** — Student, Admin, and Super Admin roles

---

## 🧠 Deep Learning Models

This platform uses **5 neural network models** running on TensorFlow.js for real-time, personalized AI insights:

| # | Model | Architecture | Purpose |
|---|-------|-------------|---------|
| 1 | **ANN Classifier** | Dense(4→16→8→4) · Softmax · Adam | Classifies students into Beginner, Intermediate, Advanced, Expert |
| 2 | **Denoising Autoencoder** | Encoder-Decoder · Anomaly Detection | Detects knowledge gaps via high reconstruction error |
| 3 | **LSTM Predictor** | Stacked LSTM(16) · Sliding Window | Predicts next 3 quiz scores using autoregressive generation |
| 4 | **NCF Recommender** | Embedding(8) · MLP(32→16→1) | Recommends personalized quizzes and references |
| 5 | **NLP Analyzer** | Bag-of-Words · FFN · TF-IDF | Topic classification (8 classes), keyword extraction, difficulty estimation |

All models train in **real-time** using the student's own quiz data — no pre-trained weights needed.

---

## 🏗️ Architecture

```
edutech/
├── app/
│   ├── page.tsx                     # Landing page
│   ├── layout.tsx                   # Root layout with animated background
│   ├── globals.css                  # Design system (glassmorphism, animations)
│   ├── student/
│   │   ├── login/                   # Student login
│   │   ├── signup/                  # Student registration
│   │   ├── forgot-password/         # Password recovery
│   │   ├── verify-otp/              # OTP verification
│   │   ├── reset-password/          # Password reset
│   │   └── dashboard/
│   │       ├── page.tsx             # AI-powered dashboard
│   │       ├── layout.tsx           # Sidebar navigation
│   │       ├── quiz/                # Quiz listing & taking
│   │       ├── references/          # Reference library
│   │       └── nlp-analyzer/        # NLP text analysis tool
│   ├── admin/
│   │   ├── login/                   # Admin login
│   │   └── dashboard/
│   │       ├── page.tsx             # Analytics dashboard
│   │       ├── layout.tsx           # Admin sidebar
│   │       ├── quiz/                # Quiz management
│   │       ├── references/          # Reference management
│   │       ├── students/            # Student management
│   │       └── admins/              # Admin management (super admin)
│   └── api/
│       ├── student/                 # Student auth endpoints
│       ├── admin/                   # Admin auth + management endpoints
│       ├── quiz/                    # Quiz CRUD + submission
│       ├── references/              # Reference CRUD
│       ├── dl/                      # Deep learning inference endpoints
│       │   ├── classify/            # ANN classification
│       │   ├── weak-areas/          # Autoencoder anomaly detection
│       │   ├── predict/             # LSTM score prediction
│       │   ├── recommend/           # NCF recommendations
│       │   ├── analyze/             # NLP text analysis
│       │   └── admin-analytics/     # Platform-wide AI analytics
│       └── setup/                   # Database initialization
├── lib/
│   ├── supabase.ts                  # Supabase client (service role)
│   ├── auth.ts                      # JWT verification utilities
│   ├── mailer.ts                    # SMTP email (OTP sending)
│   └── dl/                          # Deep learning model implementations
│       ├── ann-classifier.ts        # ANN student level classification
│       ├── autoencoder.ts           # Denoising autoencoder
│       ├── lstm-predictor.ts        # Stacked LSTM predictor
│       ├── ncf-recommender.ts       # Neural collaborative filtering
│       └── nlp-analyzer.ts          # NLP BoW + FFN analyzer
├── supabase/
│   └── migration.sql                # Full database schema
├── middleware.ts                     # JWT route protection
└── tailwind.config.js               # Design token configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **Supabase** account (free tier works)
- **Gmail** account for SMTP (App Password required)

### 1. Clone the repository

```bash
git clone https://github.com/JAYA-KRUSHNA/edutech.git
cd edutech
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT
JWT_SECRET=your_random_secret_key

# SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password

# Super Admin (auto-created on first setup)
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=your_admin_password
```

### 4. Set up the database

Run the SQL migration in your Supabase SQL Editor:

```bash
# Copy contents of supabase/migration.sql into Supabase SQL Editor and execute
```

Then initialize the super admin by visiting:

```
http://localhost:3000/api/setup
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the platform.

---

## 🎨 Design System

The platform uses a **premium dark glassmorphism** design system:

- 🌑 Deep dark backgrounds (`#06080f`, `#0d1117`)
- 🔮 Frosted glass cards with backdrop blur
- 🎨 Gradient accents (Indigo → Cyan)
- ✨ Animated mesh gradient backgrounds
- 💫 Skeleton loaders, progress bars, micro-animations
- 📱 Fully responsive layouts
- 🖋️ Typography: Inter + JetBrains Mono

---

## 🗄️ Database Schema

| Table | Purpose |
|-------|---------|
| `students` | Student accounts with OTP verification |
| `admins` | Admin accounts with super admin flag |
| `quizzes` | Quiz metadata (title, subject, creator) |
| `quiz_questions` | Questions with JSONB options |
| `quiz_attempts` | Student quiz attempts with scores |
| `references_posts` | Shared learning resources |

All tables have **Row Level Security (RLS)** enabled with service-role policies.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **Styling** | Tailwind CSS 3.4, Custom CSS Design System |
| **AI/ML** | TensorFlow.js 4.22 (5 neural network models) |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | JWT (jose), bcryptjs, HTTP-only cookies |
| **Email** | Nodemailer (SMTP/Gmail) |
| **Deployment** | Vercel-ready |

---

## 📄 API Endpoints

### Student Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/student/signup` | Register new student |
| POST | `/api/student/login` | Student login |
| POST | `/api/student/logout` | Student logout |
| GET | `/api/student/me` | Get current student |
| POST | `/api/student/verify-otp` | Verify email OTP |
| POST | `/api/student/forgot-password` | Send reset OTP |
| POST | `/api/student/reset-password` | Reset password |

### Admin Auth & Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| POST | `/api/admin/logout` | Admin logout |
| GET | `/api/admin/me` | Get current admin |
| GET/POST | `/api/admin/admins` | List/Create admins |
| DELETE | `/api/admin/admins/[id]` | Delete admin |
| GET | `/api/admin/students` | List all students |
| DELETE | `/api/admin/students/[id]` | Delete student |

### Quiz System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/quiz` | List/Create quizzes |
| GET/DELETE | `/api/quiz/[id]` | Get/Delete quiz |
| POST | `/api/quiz/[id]/submit` | Submit quiz attempt |

### References
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/references` | List/Create references |
| DELETE | `/api/references/[id]` | Delete reference |

### Deep Learning
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dl/classify` | ANN student classification |
| GET | `/api/dl/weak-areas` | Autoencoder weak area detection |
| GET | `/api/dl/predict` | LSTM score prediction |
| GET | `/api/dl/recommend` | NCF recommendations |
| POST | `/api/dl/analyze` | NLP text analysis |
| GET | `/api/dl/admin-analytics` | Platform AI analytics |

---

## 👨‍💻 Author

**Jaya Krushna**

---

## 📝 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
