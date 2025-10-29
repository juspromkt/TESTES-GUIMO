import React from 'react';
import { createPortal } from 'react-dom';
import { X, PlayCircle, MessageCircle, Calendar, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  const slides = [
    {
      title: "Grupo de Avisos",
      description: "Entre no nosso grupo do WhatsApp e fique por dentro de todas as atualizações, novidades e dicas exclusivas em primeira mão!",
      icon: "📢",
      badge: "Recomendado",
      badgeIcon: Bell,
      gradient: "from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700",
      buttonText: "Entrar no Grupo",
      buttonIcon: MessageCircle,
      buttonColor: "bg-white hover:bg-orange-50 text-orange-600"
    },
    {
      title: "Próxima Super Atualização",
      description: "Em breve: Sistema de Multi-Agentes! Você poderá criar e gerenciar vários agentes de IA no sistema, cada um com sua própria personalidade e função.",
      icon: "🚀",
      badge: "Novidade",
      badgeIcon: Bell,
      gradient: "from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700",
      buttonText: "Saiba Mais",
      buttonIcon: MessageCircle,
      buttonColor: "bg-white hover:bg-purple-50 text-purple-600"
    },
    {
      title: "Fique por Dentro",
      description: "Receba em primeira mão todas as novidades, melhorias e recursos exclusivos que vão transformar sua experiência com o sistema!",
      icon: "✨",
      badge: "Exclusivo",
      badgeIcon: Bell,
      gradient: "from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700",
      buttonText: "Participar Agora",
      buttonIcon: MessageCircle,
      buttonColor: "bg-white hover:bg-blue-50 text-blue-600"
    }
  ];

  // Auto-rotate slides
  React.useEffect(() => {
    if (!isPaused && isOpen) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000); // Troca a cada 5 segundos

      return () => clearInterval(interval);
    }
  }, [isPaused, isOpen, slides.length]);

  if (!isOpen) return null;

  const handleTutorialsClick = () => {
    onClose();
    navigate('/tutorial-interno');
  };

  const handleSupportClick = () => {
    window.open('https://wa.me/553892590370', '_blank');
  };

  const handleScheduleClick = () => {
    window.open('https://calendar.app.google/hjk3zTYQrCZmvZRi9', '_blank');
  };

  const handleGroupClick = () => {
    window.open('https://chat.whatsapp.com/FqKrpy3oO4hGwKdiAflnJ8', '_blank');
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-6 z-[10000] animate-fadeIn"
    >
      <div
        className="bg-gradient-to-br from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-800 rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden border border-gray-200/50 dark:border-neutral-700/50 transition-theme"
        style={{ aspectRatio: '16/9' }}
      >
        <div className="relative h-full flex flex-col">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-white/50 dark:hover:bg-neutral-800/50 rounded-xl transition-all z-10 backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="flex-1 flex flex-col px-16 py-10">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 dark:from-orange-400 dark:to-purple-400 bg-clip-text text-transparent mb-3">
                Bem-vindo à Guimoo!
              </h1>
              <p className="text-lg text-gray-600 dark:text-neutral-400">
                Tudo que você precisa para começar
              </p>
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 grid grid-cols-2 gap-6">
              {/* Left Column - Featured Carousel */}
              <div
                className={`relative group overflow-hidden rounded-2xl bg-gradient-to-br ${slides[currentSlide].gradient} p-8 flex flex-col justify-between shadow-xl hover:shadow-2xl transition-all duration-700 hover:scale-[1.02] cursor-pointer border-2 border-white/20`}
                onClick={handleGroupClick}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                {/* Background decorations */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 transition-all duration-700"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24 transition-all duration-700"></div>

                {/* Content that changes */}
                <div className="relative z-10 flex-1">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium mb-6 transition-all duration-700">
                    {React.createElement(slides[currentSlide].badgeIcon, { className: "w-3.5 h-3.5" })}
                    {slides[currentSlide].badge}
                  </div>

                  {/* Carousel Content */}
                  <div className="relative h-40">
                    {slides.map((slide, index) => (
                      <div
                        key={index}
                        className={`absolute inset-0 transition-all duration-700 ${
                          index === currentSlide
                            ? 'opacity-100 translate-x-0'
                            : index < currentSlide
                              ? 'opacity-0 -translate-x-8'
                              : 'opacity-0 translate-x-8'
                        }`}
                      >
                        <div className="flex items-start gap-3 mb-4">
                          <span className="text-4xl">{slide.icon}</span>
                          <h2 className="text-3xl font-bold text-white leading-tight">
                            {slide.title}
                          </h2>
                        </div>
                        <p className="text-white/90 text-base leading-relaxed">
                          {slide.description}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Slide Indicators */}
                  <div className="flex gap-2 mt-4">
                    {slides.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentSlide(index);
                        }}
                        className={`h-1.5 rounded-full transition-all ${
                          index === currentSlide
                            ? 'w-8 bg-white'
                            : 'w-1.5 bg-white/40 hover:bg-white/60'
                        }`}
                        aria-label={`Ir para slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Button that changes */}
                <button className={`relative z-10 mt-6 px-6 py-3.5 ${slides[currentSlide].buttonColor} font-semibold rounded-xl transition-all duration-700 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group-hover:scale-105`}>
                  {React.createElement(slides[currentSlide].buttonIcon, { className: "w-5 h-5" })}
                  {slides[currentSlide].buttonText}
                </button>
              </div>

              {/* Right Column - 3 Cards */}
              <div className="grid grid-rows-3 gap-4">
                {/* Tutoriais */}
                <div className="group bg-white dark:bg-neutral-800 rounded-xl p-5 border border-gray-200 dark:border-neutral-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all hover:shadow-lg flex items-center gap-4 cursor-pointer"
                     onClick={handleTutorialsClick}>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <PlayCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">
                      Tutoriais em Vídeo
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-neutral-400">
                      Aprenda a usar todas as funcionalidades
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Suporte */}
                <div className="group bg-white dark:bg-neutral-800 rounded-xl p-5 border border-gray-200 dark:border-neutral-700 hover:border-green-300 dark:hover:border-green-600 transition-all hover:shadow-lg flex items-center gap-4 cursor-pointer"
                     onClick={handleSupportClick}>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <MessageCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">
                      Suporte WhatsApp
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-neutral-400">
                      Tire suas dúvidas com nossa equipe
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Agendar */}
                <div className="group bg-white dark:bg-neutral-800 rounded-xl p-5 border border-gray-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all hover:shadow-lg flex items-center gap-4 cursor-pointer"
                     onClick={handleScheduleClick}>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">
                      Agendar Reunião
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-neutral-400">
                      Marque um horário com nosso time
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-6">
              <button
                onClick={onClose}
                className="text-sm text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors"
              >
                Continuar sem selecionar
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
  );
}
