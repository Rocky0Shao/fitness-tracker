import { doc, setDoc, getDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface SharePermissions {
  showGraph: boolean;
  showPhotos: boolean;
  showCompare: boolean;
}

export interface ShareLink {
  token: string;
  odId: string;
  createdAt: Date;
  permissions: SharePermissions;
  isActive: boolean;
}

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function getOrCreateShareLink(userId: string): Promise<ShareLink> {
  if (!db) throw new Error('Database not initialized');

  const userDocRef = doc(db, 'users', userId, 'settings', 'shareLink');
  const existing = await getDoc(userDocRef);

  if (existing.exists()) {
    const data = existing.data();
    return {
      token: data.token,
      odId: userId,
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      permissions: data.permissions,
      isActive: data.isActive,
    };
  }

  // Create new share link
  const token = generateToken();
  const now = new Date();

  const shareLink: ShareLink = {
    token,
    odId: userId,
    createdAt: now,
    permissions: { showGraph: true, showPhotos: true, showCompare: true },
    isActive: false, // Disabled by default
  };

  // Store in global collection for lookup by token
  const globalDocRef = doc(db, 'shareLinks', token);
  await setDoc(globalDocRef, {
    token,
    userId,
    createdAt: Timestamp.fromDate(now),
    permissions: shareLink.permissions,
    isActive: false,
  });

  // Store in user's settings
  await setDoc(userDocRef, {
    token,
    createdAt: Timestamp.fromDate(now),
    permissions: shareLink.permissions,
    isActive: false,
  });

  return shareLink;
}

export async function updateShareLink(
  userId: string,
  token: string,
  updates: { permissions?: SharePermissions; isActive?: boolean }
): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  const globalDocRef = doc(db, 'shareLinks', token);
  const userDocRef = doc(db, 'users', userId, 'settings', 'shareLink');

  await setDoc(globalDocRef, updates, { merge: true });
  await setDoc(userDocRef, updates, { merge: true });
}

export async function regenerateShareToken(userId: string, oldToken: string): Promise<ShareLink> {
  if (!db) throw new Error('Database not initialized');

  // Delete old global reference
  const oldGlobalRef = doc(db, 'shareLinks', oldToken);
  await deleteDoc(oldGlobalRef);

  // Generate new token
  const newToken = generateToken();
  const now = new Date();

  const userDocRef = doc(db, 'users', userId, 'settings', 'shareLink');
  const existing = await getDoc(userDocRef);
  const existingData = existing.exists() ? existing.data() : {};

  const shareLink: ShareLink = {
    token: newToken,
    odId: userId,
    createdAt: now,
    permissions: existingData.permissions || { showGraph: true, showPhotos: true, showCompare: true },
    isActive: false, // Reset to disabled when regenerating
  };

  // Create new global reference
  const newGlobalRef = doc(db, 'shareLinks', newToken);
  await setDoc(newGlobalRef, {
    token: newToken,
    userId,
    createdAt: Timestamp.fromDate(now),
    permissions: shareLink.permissions,
    isActive: false,
  });

  // Update user's settings with new token
  await setDoc(userDocRef, {
    token: newToken,
    createdAt: Timestamp.fromDate(now),
    permissions: shareLink.permissions,
    isActive: false,
  });

  return shareLink;
}

export async function getShareLinkByToken(token: string): Promise<ShareLink | null> {
  if (!db) return null;

  const docRef = doc(db, 'shareLinks', token);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  return {
    token: data.token,
    odId: data.userId,
    createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
    permissions: data.permissions,
    isActive: data.isActive,
  };
}
