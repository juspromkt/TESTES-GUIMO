import React from 'react';
import { X } from 'lucide-react';

interface MediaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  type: 'pdf' | 'image' | 'video';
  name?: string;
}

export default function MediaViewerModal({ isOpen, onClose, url, type, name }: MediaViewerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-[90vw] h-[90vh] bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {name || 'Visualizar Mídia'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
          {type === 'pdf' && (
            <iframe
              src={url}
              className="w-full h-full border-0 rounded-lg bg-white"
              title={name || 'PDF Viewer'}
            />
          )}
          {type === 'image' && (
            <img
              src={url}
              alt={name || 'Image'}
              className="max-w-full max-h-full object-contain"
            />
          )}
          {type === 'video' && (
            <video
              src={url}
              controls
              className="max-w-full max-h-full"
            />
          )}
        </div>
      </div>
    </div>
  );
}
