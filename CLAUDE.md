# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FitSnap** - A daily fitness photo diary web application. Users upload two photos per day (front and back views) to track their fitness transformation over time.

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
- **ExerciseHeatmap** - GitHub-style activity heatmap with:
  - All 7 day labels (Sun-Sat) aligned with grid rows using explicit 12px heights and flexbox centering
  - Workout count in header: "Exercise Activity (X Days)"
  - Previous year always available for retroactive uploads
  - Click to view photos, double-click to edit
- **ComparisonSlider** - Before/after photo comparison with draggable divider
- **PrivacyImage** - Wrapper that applies blur based on PrivacyContext
- **ShareManager** - UI for enabling/disabling share links and setting permissions (showGraph, showPhotos, showCompare)
- **UploadModal** - Modal for uploading photos to past dates (opened from heatmap clicks)

## Firestore Schema

```
users/{userId}/photos/{date}
  - frontPhotoUrl: string | null
  - backPhotoUrl: string | null
  - uploadedAt: timestamp

users/{userId}/settings/shareLink
  - token: string
  - permissions: { showGraph: boolean, showPhotos: boolean, showCompare: boolean }
  - isActive: boolean

shareLinks/{token}
  - userId: string
  - permissions: { showGraph: boolean, showPhotos: boolean, showCompare: boolean }
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

## Share Link Functionality

The share feature allows users to share their progress via a public URL:

1. **Enable sharing** in the "Share Your Progress" section
2. **Configure permissions**: activity heatmap, photos, and/or before/after comparison
3. **Copy the link** to share with others

### Share Page Features (`/share/[token]`)

The shared page provides viewers with:
- **Exercise Activity Heatmap** - GitHub-style heatmap with "X Days" count, year selector, click to view photos
- **Photo Carousel** - Swiper-based carousel with thumbnail scrubber (same as main UI)
- **Compare Function** - Viewers can select two dates and compare front/back photos with draggable slider
- All features respect the owner's permission settings

The share API (`/api/share/[token]`) uses Firebase Admin SDK, which requires `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` to be set.

## Deployment (Vercel)

1. Connect your GitHub repo to Vercel
2. Add all environment variables in Vercel dashboard (Settings → Environment Variables)
3. For `FIREBASE_PRIVATE_KEY`, use the single-line format with `\n` escape sequences:
   ```
   -----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n
   ```
4. Deploy

## Known Issues & Solutions

- **Heatmap label alignment**: Uses explicit 12px heights and 4px gaps with flexbox centering to ensure day labels align with grid rows
- **Share link not working**: Ensure `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` are set correctly (check for whitespace issues in private key)
