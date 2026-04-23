# Contributing to EduTech

Thank you for your interest in contributing to EduTech! Here's how you can help.

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/edutech.git`
3. Install dependencies: `npm install`
4. Create a `.env.local` from `.env.example` and fill in your credentials
5. Run the database migration in Supabase SQL Editor
6. Start developing: `npm run dev`

## 📋 Development Guidelines

- **TypeScript** — All code must be strongly typed
- **Components** — Keep components focused and reusable
- **Styling** — Use the existing CSS design system classes (see `globals.css`)
- **API Routes** — Follow the existing pattern in `app/api/`
- **DL Models** — All models are in `lib/dl/` using TensorFlow.js

## 🔀 Pull Request Process

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and commit: `git commit -m "feat: description"`
3. Push to your fork: `git push origin feature/your-feature`
4. Open a Pull Request with a clear description

## 🐛 Reporting Issues

Please use GitHub Issues to report bugs. Include:
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Browser and OS information
