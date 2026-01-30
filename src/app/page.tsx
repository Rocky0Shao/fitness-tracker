'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { usePrivacy } from '@/lib/PrivacyContext';
import LoginButton from '@/components/LoginButton';
import PhotoUpload from '@/components/PhotoUpload';
import PhotoCarousel, { PhotoCarouselHandle } from '@/components/PhotoCarousel';
import ExerciseHeatmap from '@/components/ExerciseHeatmap';
import UploadModal from '@/components/UploadModal';
import ShareManager from '@/components/ShareManager';
import ComparisonModal from '@/components/ComparisonModal';
import PrivacyImage from '@/components/PrivacyImage';
import { PhotoEntry, getTodayDate, getPhotoEntry, getAllPhotoEntries } from '@/lib/photoService';

export default function Home() {
  const { user, loading, logout } = useAuth();
  const { blurEnabled, toggleBlur } = usePrivacy();
  const [todayEntry, setTodayEntry] = useState<PhotoEntry | null>(null);
  const [allEntries, setAllEntries] = useState<PhotoEntry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<string>('');
  const [modalEntry, setModalEntry] = useState<PhotoEntry | null>(null);
  const [shareExpanded, setShareExpanded] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const carouselRef = useRef<PhotoCarouselHandle>(null);

  // Get the most recent photo for ghost overlay alignment
  const ghostOverlayEntry = useMemo(() => {
    // Return the most recent entry that has photos (excluding today if empty)
    return allEntries.find(e => e.frontPhotoUrl || e.backPhotoUrl) || null;
  }, [allEntries]);

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

  // Navigate carousel to view photos for a specific date
  const handleDayView = useCallback((date: string) => {
    if (carouselRef.current) {
      carouselRef.current.goToDate(date);
      // Scroll the history section into view
      document.getElementById('history-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

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
            {/* Privacy Blur Toggle */}
            <button
              onClick={toggleBlur}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                blurEnabled
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={blurEnabled ? 'Privacy mode on - hover to reveal' : 'Enable privacy mode'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {blurEnabled ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                )}
              </svg>
              <span className="hidden sm:inline">{blurEnabled ? 'Private' : 'Privacy'}</span>
            </button>
            {/* Compare Button */}
            <button
              onClick={() => setComparisonOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
              title="Compare progress photos"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <span className="hidden sm:inline">Compare</span>
            </button>
            <span className="text-sm text-gray-600 hidden sm:inline">{user.displayName}</span>
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
                    <PrivacyImage
                      src={todayEntry.frontPhotoUrl!}
                      alt="Front"
                      className="w-28 h-36 object-cover rounded-lg shadow"
                    />
                    <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">Front</span>
                  </div>
                  <div className="relative">
                    <PrivacyImage
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
                  ghostOverlayUrl={ghostOverlayEntry?.frontPhotoUrl}
                />
                <PhotoUpload
                  type="back"
                  existingUrl={todayEntry?.backPhotoUrl}
                  onUploadComplete={loadData}
                  ghostOverlayUrl={ghostOverlayEntry?.backPhotoUrl}
                />
              </div>
            )}
          </div>

          {/* History Carousel */}
          <div id="history-section" className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-center text-lg font-semibold text-gray-800 mb-4">
              History ({allEntries.length} days)
            </h2>
            <PhotoCarousel ref={carouselRef} entries={allEntries} />
          </div>
        </div>

        {/* Row 2: Activity Heatmap */}
        <ExerciseHeatmap
          entries={allEntries}
          onDayClick={handleDayClick}
          onDayView={handleDayView}
        />

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
        ghostOverlayEntry={ghostOverlayEntry}
        onClose={handleModalClose}
        onUploadComplete={handleModalUploadComplete}
      />

      <ComparisonModal
        isOpen={comparisonOpen}
        entries={allEntries}
        onClose={() => setComparisonOpen(false)}
      />
    </div>
  );
}
