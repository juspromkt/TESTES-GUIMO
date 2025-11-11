import React, { useRef } from 'react';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
        <Megaphone className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Nenhum anúncio disponível
        </p>
      </div>
    );
  }

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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Anúncios
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentIndex >= 0
                ? `${currentIndex + 1} de ${anuncios.length} • ${dealsCount} lead${dealsCount !== 1 ? 's' : ''}`
                : `${anuncios.length} anúncio${anuncios.length !== 1 ? 's' : ''} disponível${anuncios.length !== 1 ? 'is' : ''}`
              }
            </p>
          </div>
        </div>

        {currentIndex >= 0 && (
          <button
            onClick={handleClearSelection}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Ver todos
          </button>
        )}
      </div>

      {/* Carrossel horizontal */}
      <div className="relative h-[160px] flex items-center">
        {/* Seta Esquerda */}
        <button
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full shadow-md transition-all ${
            canGoPrevious
              ? 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
              : 'bg-gray-200 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed'
          }`}
          aria-label="Anúncio anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Container principal com largura fixa */}
        <div className="w-full flex items-center justify-center overflow-hidden">
          {/* Wrapper dos cards com transformação */}
          <div
            className="flex gap-2 transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(-${currentIndex * 162}px)`
            }}
          >
            {anuncios.map((anuncio, index) => {
              const isSelected = currentIndex === index;
              const distance = Math.abs(index - currentIndex);

              // Mostrar apenas 4 cards: 1 antes, o atual, e 2 depois
              const shouldShow = distance <= 2;

              return (
                <div
                  key={anuncio.Id}
                  onClick={() => onAnuncioChange(anuncio.Id)}
                  className="flex-shrink-0 cursor-pointer transition-all duration-500"
                  style={{
                    width: '160px',
                    height: '120px',
                    transform: `scale(${isSelected ? 1.05 : distance === 1 ? 0.95 : 0.85})`,
                    opacity: !shouldShow ? 0 : isSelected ? 1 : distance === 1 ? 0.7 : 0.4,
                    pointerEvents: shouldShow ? 'auto' : 'none'
                  }}
                >
                  <div
                    className={`w-full h-full overflow-hidden rounded-lg ${
                      isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg' : ''
                    }`}
                  >
                    <div className="scale-[0.417] origin-top-left" style={{ width: '384px', height: '288px' }}>
                      <AnuncioCard anuncio={anuncio} expanded={false} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Seta Direita */}
        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full shadow-md transition-all ${
            canGoNext
              ? 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
              : 'bg-gray-200 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed'
          }`}
          aria-label="Próximo anúncio"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Indicadores */}
      <div className="flex justify-center gap-1.5">
        {anuncios.map((anuncio, index) => (
          <button
            key={anuncio.Id}
            onClick={() => onAnuncioChange(anuncio.Id)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'w-8 bg-blue-600 dark:bg-blue-500'
                : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
            }`}
            aria-label={`Ir para anúncio ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
