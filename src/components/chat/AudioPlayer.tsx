import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
  url: string;
}

export function AudioPlayer({ url }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Gerar ondas mais realistas (simulando o visual do WhatsApp)
  useEffect(() => {
    const waves = Array.from({ length: 40 }, (_, i) => {
      // Criar um padrão mais natural com variações suaves
      const baseHeight = 20 + Math.sin(i * 0.3) * 15;
      const randomVariation = (Math.random() - 0.5) * 10;
      return Math.max(8, Math.min(40, baseHeight + randomVariation));
    });
    setWaveform(waves);
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const changePlaybackRate = () => {
    const rates = [1, 1.2, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    audio.currentTime = newTime;
  };

  // Animação sutil das ondas durante a reprodução
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = 0;
    const animationSpeed = 150;

    const animate = (timestamp: number) => {
      if (!isPlaying) return;

      if (!lastTime || timestamp - lastTime > animationSpeed) {
        setWaveform(prev => {
          return prev.map((height, index) => {
            // Adiciona uma variação sutil durante a reprodução
            const variation = Math.sin(timestamp * 0.01 + index * 0.5) * 3;
            return Math.max(8, Math.min(40, height + variation));
          });
        });
        lastTime = timestamp;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying]);

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center space-x-3 p-4 rounded-2xl bg-white/90 backdrop-blur-sm border border-gray-300/50 shadow-sm max-w-sm">
      {/* Botão Play/Pause */}
      <button
        onClick={togglePlay}
        disabled={isLoading}
        className="relative flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center group disabled:opacity-50"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4 ml-0.5" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
        
        {/* Anel de progresso ao redor do botão */}
        <svg className="absolute inset-0 w-10 h-10 -rotate-90">
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
          />
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="2"
            strokeDasharray={`${2 * Math.PI * 18}`}
            strokeDashoffset={`${2 * Math.PI * 18 * (1 - progressPercentage / 100)}`}
            className="transition-all duration-300"
          />
        </svg>
      </button>

      {/* Waveform interativo */}
      <div 
        className="flex-1 flex items-center space-x-0.5 h-8 cursor-pointer px-1"
        onClick={handleWaveformClick}
      >
        {waveform.map((height, index) => {
          const isPlayed = (index / waveform.length) <= (progressPercentage / 100);
          return (
            <div
              key={index}
              className={`w-0.5 rounded-full transition-all duration-150 ${
                isPlayed 
                  ? 'bg-green-500' 
                  : 'bg-gray-300'
              } ${isPlaying && isPlayed ? 'opacity-100' : 'opacity-70'}`}
              style={{
                height: `${height}%`,
                transform: isPlaying && isPlayed ? 'scaleY(1.1)' : 'scaleY(1)',
              }}
            />
          );
        })}
      </div>

      {/* Tempo e velocidade */}
      <div className="flex flex-col items-end space-y-1">
        <span className="text-xs font-medium text-gray-600 tabular-nums">
          {formatTime(duration - currentTime)}
        </span>
        
        {/* Botão de velocidade discreto */}
        <button
          onClick={changePlaybackRate}
          className="text-[10px] font-bold text-gray-500 hover:text-green-600 transition-colors px-1.5 py-0.5 rounded-full hover:bg-gray-100"
        >
          {playbackRate}×
        </button>
      </div>

      <audio ref={audioRef} src={url} preload="metadata" />
    </div>
  );
}