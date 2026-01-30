'use client';

import { useEffect } from 'react';
import PhotoUpload from './PhotoUpload';
import { PhotoEntry } from '@/lib/photoService';

interface UploadModalProps {
  isOpen: boolean;
  date: string;
  existingEntry: PhotoEntry | null;
  ghostOverlayEntry?: PhotoEntry | null; // For alignment guide
  onClose: () => void;
  onUploadComplete: () => void;
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function UploadModal({
  isOpen,
  date,
  existingEntry,
  ghostOverlayEntry,
  onClose,
  onUploadComplete,
}: UploadModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasPhotos = existingEntry?.frontPhotoUrl || existingEntry?.backPhotoUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">
          {formatDisplayDate(date)}
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          {hasPhotos ? 'Update photos for this day' : 'Add photos for this day'}
        </p>

        <div className="flex gap-8 justify-center">
          <PhotoUpload
            type="front"
            date={date}
            existingUrl={existingEntry?.frontPhotoUrl}
            onUploadComplete={onUploadComplete}
            ghostOverlayUrl={ghostOverlayEntry?.frontPhotoUrl}
          />
          <PhotoUpload
            type="back"
            date={date}
            existingUrl={existingEntry?.backPhotoUrl}
            onUploadComplete={onUploadComplete}
            ghostOverlayUrl={ghostOverlayEntry?.backPhotoUrl}
          />
        </div>

        {hasPhotos && (
          <p className="text-xs text-gray-400 text-center mt-6">
            Upload new photos to replace existing ones
          </p>
        )}
      </div>
    </div>
  );
}
