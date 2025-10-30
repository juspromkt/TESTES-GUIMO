import React from 'react';
import { X, ExternalLink, Play, Video, Image as ImageIcon, TrendingUp, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Anuncio } from '../../types/anuncio';
import type { Deal } from '../../types/deal';
import type { Funil } from '../../types/funil';

interface AnuncioModalProps {
  anuncio: Anuncio;
  deals: Deal[];
  funil: Funil | null;
  onClose: () => void;
  onSelectAnuncio: (anuncioId: number) => void;
  allAnuncios?: Anuncio[];
  onNavigate?: (anuncio: Anuncio) => void;
}

export default function AnuncioModal({ anuncio, deals, funil, onClose, onSelectAnuncio, allAnuncios = [], onNavigate }: AnuncioModalProps) {
  // Filtra deals deste anúncio
  const anuncioDeals = deals.filter(deal => deal.id_anuncio === anuncio.Id);

  // Agrupa deals por estágio
  const dealsByStage = funil?.estagios?.map(estagio => ({
    estagio,
    count: anuncioDeals.filter(deal => deal.id_estagio === parseInt(estagio.Id)).length
  })) || [];

  const hasMedia = anuncio.mediaUrl || anuncio.thumbnailUrl;
  const imageUrl =
    anuncio.thumbnailUrl && anuncio.thumbnailUrl.includes("facebook.com/ads/image")
      ? anuncio.thumbnailUrl
      : anuncio.mediaUrl || anuncio.thumbnailUrl;

  // Encontra o índice atual e calcula anterior/próximo
  const currentIndex = allAnuncios.findIndex(a => a.Id === anuncio.Id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allAnuncios.length - 1;

  const handlePrevious = () => {
    if (hasPrevious && onNavigate) {
      onNavigate(allAnuncios[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext && onNavigate) {
      onNavigate(allAnuncios[currentIndex + 1]);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[10000] p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 rounded-3xl shadow-2xl w-full max-w-6xl h-[92vh] overflow-hidden border border-gray-200/50 dark:border-neutral-700/50 animate-in zoom-in-95 duration-300 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Minimalista */}
        <div className="relative p-8 pb-6">
          {/* Botão de fechar */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-all hover:rotate-90 duration-300"
          >
            <X className="w-5 h-5 text-gray-400 dark:text-neutral-500" />
          </button>

          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-100 mb-1">
                  {anuncio.title}
                </h2>
                <p className="text-sm text-gray-500 dark:text-neutral-400 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {anuncioDeals.length} negociação{anuncioDeals.length !== 1 ? 'ões' : ''}
                  </span>
                </p>
              </div>
            </div>

            {/* Botões de navegação */}
            {allAnuncios.length > 1 && (
              <div className="flex items-center gap-3 pl-16">
                <button
                  onClick={handlePrevious}
                  disabled={!hasPrevious}
                  className={`p-2 rounded-lg transition-all ${
                    hasPrevious
                      ? 'bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300'
                      : 'bg-gray-100/50 dark:bg-neutral-800/50 text-gray-300 dark:text-neutral-600 cursor-not-allowed'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium text-gray-600 dark:text-neutral-400 min-w-[60px] text-center">
                  {currentIndex + 1} / {allAnuncios.length}
                </span>
                <button
                  onClick={handleNext}
                  disabled={!hasNext}
                  className={`p-2 rounded-lg transition-all ${
                    hasNext
                      ? 'bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300'
                      : 'bg-gray-100/50 dark:bg-neutral-800/50 text-gray-300 dark:text-neutral-600 cursor-not-allowed'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 px-8 pb-8 overflow-hidden">
          {/* Coluna Esquerda - Mídia */}
          <div className="flex flex-col space-y-5 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {/* Preview da Mídia */}
            <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-50 dark:from-neutral-800 dark:to-neutral-700 rounded-2xl overflow-hidden relative shadow-inner">
              {hasMedia ? (
                <>
                  {anuncio.mediaType === 'IMAGE' && imageUrl && (
                    <img
                      src={imageUrl}
                      alt={anuncio.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
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
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-100 dark:from-neutral-700 dark:to-neutral-600 flex items-center justify-center">
                          <Video className="w-20 h-20 text-gray-300 dark:text-neutral-500" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent group-hover:from-black/50 group-hover:via-black/30 transition-all flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                          <Play className="w-10 h-10 text-gray-800 ml-1" fill="currentColor" />
                        </div>
                      </div>
                    </a>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-20 h-20 text-gray-300 dark:text-neutral-600" />
                </div>
              )}

              {/* Badge do tipo */}
              <div className="absolute top-4 right-4">
                <span className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xl backdrop-blur-sm ${
                  anuncio.mediaType === 'VIDEO'
                    ? 'bg-purple-500/90 text-white'
                    : 'bg-blue-500/90 text-white'
                }`}>
                  {anuncio.mediaType === 'VIDEO' ? 'Vídeo' : 'Imagem'}
                </span>
              </div>
            </div>

            {/* Descrição */}
            <div className="bg-gradient-to-br from-gray-50 to-white dark:from-neutral-800/50 dark:to-neutral-900/50 rounded-2xl p-5 border border-gray-100 dark:border-neutral-700/50">
              <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">
                {anuncio.body || 'Sem descrição'}
              </p>
            </div>

            {/* Botões */}
            <div className="space-y-2.5">
              {anuncio.mediaUrl && (
                <a
                  href={anuncio.mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  Ver no Facebook
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              <button
                onClick={() => {
                  onSelectAnuncio(anuncio.Id);
                  onClose();
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                <Users className="w-4 h-4" />
                Filtrar negociações deste anúncio
              </button>
            </div>
          </div>

          {/* Coluna Direita - Estatísticas */}
          <div className="flex flex-col overflow-hidden">
            {/* Card de Total */}
            <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30 border-2 border-blue-100 dark:border-blue-800/50 rounded-2xl p-5 shadow-lg mb-5 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-neutral-400 mb-2">
                    Total de Negociações
                  </p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {anuncioDeals.length}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3.5 rounded-2xl shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Título da seção */}
            <div className="flex items-center gap-3 py-2 mb-3 flex-shrink-0">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-neutral-600 to-transparent" />
              <span className="text-xs font-bold text-gray-500 dark:text-neutral-400 tracking-wider uppercase">
                Por Etapa do Funil
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-neutral-600 to-transparent" />
            </div>

            {/* Lista de Etapas - com scroll */}
            <div className="flex-1 overflow-y-auto space-y-3 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {dealsByStage.length > 0 ? (
                dealsByStage.map(({ estagio, count }) => {
                  const percentage = anuncioDeals.length > 0
                    ? Math.round((count / anuncioDeals.length) * 100)
                    : 0;

                  return (
                    <div
                      key={estagio.Id}
                      className="bg-white dark:bg-neutral-800/50 backdrop-blur-sm border border-gray-200 dark:border-neutral-700/50 rounded-xl p-4 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700/50 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-900 dark:text-neutral-100">
                          {estagio.nome}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold px-2 py-1 rounded-lg bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-neutral-400">
                            {percentage}%
                          </span>
                          <span className="text-xl font-bold text-gray-900 dark:text-neutral-100">
                            {count}
                          </span>
                        </div>
                      </div>
                      {/* Barra de progresso */}
                      <div className="w-full bg-gray-100 dark:bg-neutral-700 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 h-2.5 rounded-full transition-all duration-700 ease-out shadow-sm"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-gray-400 dark:text-neutral-500">
                  <p className="text-sm font-medium">Nenhuma etapa configurada no funil</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
