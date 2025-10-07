import React from 'react';
import { Play } from 'lucide-react';
import type { Anuncio } from '../../types/anuncio';

interface AnuncioCardProps {
  anuncio: Anuncio;
}

export default function AnuncioCard({ anuncio }: AnuncioCardProps) {
  return (
    <div className="flex max-w-md border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Imagem */}
      <div className="w-32 h-24 flex items-center justify-center bg-gray-100">
        {anuncio.mediaType === 'IMAGE' && (
          <img
            src={anuncio.mediaUrl || anuncio.thumbnailUrl}
            alt={anuncio.title}
            className="w-full h-full object-contain"
          />
        )}

        {anuncio.mediaType === 'VIDEO' && (
          <a
            href={anuncio.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative w-full h-full flex items-center justify-center"
          >
            <img
              src={anuncio.thumbnailUrl || anuncio.mediaUrl}
              alt={anuncio.title}
              className="w-full h-full object-contain"
            />
            <Play className="w-6 h-6 text-white absolute drop-shadow" />
          </a>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex flex-col justify-center px-4 py-2 flex-1 overflow-hidden">
        <div className="text-sm font-semibold text-gray-900 truncate">{anuncio.title}</div>
        <div className="text-xs text-gray-600 whitespace-pre-line mt-1 overflow-hidden text-ellipsis">
          {anuncio.body && anuncio.body.length > 100
            ? anuncio.body.slice(0, 100) + '...'
            : anuncio.body || ''}
        </div>
      </div>
    </div>
  );
}
