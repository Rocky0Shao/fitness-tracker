'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import LoginButton from '@/components/LoginButton';
import PhotoUpload from '@/components/PhotoUpload';
import PhotoCarousel from '@/components/PhotoCarousel';
import ExerciseHeatmap from '@/components/ExerciseHeatmap';
import UploadModal from '@/components/UploadModal';
import ShareManager from '@/components/ShareManager';
import { PhotoEntry, getTodayDate, getPhotoEntry, getAllPhotoEntries } from '@/lib/photoService';

export default function Home() {
  const { user, loading, logout } = useAuth();
  const [todayEntry, setTodayEntry] = useState<PhotoEntry | null>(null);
  const [allEntries, setAllEntries] = useState<PhotoEntry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<string>('');
  const [modalEntry, setModalEntry] = useState<PhotoEntry | null>(null);
  const [shareExpanded, setShareExpanded] = useState(false);

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

  const handleDayClick = useCallback(async (date: string) => {
    if (!user) return;
    const entry = await getPhotoEntry(user.uid, date);
    setModalDate(date);
    setModalEntry(entry);
    setModalOpen(true);
  }, [user]);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setModalDate('');
    setModalEntry(null);
  }, []);

  const handleModalUploadComplete = useCallback(() => {
    loadData();
  }, [loadData]);

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
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
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

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Row 1: Today's Upload + History Carousel side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Upload */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-center text-lg font-semibold text-gray-800 mb-4">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h2>
            {todayComplete ? (
              <div className="text-center">
                <p className="text-green-600 font-medium mb-3 text-sm">
                  Today&apos;s photos uploaded!
                </p>
                <div className="flex gap-3 justify-center">
                  <div className="relative">
                    <img
                      src={todayEntry.frontPhotoUrl!}
                      alt="Front"
                      className="w-28 h-36 object-cover rounded-lg shadow"
                    />
                    <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">Front</span>
                  </div>
                  <div className="relative">
                    <img
                      src={todayEntry.backPhotoUrl!}
                      alt="Back"
                      className="w-28 h-36 object-cover rounded-lg shadow"
                    />
                    <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">Back</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-6 justify-center">
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

          {/* History Carousel */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-center text-lg font-semibold text-gray-800 mb-4">
              History ({allEntries.length} days)
            </h2>
            <PhotoCarousel entries={allEntries} />
          </div>
        </div>

        {/* Row 2: Activity Heatmap */}
        <ExerciseHeatmap entries={allEntries} onDayClick={handleDayClick} />

        {/* Row 3: Share Manager (Collapsible) */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <button
            onClick={() => setShareExpanded(!shareExpanded)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-lg font-semibold text-gray-800">Share Your Progress</h2>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${shareExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {shareExpanded && (
            <div className="px-6 pb-6">
              <ShareManager />
            </div>
          )}
        </div>
      </main>

      <UploadModal
        isOpen={modalOpen}
        date={modalDate}
        existingEntry={modalEntry}
        onClose={handleModalClose}
        onUploadComplete={handleModalUploadComplete}
      />
    </div>
  );
}
