# What's Cookin' — Pantry + Recipe Recommendation App

CS160 (HCI) course project. An MVP web app for tracking pantry
ingredients and recommending recipes based on what you already have.

## Status

This is the initial project skeleton. Routing and page structure are
in place; no features (auth, pantry, recipes) are implemented yet.
Each feature will be built incrementally in later commits.

## Tech Stack

- React (Vite)
- React Router
- Firebase Authentication + Firestore
- Deployed on Vercel

## Project Structure

```
src/
  pages/       Route-level components (Login, Signup, Home, Pantry, RecipeDetails, NotFound)
  components/  Reusable UI components (e.g. Navigation)
  services/    Firebase, auth, and pantry data-access functions
  contexts/    React context providers (e.g. AuthContext)
  hooks/       Custom hooks (e.g. usePantry)
  utils/       Pure helper functions (e.g. ingredient matching logic)
```

## Getting Started

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and fill in Firebase config once the
Firebase project is created (not needed yet — auth/Firestore aren't
wired up in this skeleton).
