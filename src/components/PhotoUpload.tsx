'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { uploadPhoto, savePhotoEntry, getTodayDate, deletePhoto } from '@/lib/photoService';

interface PhotoUploadProps {
  type: 'front' | 'back';
  existingUrl?: string | null;
  onUploadComplete: () => void;
  date?: string;
  ghostOverlayUrl?: string | null; // Previous photo for alignment
}

export default function PhotoUpload({ type, existingUrl, onUploadComplete, date, ghostOverlayUrl }: PhotoUploadProps) {
  const { user } = useAuth();
  const [preview, setPreview] = useState<string | null>(existingUrl || null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showGhost, setShowGhost] = useState(true);

  useEffect(() => {
    setPreview(existingUrl || null);
  }, [existingUrl]);

  const handleFile = useCallback(async (file: File) => {
    if (!user || !file.type.startsWith('image/')) return;

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const targetDate = date || getTodayDate();
      const url = await uploadPhoto(user.uid, targetDate, file, type);
      await savePhotoEntry(
        user.uid,
        targetDate,
        type === 'front' ? url : null,
        type === 'back' ? url : null
      );
      setPreview(url);
      onUploadComplete();
    } catch (error) {
      console.error('Upload failed:', error);
      setPreview(existingUrl || null);
    } finally {
      setUploading(false);
    }
  }, [user, type, existingUrl, onUploadComplete, date]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !existingUrl) return;

    const confirmed = window.confirm(`Delete this ${type} photo?`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      const targetDate = date || getTodayDate();
      await deletePhoto(user.uid, targetDate, type);
      setPreview(null);
      onUploadComplete();
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeleting(false);
    }
  }, [user, type, existingUrl, onUploadComplete, date]);

  const isUploaded = !!existingUrl;
  const isProcessing = uploading || deleting;
  const hasGhostOverlay = ghostOverlayUrl && !preview && showGhost;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
          {type} View
        </span>
        {ghostOverlayUrl && !preview && (
          <button
            onClick={() => setShowGhost(!showGhost)}
            className={`p-1 rounded transition-colors ${
              showGhost ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:text-gray-600'
            }`}
            title={showGhost ? 'Hide alignment guide' : 'Show alignment guide'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        )}
      </div>
      <label
        className={`
          relative w-40 h-52 rounded-xl border-2 border-dashed cursor-pointer
          flex items-center justify-center overflow-hidden transition-all
          ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploaded ? 'border-green-500 bg-green-50' : ''}
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Ghost Overlay for Alignment */}
        {hasGhostOverlay && (
          <img
            src={ghostOverlayUrl}
            alt="Alignment guide"
            className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
          />
        )}

        {preview ? (
          <img src={preview} alt={`${type} view`} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center p-4 relative z-10">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-xs text-gray-500">
              {hasGhostOverlay ? 'Align & upload' : 'Drop or tap'}
            </span>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
          disabled={isProcessing}
        />
        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {isUploaded && !isProcessing && (
          <button
            onClick={handleDelete}
            className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-colors z-20"
            title="Delete photo"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </label>
      {isUploaded && (
        <span className="text-xs text-green-600 font-medium">Uploaded</span>
      )}
      {hasGhostOverlay && (
        <span className="text-xs text-blue-500">Alignment guide active</span>
      )}
    </div>
  );
}
