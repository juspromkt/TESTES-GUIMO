import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Megaphone } from 'lucide-react';
import type { Anuncio } from '../../types/anuncio';
import AnuncioCard from './AnuncioCard';

interface AnuncioCarouselProps {
  anuncios: Anuncio[];
  selectedAnuncioId: number | null;
  onAnuncioChange: (anuncioId: number | null) => void;
  dealsCount?: number;
}

export default function AnuncioCarousel({
  anuncios,
  selectedAnuncioId,
  onAnuncioChange,
  dealsCount = 0
}: AnuncioCarouselProps) {
  // Encontra o índice do anúncio selecionado
  const currentIndex = selectedAnuncioId
    ? anuncios.findIndex(a => a.Id === selectedAnuncioId)
    : -1;

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onAnuncioChange(anuncios[currentIndex - 1].Id);
    } else if (currentIndex === -1 && anuncios.length > 0) {
      // Se nenhum está selecionado, vai para o último
      onAnuncioChange(anuncios[anuncios.length - 1].Id);
    }
  };

  const handleNext = () => {
    if (currentIndex < anuncios.length - 1 && currentIndex !== -1) {
      onAnuncioChange(anuncios[currentIndex + 1].Id);
    } else if (currentIndex === -1 && anuncios.length > 0) {
      // Se nenhum está selecionado, vai para o primeiro
      onAnuncioChange(anuncios[0].Id);
    }
  };

  const handleClearSelection = () => {
    onAnuncioChange(null);
  };

  if (anuncios.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-8 text-center">
        <Megaphone className="w-12 h-12 text-gray-400 dark:text-neutral-500 mx-auto mb-3" />
        <p className="text-sm text-gray-600 dark:text-neutral-400">
          Nenhum anúncio disponível
        </p>
      </div>
    );
  }

  const selectedAnuncio = currentIndex >= 0 ? anuncios[currentIndex] : null;
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < anuncios.length - 1 && currentIndex !== -1;

  return (
    <div className="space-y-4">
      {/* Header com informações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
              Anúncios
            </h3>
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              {selectedAnuncio
                ? `${currentIndex + 1} de ${anuncios.length} • ${dealsCount} lead${dealsCount !== 1 ? 's' : ''}`
                : `${anuncios.length} anúncio${anuncios.length !== 1 ? 's' : ''} disponível${anuncios.length !== 1 ? 'is' : ''}`
              }
            </p>
          </div>
        </div>

        {selectedAnuncio && (
          <button
            onClick={handleClearSelection}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            Ver todos
          </button>
        )}
      </div>

      {/* Carrossel */}
      {selectedAnuncio ? (
        <div className="relative">
          {/* Seta Esquerda */}
          <button
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full shadow-lg transition-all ${
              canGoPrevious
                ? 'bg-white dark:bg-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-600 text-gray-900 dark:text-neutral-100'
                : 'bg-gray-200 dark:bg-neutral-800 text-gray-400 dark:text-neutral-600 cursor-not-allowed'
            }`}
            aria-label="Anúncio anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Card do Anúncio */}
          <div className="px-12">
            <AnuncioCard anuncio={selectedAnuncio} expanded={false} />
          </div>

          {/* Seta Direita */}
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full shadow-lg transition-all ${
              canGoNext
                ? 'bg-white dark:bg-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-600 text-gray-900 dark:text-neutral-100'
                : 'bg-gray-200 dark:bg-neutral-800 text-gray-400 dark:text-neutral-600 cursor-not-allowed'
            }`}
            aria-label="Próximo anúncio"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Indicadores */}
          <div className="flex justify-center gap-1.5 mt-4">
            {anuncios.map((anuncio, index) => (
              <button
                key={anuncio.Id}
                onClick={() => onAnuncioChange(anuncio.Id)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-blue-600 dark:bg-blue-500'
                    : 'w-2 bg-gray-300 dark:bg-neutral-600 hover:bg-gray-400 dark:hover:bg-neutral-500'
                }`}
                aria-label={`Ir para anúncio ${index + 1}`}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-xl p-8 text-center">
          <Megaphone className="w-12 h-12 text-blue-400 dark:text-blue-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900 dark:text-neutral-100 mb-1">
            Selecione um anúncio
          </p>
          <p className="text-xs text-gray-600 dark:text-neutral-400 mb-4">
            Use as setas ou clique nos indicadores para navegar
          </p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => onAnuncioChange(anuncios[0].Id)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Ver primeiro anúncio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
