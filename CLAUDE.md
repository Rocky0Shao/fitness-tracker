# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fitness tracking web application for daily progress photos. Users upload two photos per day (front and back views) to track their fitness journey over time.

## Tech Stack

- **Framework**: Next.js
- **Auth**: Firebase Authentication (Google Sign-In)
- **Database**: Firebase Firestore (track photo metadata and dates)
- **Storage**: Firebase Storage (store photos)
- **Deployment**: Vercel
- **Styling**: TBD (Tailwind CSS recommended)

## Build Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run lint         # Lint code
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx      # Root layout with AuthProvider
│   ├── page.tsx        # Main page (login, upload, history views)
│   └── globals.css     # Global styles
├── components/
│   ├── LoginButton.tsx # Google sign-in button
│   ├── PhotoUpload.tsx # Drag-drop photo upload (front/back)
│   └── PhotoCarousel.tsx # Swiper-based horizontal carousel
└── lib/
    ├── firebase.ts     # Firebase app initialization
    ├── AuthContext.tsx # Auth state management
    └── photoService.ts # Firestore/Storage operations
```

## Core Requirements

1. **Google Login**: Users authenticate via Google account
2. **Daily Photo Upload**: Exactly 2 photos per day (front view + back view)
3. **Enforced Limit**: Cannot upload more than one front + one back per day
4. **Timeline Browse**: Users can scroll/swipe through past days to see progress
5. **Progress Tracking**: Visual indication of which days have photos (workout days)
6. **Private**: Each user only sees their own photos

## User Flow

1. User logs in with Google
2. Lands on today's upload screen (or timeline if already uploaded today)
3. Can upload front photo + back photo for today
4. Can browse past days to see their progress
5. Scrolling through days shows fitness progression over time

## UI Design

- **Navigation**: Horizontal swipe carousel (like Stories) to browse through days
- **Privacy**: Private-only (no sharing/social features)

## Firebase Setup Required

1. Create Firebase project at console.firebase.google.com
2. Enable Authentication > Google provider
3. Enable Firestore Database
4. Enable Storage
5. Add Firebase config to `.env.local`

## Firestore Schema (Proposed)

```
users/{userId}/photos/{date}
  - frontPhotoUrl: string
  - backPhotoUrl: string
  - uploadedAt: timestamp
```

## Storage Structure (Proposed)

```
photos/{userId}/{date}/front.jpg
photos/{userId}/{date}/back.jpg
```
