# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fitness tracking web application for daily progress photos. Users upload two photos per day (front and back views) to track their fitness journey over time.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Auth**: Firebase Authentication (Google Sign-In)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Styling**: Tailwind CSS 4
- **UI**: Swiper for carousels

## Build Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # Lint code
```

## Architecture

### Data Flow

1. **AuthContext** (`src/lib/AuthContext.tsx`) - Wraps app, provides `user`, `loading`, `signInWithGoogle`, `logout`
2. **PrivacyContext** (`src/lib/PrivacyContext.tsx`) - Controls privacy blur state for images
3. **photoService** (`src/lib/photoService.ts`) - All Firestore/Storage CRUD for photos
4. **shareService** (`src/lib/shareService.ts`) - Manages shareable links with permissions

### Key Patterns

- All components use `'use client'` directive (client-side rendering with Firebase)
- Photos stored as `photos/{userId}/{date}/front.jpg` and `back.jpg` in Firebase Storage
- Firestore path: `users/{userId}/photos/{date}` with `frontPhotoUrl`, `backPhotoUrl`, `uploadedAt`
- Share links stored in both `shareLinks/{token}` (global lookup) and `users/{userId}/settings/shareLink`
- API route at `/api/share/[token]` uses Firebase Admin SDK for server-side data access

### Component Responsibilities

- **PhotoUpload** - Handles drag-drop upload with ghost overlay from previous photo for alignment
- **PhotoCarousel** - Swiper-based carousel with thumbnail scrubber, exposes `goToDate()` via ref
- **ExerciseHeatmap** - GitHub-style activity heatmap showing workout days
- **ComparisonSlider** - Before/after photo comparison with draggable divider
- **PrivacyImage** - Wrapper that applies blur based on PrivacyContext

## Firestore Schema

```
users/{userId}/photos/{date}
  - frontPhotoUrl: string | null
  - backPhotoUrl: string | null
  - uploadedAt: timestamp

users/{userId}/settings/shareLink
  - token: string
  - permissions: { showGraph: boolean, showPhotos: boolean }
  - isActive: boolean

shareLinks/{token}
  - userId: string
  - permissions: { showGraph: boolean, showPhotos: boolean }
  - isActive: boolean
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

# For API routes (server-side Firebase Admin)
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```
