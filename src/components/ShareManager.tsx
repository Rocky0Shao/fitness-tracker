'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import {
  ShareLink,
  SharePermissions,
  getOrCreateShareLink,
  updateShareLink,
  regenerateShareToken,
} from '@/lib/shareService';

export default function ShareManager() {
  const { user } = useAuth();
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadShareLink = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const link = await getOrCreateShareLink(user.uid);
      setShareLink(link);
    } catch (error) {
      console.error('Failed to load share link:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadShareLink();
  }, [loadShareLink]);

  const handleToggleActive = async () => {
    if (!user || !shareLink) return;
    setUpdating(true);
    try {
      await updateShareLink(user.uid, shareLink.token, { isActive: !shareLink.isActive });
      setShareLink({ ...shareLink, isActive: !shareLink.isActive });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePermissions = async (permissions: SharePermissions) => {
    if (!user || !shareLink) return;
    setUpdating(true);
    try {
      await updateShareLink(user.uid, shareLink.token, { permissions });
      setShareLink({ ...shareLink, permissions });
    } finally {
      setUpdating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!user || !shareLink) return;
    const confirmed = window.confirm(
      'This will invalidate your current share link. Anyone with the old link will no longer be able to access your data. Continue?'
    );
    if (!confirmed) return;

    setUpdating(true);
    try {
      const newLink = await regenerateShareToken(user.uid, shareLink.token);
      setShareLink(newLink);
    } finally {
      setUpdating(false);
    }
  };

  const handleCopy = async () => {
    if (!shareLink) return;
    const url = `${window.location.origin}/share/${shareLink.token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!shareLink) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Unable to load share settings.</p>
      </div>
    );
  }

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareLink.token}`;

  return (
    <div className="space-y-6">
      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div>
          <h3 className="font-medium text-gray-800">Share Link</h3>
          <p className="text-sm text-gray-500">
            {shareLink.isActive
              ? 'Your progress is publicly accessible via the link below'
              : 'Sharing is currently disabled'}
          </p>
        </div>
        <button
          onClick={handleToggleActive}
          disabled={updating}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            shareLink.isActive ? 'bg-green-500' : 'bg-gray-300'
          } ${updating ? 'opacity-50' : ''}`}
        >
          <span
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              shareLink.isActive ? 'left-7' : 'left-1'
            }`}
          />
        </button>
      </div>

      {/* Share URL */}
      {shareLink.isActive && (
        <div className="p-4 bg-blue-50 rounded-xl">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Share Link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-600"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            This link always shows your latest data in real-time.
          </p>
        </div>
      )}

      {/* Permissions */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <h3 className="font-medium text-gray-800 mb-3">What to Share</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={shareLink.permissions.showGraph}
              onChange={(e) =>
                handleUpdatePermissions({
                  ...shareLink.permissions,
                  showGraph: e.target.checked,
                })
              }
              disabled={updating}
              className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Activity heatmap</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={shareLink.permissions.showPhotos}
              onChange={(e) =>
                handleUpdatePermissions({
                  ...shareLink.permissions,
                  showPhotos: e.target.checked,
                })
              }
              disabled={updating}
              className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Progress photos</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={shareLink.permissions.showCompare ?? true}
              onChange={(e) =>
                handleUpdatePermissions({
                  ...shareLink.permissions,
                  showCompare: e.target.checked,
                })
              }
              disabled={updating}
              className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Before/after comparison</span>
          </label>
        </div>
      </div>

      {/* Regenerate Link */}
      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
        <div>
          <h3 className="font-medium text-gray-800">Regenerate Link</h3>
          <p className="text-sm text-gray-500">
            Create a new URL and invalidate the old one
          </p>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={updating}
          className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          Regenerate
        </button>
      </div>
    </div>
  );
}
