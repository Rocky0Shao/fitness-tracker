'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { uploadPhoto, savePhotoEntry, getTodayDate } from '@/lib/photoService';

interface PhotoUploadProps {
  type: 'front' | 'back';
  existingUrl?: string | null;
  onUploadComplete: () => void;
}

export default function PhotoUpload({ type, existingUrl, onUploadComplete }: PhotoUploadProps) {
  const { user } = useAuth();
  const [preview, setPreview] = useState<string | null>(existingUrl || null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!user || !file.type.startsWith('image/')) return;

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const date = getTodayDate();
      const url = await uploadPhoto(user.uid, date, file, type);
      await savePhotoEntry(
        user.uid,
        date,
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
  }, [user, type, existingUrl, onUploadComplete]);

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

  const isUploaded = !!existingUrl;

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
        {type} View
      </span>
      <label
        className={`
          relative w-40 h-52 rounded-xl border-2 border-dashed cursor-pointer
          flex items-center justify-center overflow-hidden transition-all
          ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploaded ? 'border-green-500 bg-green-50' : ''}
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {preview ? (
          <img src={preview} alt={`${type} view`} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center p-4">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-xs text-gray-500">Drop or tap</span>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
          disabled={uploading}
        />
        {uploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </label>
      {isUploaded && (
        <span className="text-xs text-green-600 font-medium">Uploaded</span>
      )}
    </div>
  );
}
