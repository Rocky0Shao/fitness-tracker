'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { PhotoEntry } from '@/lib/photoService';
import ComparisonSlider from './ComparisonSlider';

interface ComparisonModalProps {
  isOpen: boolean;
  entries: PhotoEntry[];
  onClose: () => void;
}

type ViewType = 'front' | 'back';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ComparisonModal({ isOpen, entries, onClose }: ComparisonModalProps) {
  const [beforeDateState, setBeforeDate] = useState<string>('');
  const [afterDateState, setAfterDate] = useState<string>('');
  const [viewType, setViewType] = useState<ViewType>('front');
  const prevIsOpenRef = useRef(isOpen);

  // Filter entries that have photos for the selected view type
  const entriesWithPhotos = useMemo(() => {
    return entries.filter((e) =>
      viewType === 'front' ? e.frontPhotoUrl : e.backPhotoUrl
    );
  }, [entries, viewType]);

  // Compute default dates
  const defaultAfterDate = entriesWithPhotos.length >= 1 ? entriesWithPhotos[0].date : '';
  const defaultBeforeDate = entriesWithPhotos.length >= 2 ? entriesWithPhotos[entriesWithPhotos.length - 1].date : '';

  // Use state values if set, otherwise use defaults
  const beforeDate = beforeDateState || defaultBeforeDate;
  const afterDate = afterDateState || defaultAfterDate;

  // Reset state when modal closes
  useEffect(() => {
    if (prevIsOpenRef.current && !isOpen) {
      // Modal just closed - reset state for next open
      setBeforeDate('');
      setAfterDate('');
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const beforeEntry = entries.find((e) => e.date === beforeDate);
  const afterEntry = entries.find((e) => e.date === afterDate);

  const beforeImage = viewType === 'front' ? beforeEntry?.frontPhotoUrl : beforeEntry?.backPhotoUrl;
  const afterImage = viewType === 'front' ? afterEntry?.frontPhotoUrl : afterEntry?.backPhotoUrl;

  const canCompare = beforeImage && afterImage && beforeDate !== afterDate;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-800">Compare Progress</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {entriesWithPhotos.length < 2 ? (
            <div className="text-center py-12 text-gray-500">
              <p>You need at least 2 photos to compare progress.</p>
              <p className="text-sm mt-2">Keep uploading to track your transformation!</p>
            </div>
          ) : (
            <>
              {/* View Type Toggle */}
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setViewType('front')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewType === 'front'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Front View
                </button>
                <button
                  onClick={() => setViewType('back')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewType === 'back'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Back View
                </button>
              </div>

              {/* Date Selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Before (Start Date)
                  </label>
                  <select
                    value={beforeDate}
                    onChange={(e) => setBeforeDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {entriesWithPhotos.map((entry) => (
                      <option key={entry.date} value={entry.date} disabled={entry.date === afterDate}>
                        {formatDate(entry.date)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    After (Current)
                  </label>
                  <select
                    value={afterDate}
                    onChange={(e) => setAfterDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {entriesWithPhotos.map((entry) => (
                      <option key={entry.date} value={entry.date} disabled={entry.date === beforeDate}>
                        {formatDate(entry.date)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Comparison Slider */}
              {canCompare ? (
                <ComparisonSlider
                  beforeImage={beforeImage}
                  afterImage={afterImage}
                  beforeLabel={formatDate(beforeDate)}
                  afterLabel={formatDate(afterDate)}
                />
              ) : (
                <div className="aspect-[3/4] max-w-md mx-auto bg-gray-100 rounded-xl flex items-center justify-center">
                  <p className="text-gray-500 text-sm">Select different dates to compare</p>
                </div>
              )}

              <p className="text-center text-xs text-gray-400">
                Drag the slider to reveal your transformation
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
