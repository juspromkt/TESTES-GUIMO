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

  // Gerar ondas estilo WhatsApp Web
  useEffect(() => {
    const waves = Array.from({ length: 40 }, (_, i) => {
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
    const rates = [1, 1.5, 2];
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
    audio.currentTime = percentage * duration;
  };

  // Animação das ondas durante reprodução
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = 0;
    const animationSpeed = 150;

    const animate = (timestamp: number) => {
      if (!isPlaying) return;

      if (!lastTime || timestamp - lastTime > animationSpeed) {
        setWaveform(prev =>
          prev.map((height, index) => {
            const variation = Math.sin(timestamp * 0.01 + index * 0.5) * 3;
            return Math.max(8, Math.min(40, height + variation));
          })
        );
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
    <div className="flex items-center gap-2 py-1.5 max-w-[280px] min-w-[200px]">
      <audio ref={audioRef} src={url} preload="metadata" />

      {/* Botão Play/Pause - estilo WhatsApp */}
      <button
        onClick={togglePlay}
        disabled={isLoading}
        className="flex-shrink-0 w-11 h-11 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all duration-200 flex items-center justify-center disabled:opacity-50"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-gray-700 border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-5 h-5" fill="currentColor" />
        ) : (
          <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
        )}
      </button>

      {/* Waveform interativo - estilo WhatsApp */}
      <div className="flex-1 flex flex-col justify-center">
        <div
          className="flex items-center justify-start gap-[2px] h-[30px] cursor-pointer"
          onClick={handleWaveformClick}
        >
          {waveform.map((height, index) => {
            const isPlayed = (index / waveform.length) <= (progressPercentage / 100);
            return (
              <div
                key={index}
                className={`w-[3px] rounded-full transition-colors duration-100 ${
                  isPlayed ? 'bg-gray-600' : 'bg-gray-300'
                }`}
                style={{
                  height: `${height}%`,
                  minHeight: '3px'
                }}
              />
            );
          })}
        </div>

        {/* Tempo */}
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[11px] font-normal text-gray-600 tabular-nums">
            {formatTime(duration - currentTime)}
          </span>
        </div>
      </div>

      {/* Botão velocidade sempre visível mas discreto */}
      <button
        onClick={changePlaybackRate}
        className="flex-shrink-0 text-[11px] font-medium text-gray-500 hover:text-gray-700 transition-colors px-1.5 py-1 rounded"
        title="Velocidade de reprodução"
      >
        {playbackRate}×
      </button>
    </div>
  );
}
