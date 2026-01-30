import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, setDoc, getDoc, deleteDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { storage, db } from './firebase';

export interface PhotoEntry {
  date: string;
  frontPhotoUrl: string | null;
  backPhotoUrl: string | null;
  uploadedAt: Date;
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export async function uploadPhoto(
  userId: string,
  date: string,
  file: File,
  type: 'front' | 'back'
): Promise<string> {
  if (!storage) throw new Error('Storage not initialized');
  const storageRef = ref(storage, `photos/${userId}/${date}/${type}.jpg`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function savePhotoEntry(
  userId: string,
  date: string,
  frontUrl: string | null,
  backUrl: string | null
): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  const docRef = doc(db, 'users', userId, 'photos', date);
  const existing = await getDoc(docRef);

  const data: Partial<PhotoEntry> = {
    date,
    uploadedAt: new Date(),
  };

  if (frontUrl) data.frontPhotoUrl = frontUrl;
  if (backUrl) data.backPhotoUrl = backUrl;

  if (existing.exists()) {
    const existingData = existing.data();
    await setDoc(docRef, { ...existingData, ...data }, { merge: true });
  } else {
    await setDoc(docRef, {
      date,
      frontPhotoUrl: frontUrl,
      backPhotoUrl: backUrl,
      uploadedAt: new Date(),
    });
  }
}

export async function getPhotoEntry(userId: string, date: string): Promise<PhotoEntry | null> {
  if (!db) return null;
  const docRef = doc(db, 'users', userId, 'photos', date);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as PhotoEntry;
  }
  return null;
}

export async function getAllPhotoEntries(userId: string): Promise<PhotoEntry[]> {
  if (!db) return [];
  const photosRef = collection(db, 'users', userId, 'photos');
  const q = query(photosRef, orderBy('date', 'desc'));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => doc.data() as PhotoEntry);
}

export async function deletePhoto(
  userId: string,
  date: string,
  type: 'front' | 'back'
): Promise<void> {
  if (!storage || !db) throw new Error('Firebase not initialized');

  const storageRef = ref(storage, `photos/${userId}/${date}/${type}.jpg`);
  try {
    await deleteObject(storageRef);
  } catch (error) {
    console.warn('Photo file may not exist:', error);
  }

  const docRef = doc(db, 'users', userId, 'photos', date);
  const existing = await getDoc(docRef);

  if (existing.exists()) {
    const data = existing.data();
    const update: Partial<PhotoEntry> = {
      [type === 'front' ? 'frontPhotoUrl' : 'backPhotoUrl']: null,
      uploadedAt: new Date(),
    };

    const otherType = type === 'front' ? 'backPhotoUrl' : 'frontPhotoUrl';
    if (!data[otherType]) {
      await deleteDoc(docRef);
    } else {
      await setDoc(docRef, update, { merge: true });
    }
  }
}

export async function deletePhotoEntry(userId: string, date: string): Promise<void> {
  if (!storage || !db) throw new Error('Firebase not initialized');

  const frontRef = ref(storage, `photos/${userId}/${date}/front.jpg`);
  const backRef = ref(storage, `photos/${userId}/${date}/back.jpg`);

  try {
    await deleteObject(frontRef);
  } catch (error) {
    console.warn('Front photo may not exist:', error);
  }

  try {
    await deleteObject(backRef);
  } catch (error) {
    console.warn('Back photo may not exist:', error);
  }

  const docRef = doc(db, 'users', userId, 'photos', date);
  await deleteDoc(docRef);
}
