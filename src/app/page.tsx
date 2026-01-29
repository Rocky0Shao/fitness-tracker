'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import LoginButton from '@/components/LoginButton';
import PhotoUpload from '@/components/PhotoUpload';
import PhotoCarousel from '@/components/PhotoCarousel';
import { PhotoEntry, getTodayDate, getPhotoEntry, getAllPhotoEntries } from '@/lib/photoService';

export default function Home() {
  const { user, loading, logout } = useAuth();
  const [todayEntry, setTodayEntry] = useState<PhotoEntry | null>(null);
  const [allEntries, setAllEntries] = useState<PhotoEntry[]>([]);
  const [view, setView] = useState<'upload' | 'history'>('upload');

  const loadData = useCallback(async () => {
    if (!user) return;
    const today = getTodayDate();
    const [todayData, allData] = await Promise.all([
      getPhotoEntry(user.uid, today),
      getAllPhotoEntries(user.uid),
    ]);
    setTodayEntry(todayData);
    setAllEntries(allData);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Fitness Tracker</h1>
          <p className="text-gray-600">Track your progress with daily photos</p>
        </div>
        <LoginButton />
      </div>
    );
  }

  const todayComplete = todayEntry?.frontPhotoUrl && todayEntry?.backPhotoUrl;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Fitness Tracker</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.displayName}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 flex gap-4">
          <button
            onClick={() => setView('upload')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              view === 'upload'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Today {todayComplete && '✓'}
          </button>
          <button
            onClick={() => setView('history')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              view === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            History ({allEntries.length})
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {view === 'upload' ? (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-center text-lg font-semibold text-gray-800 mb-6">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h2>
            {todayComplete ? (
              <div className="text-center">
                <p className="text-green-600 font-medium mb-4">
                  Today&apos;s photos uploaded!
                </p>
                <div className="flex gap-4 justify-center">
                  <img
                    src={todayEntry.frontPhotoUrl!}
                    alt="Front"
                    className="w-36 h-48 object-cover rounded-lg shadow"
                  />
                  <img
                    src={todayEntry.backPhotoUrl!}
                    alt="Back"
                    className="w-36 h-48 object-cover rounded-lg shadow"
                  />
                </div>
              </div>
            ) : (
              <div className="flex gap-8 justify-center">
                <PhotoUpload
                  type="front"
                  existingUrl={todayEntry?.frontPhotoUrl}
                  onUploadComplete={loadData}
                />
                <PhotoUpload
                  type="back"
                  existingUrl={todayEntry?.backPhotoUrl}
                  onUploadComplete={loadData}
                />
              </div>
            )}
          </div>
        ) : (
          <PhotoCarousel entries={allEntries} />
        )}
      </main>
    </div>
  );
}
