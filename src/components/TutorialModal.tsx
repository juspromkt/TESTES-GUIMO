import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, BookOpen, ExternalLink, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import iconDarkMode from '../imgs/guimoo/icon-dark-mode.png';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
}

const VideoModal = ({ isOpen, onClose, videoUrl, title }: VideoModalProps) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[10002] animate-fadeIn">
      <div className="bg-neutral-900 rounded-2xl shadow-2xl w-[90vw] h-[80vh] overflow-hidden border border-gray-700 transition-theme relative flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 text-gray-400 hover:text-gray-200 hover:bg-neutral-800/80 rounded-xl transition-all z-10 backdrop-blur-sm border border-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Video Title */}
        <div className="bg-gradient-to-r from-orange-500 to-purple-600 px-6 py-3 flex-shrink-0">
          <h3 className="text-white font-bold text-lg">{title}</h3>
        </div>

        {/* Video Container */}
        <div className="flex-1 bg-black">
          <iframe
            src={videoUrl}
            title={title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>,
    document.body
  );
};

export default function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const navigate = useNavigate();
  const [videoModal, setVideoModal] = useState<{ isOpen: boolean; videoUrl: string; title: string }>({
    isOpen: false,
    videoUrl: '',
    title: ''
  });

  if (!isOpen) return null;

  const tutorials = [
    {
      title: "Como usar a aba de Conversas",
      description: "Aprenda a gerenciar suas conversas, buscar mensagens e organizar seus contatos",
      videoUrl: "https://www.youtube.com/embed/zJ5uU6T7mXU",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Controle de IA",
      description: "Configure e personalize seu agente de IA para automatizar respostas",
      videoUrl: "https://www.youtube.com/embed/2dmfLEFO_M4",
      color: "from-purple-500 to-purple-600"
    }
  ];

  const handleVideoClick = (videoUrl: string, title: string) => {
    setVideoModal({ isOpen: true, videoUrl, title });
  };

  const handleMoreTutorials = () => {
    onClose();
    navigate('/tutorial-interno');
  };

  return (
    <>
      {createPortal(
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-8 z-[10001] animate-fadeIn">
          <div
            className="bg-gradient-to-br from-white via-white to-purple-50/50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[1400px] overflow-y-auto max-h-[95vh] sm:max-h-none sm:aspect-video sm:overflow-hidden border border-purple-300/50 dark:border-purple-600/50 transition-theme relative"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 sm:top-5 sm:right-5 p-2.5 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-white/80 dark:hover:bg-neutral-800/80 rounded-xl transition-all z-10 backdrop-blur-sm border border-gray-200 dark:border-neutral-700"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content - Layout Horizontal 16:9 */}
            <div className="relative z-10 h-full flex flex-col sm:flex-row items-stretch">
              {/* Coluna Esquerda - Header e Vídeos */}
              <div className="flex-1 p-6 sm:p-10 flex flex-col justify-center">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3">
                    <img
                      src={iconDarkMode}
                      alt="Guimoo"
                      className="w-10 h-10 sm:w-14 sm:h-14 flex-shrink-0"
                    />
                    <h2 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent leading-tight">
                      Tutoriais para você começar
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-neutral-300 font-medium leading-relaxed">
                    Aprenda a usar a Guimoo com nossos vídeos tutoriais rápidos e práticos
                  </p>
                </div>

                {/* Tutorials Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  {tutorials.map((tutorial, index) => (
                    <button
                      key={index}
                      onClick={() => handleVideoClick(tutorial.videoUrl, tutorial.title)}
                      className="group bg-white dark:bg-neutral-800 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-300 dark:border-neutral-600 hover:border-purple-400 dark:hover:border-purple-500 transition-all hover:shadow-lg text-left"
                    >
                      <div className="flex items-start gap-2.5 sm:gap-3">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${tutorial.color} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
                          <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-neutral-100 mb-1 leading-tight">
                            {tutorial.title}
                          </h3>
                          <p className="text-[11px] sm:text-xs text-gray-600 dark:text-neutral-300 leading-relaxed">
                            {tutorial.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Footer Note */}
                <p className="text-xs sm:text-sm text-gray-600 dark:text-neutral-400 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
                  Assista aos vídeos e aproveite todos os recursos da plataforma!
                </p>
              </div>

              {/* Coluna Direita - Dicas e CTA */}
              <div className="w-full sm:w-[440px] bg-gradient-to-br from-purple-50/80 to-blue-50/80 dark:from-neutral-800/80 dark:to-neutral-800/80 backdrop-blur-sm border-t sm:border-t-0 sm:border-l border-gray-200 dark:border-neutral-700 p-6 sm:p-10 flex flex-col justify-center">
                {/* Tips */}
                <div className="mb-6 sm:mb-8">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-neutral-100 mb-4 sm:mb-5 flex items-center gap-2">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                    Dicas rápidas:
                  </h3>
                  <ul className="space-y-2.5 sm:space-y-3">
                    {[
                      "Use o campo de busca para encontrar conversas rapidamente",
                      "Ative a IA para automatizar respostas aos seus clientes",
                      "Configure movimentações automáticas para organizar leads",
                      "Integre com seu CRM para gerenciar negociações"
                    ].map((tip, index) => (
                      <li key={index} className="flex items-start gap-2.5 sm:gap-3 text-xs sm:text-sm text-gray-800 dark:text-neutral-200 font-medium leading-relaxed">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400 flex-shrink-0 mt-2" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={onClose}
                    className="w-full px-6 py-3.5 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group"
                  >
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                    Ir para Conversas
                  </button>

                  <button
                    onClick={handleMoreTutorials}
                    className="w-full px-6 py-2.5 sm:py-3 bg-white dark:bg-neutral-800 border-2 border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-neutral-700 font-semibold text-sm sm:text-base rounded-xl transition-all flex items-center justify-center gap-3 group"
                  >
                    <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                    Ver Todos os Tutoriais
                  </button>
                </div>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
            .animate-fadeIn {
              animation: fadeIn 0.3s ease-out;
            }
          `}</style>
        </div>,
        document.body
      )}

      <VideoModal
        isOpen={videoModal.isOpen}
        onClose={() => setVideoModal({ ...videoModal, isOpen: false })}
        videoUrl={videoModal.videoUrl}
        title={videoModal.title}
      />
    </>
  );
}
