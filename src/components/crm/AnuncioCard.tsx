import React from 'react';
import { Play, Image as ImageIcon, Video, ExternalLink } from 'lucide-react';
import type { Anuncio } from '../../types/anuncio';

interface AnuncioCardProps {
  anuncio: Anuncio;
  expanded?: boolean;
}

export default function AnuncioCard({ anuncio, expanded = false }: AnuncioCardProps) {
  const hasMedia = anuncio.mediaUrl || anuncio.thumbnailUrl;

  // Prioriza thumbnailUrl se for uma URL pública do Facebook Ads, senão usa mediaUrl
  const imageUrl =
    anuncio.thumbnailUrl && anuncio.thumbnailUrl.includes("facebook.com/ads/image")
      ? anuncio.thumbnailUrl
      : anuncio.mediaUrl || anuncio.thumbnailUrl;

  console.log('🖼️ Anúncio:', anuncio.title, '→', imageUrl);



  if (expanded) {
    return (
      <div className="border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-md hover:shadow-lg transition-all">
        {/* Imagem/Vídeo grande */}
        <div className="w-full h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
          {hasMedia ? (
            <>
              {anuncio.mediaType === 'IMAGE' && imageUrl && (
                <>
                  <img
                    src={imageUrl}
                    alt={anuncio.title}
                    className="w-full h-full object-cover"
                    loading="eager"
                    crossOrigin="anonymous"
                    onLoad={() => {
                      console.log('Imagem carregada:', imageUrl);
                    }}
                    onError={(e) => {
                      console.error('Erro ao carregar imagem:', imageUrl);
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && parent.querySelector('img') === target) {
                        const fallback = document.createElement('div');
                        fallback.className = 'flex flex-col items-center justify-center w-full h-full text-gray-400 dark:text-gray-500';
                        fallback.innerHTML = `
                          <svg class="w-16 h-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span class="text-sm">Imagem não disponível</span>
                        `;
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </>
              )}

              {anuncio.mediaType === 'VIDEO' && (
                <a
                  href={anuncio.mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-full h-full flex items-center justify-center group"
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={anuncio.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                      <Video className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-white/95 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <Play className="w-10 h-10 text-gray-800 ml-1" fill="currentColor" />
                    </div>
                  </div>
                </a>
              )}
            </>
          ) : (
            <ImageIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
          )}

          {/* Badge do tipo */}
          <div className="absolute top-3 right-3">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${
              anuncio.mediaType === 'VIDEO'
                ? 'bg-purple-500 text-white'
                : 'bg-blue-500 text-white'
            }`}>
              {anuncio.mediaType === 'VIDEO' ? 'Vídeo' : 'Imagem'}
            </span>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {anuncio.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
            {anuncio.body || 'Sem descrição'}
          </p>

          {anuncio.mediaUrl && (
            <a
              href={anuncio.mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Ver no Facebook
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    );
  }

  // Versão compacta (para preview)
  return (
    <div className="flex flex-col max-w-sm border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-md hover:shadow-lg transition-all">
      {/* Imagem/Vídeo */}
      <div className="w-full h-48 flex items-center justify-center bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
        {hasMedia ? (
          <>
            {anuncio.mediaType === 'IMAGE' && imageUrl && (
              <img
                src={imageUrl}
                alt={anuncio.title}
                className="w-full h-full object-cover"
                loading="eager"
                crossOrigin="anonymous"
                onLoad={() => {
                  console.log('Imagem carregada (compact):', imageUrl);
                }}
                onError={(e) => {
                  console.error('Erro ao carregar imagem (compact):', imageUrl);
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent && !parent.querySelector('.fallback-icon')) {
                    const fallback = document.createElement('div');
                    fallback.className = 'fallback-icon flex flex-col items-center justify-center w-full h-full text-gray-400 dark:text-gray-500';
                    fallback.innerHTML = `
                      <svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span class="text-xs mt-1">Imagem não disponível</span>
                    `;
                    parent.appendChild(fallback);
                  }
                }}
              />
            )}

            {anuncio.mediaType === 'VIDEO' && (
              <a
                href={anuncio.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative w-full h-full flex items-center justify-center group"
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={anuncio.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    <Video className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-gray-800 ml-1" fill="currentColor" />
                  </div>
                </div>
              </a>
            )}
          </>
        ) : (
          <ImageIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
        )}

        {/* Badge do tipo */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-bold shadow-lg ${
            anuncio.mediaType === 'VIDEO'
              ? 'bg-purple-500 text-white'
              : 'bg-blue-500 text-white'
          }`}>
            {anuncio.mediaType === 'VIDEO' ? 'Vídeo' : 'Imagem'}
          </span>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4 flex flex-col gap-3">
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">
            {anuncio.title}
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
            {anuncio.body || 'Sem descrição'}
          </p>
        </div>

        {anuncio.mediaUrl && (
          <a
            href={anuncio.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Ver no Facebook
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
