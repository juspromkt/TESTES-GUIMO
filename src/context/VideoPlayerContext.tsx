import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Video, Minimize2, Maximize2, X } from 'lucide-react';

interface VideoLesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail?: string;
  category: string;
}

interface VideoPlayerContextType {
  selectedVideo: VideoLesson | null;
  isMinimized: boolean;
  openVideo: (video: VideoLesson) => void;
  closeVideo: () => void;
  minimizeVideo: () => void;
  maximizeVideo: () => void;
}

const VideoPlayerContext = createContext<VideoPlayerContextType | undefined>(undefined);

export const VideoPlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedVideo, setSelectedVideo] = useState<VideoLesson | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const openVideo = (video: VideoLesson) => {
    setSelectedVideo(video);
    setIsMinimized(false);
  };

  const closeVideo = () => {
    setSelectedVideo(null);
    setIsMinimized(false);
  };

  const minimizeVideo = () => {
    setIsMinimized(true);
  };

  const maximizeVideo = () => {
    setIsMinimized(false);
  };

  return (
    <VideoPlayerContext.Provider
      value={{
        selectedVideo,
        isMinimized,
        openVideo,
        closeVideo,
        minimizeVideo,
        maximizeVideo,
      }}
    >
      {children}

      {/* Modal de vídeo - Normal */}
      {selectedVideo && !isMinimized && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={closeVideo}
        >
          <div
            className="relative bg-neutral-900 dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-4xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botões de controle */}
            <div className="absolute -top-3 -right-3 z-10 flex gap-2">
              <button
                onClick={minimizeVideo}
                className="w-10 h-10 bg-white dark:bg-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 dark:text-neutral-300"
                aria-label="Minimizar"
                title="Minimizar e continuar navegando"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
              <button
                onClick={closeVideo}
                className="w-10 h-10 bg-white dark:bg-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 dark:text-neutral-300"
                aria-label="Fechar"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Container do Vídeo com proporção 16:9 */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={selectedVideo.videoUrl}
                title={selectedVideo.title}
                className="absolute top-0 left-0 w-full h-full rounded-t-xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Informações */}
            <div className="p-5 bg-white dark:bg-neutral-800 rounded-b-xl">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {selectedVideo.title}
              </h2>
              <p className="text-sm text-gray-700 dark:text-neutral-300">
                {selectedVideo.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Player minimizado - Canto inferior direito */}
      {selectedVideo && isMinimized && (
        <div className="fixed bottom-4 right-4 z-50 w-96 bg-neutral-900 dark:bg-neutral-800 rounded-xl shadow-2xl border-2 border-gray-700 dark:border-neutral-600 animate-in slide-in-from-bottom duration-300">
          {/* Header com controles */}
          <div className="flex items-center justify-between p-2 bg-neutral-800 dark:bg-neutral-900 rounded-t-xl border-b border-gray-700 dark:border-neutral-600">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Video className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span className="text-sm font-medium text-white truncate">
                {selectedVideo.title}
              </span>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={maximizeVideo}
                className="p-1.5 hover:bg-neutral-700 dark:hover:bg-neutral-700 rounded transition-colors"
                aria-label="Maximizar"
                title="Expandir vídeo"
              >
                <Maximize2 className="w-4 h-4 text-gray-300" />
              </button>
              <button
                onClick={closeVideo}
                className="p-1.5 hover:bg-neutral-700 dark:hover:bg-neutral-700 rounded transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4 text-gray-300" />
              </button>
            </div>
          </div>

          {/* Player minimizado com proporção 16:9 */}
          <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={selectedVideo.videoUrl}
              title={selectedVideo.title}
              className="absolute top-0 left-0 w-full h-full rounded-b-xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </VideoPlayerContext.Provider>
  );
};

export const useVideoPlayer = () => {
  const context = useContext(VideoPlayerContext);
  if (context === undefined) {
    throw new Error('useVideoPlayer must be used within a VideoPlayerProvider');
  }
  return context;
};
