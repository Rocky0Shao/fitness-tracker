import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminDb() {
  if (getApps().length === 0) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) {
      return null;
    }

    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    } catch {
      initializeApp({ projectId });
    }
  }
  return getFirestore();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 500 }
    );
  }

  try {
    const linkDoc = await db.collection('shareLinks').doc(token).get();

    if (!linkDoc.exists) {
      return NextResponse.json(
        { error: 'Share link not found' },
        { status: 404 }
      );
    }

    const linkData = linkDoc.data()!;

    if (!linkData.isActive) {
      return NextResponse.json(
        { error: 'This share link has been revoked' },
        { status: 403 }
      );
    }

    const { userId, permissions } = linkData;
    const response: {
      permissions: { showGraph: boolean; showPhotos: boolean };
      entries?: Array<{
        date: string;
        frontPhotoUrl: string | null;
        backPhotoUrl: string | null;
      }>;
    } = { permissions };

    const photosSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('photos')
      .orderBy('date', 'desc')
      .get();

    const entries = photosSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        date: data.date,
        frontPhotoUrl: permissions.showPhotos ? data.frontPhotoUrl : null,
        backPhotoUrl: permissions.showPhotos ? data.backPhotoUrl : null,
      };
    });

    response.entries = entries;

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching share data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
