import {
  MessageCircle,
  Calendar,
  Video,
  ArrowRight,
  Sparkles,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Suporte() {
  const navigate = useNavigate();

  // Ações rápidas
  const quickActions = [
    {
      id: 'whatsapp',
      title: 'Suporte WhatsApp',
      description: 'Atendimento direto e rápido',
      icon: MessageCircle,
      gradient: 'from-green-500 to-emerald-600',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
      action: () => window.open('https://wa.me/553892590370', '_blank'),
      badge: 'Online',
      badgeColor: 'bg-green-500',
    },
    {
      id: 'schedule',
      title: 'Agendar Reunião',
      description: 'Converse com um especialista',
      icon: Calendar,
      gradient: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      action: () => window.open('https://calendar.app.google/hjk3zTYQrCZmvZRi9', '_blank'),
      badge: 'Disponível',
      badgeColor: 'bg-blue-500',
    },
    {
      id: 'tutorials',
      title: 'Tutoriais em Vídeo',
      description: 'Aprenda passo a passo',
      icon: Video,
      gradient: 'from-purple-500 to-pink-600',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      action: () => navigate('/tutorial-interno'),
      badge: 'Novo',
      badgeColor: 'bg-purple-500',
    },
    {
      id: 'articles',
      title: 'Artigos e Guias',
      description: 'Base de conhecimento completa',
      icon: BookOpen,
      gradient: 'from-orange-500 to-red-600',
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
      action: () => navigate('/tutorial-interno/artigos'),
      badge: 'Útil',
      badgeColor: 'bg-orange-500',
    },
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 transition-theme">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* Header Compacto */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
              Central de Suporte
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 dark:from-purple-400 dark:via-pink-400 dark:to-orange-400 bg-clip-text text-transparent">
              Como podemos ajudar?
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Encontre respostas rápidas e fale diretamente com nossa equipe
          </p>
        </div>

        {/* Layout em 2 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Coluna da Esquerda - Cards de Ação (2 colunas no lg) */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <div
                key={action.id}
                onClick={action.action}
                className="group relative bg-white dark:bg-neutral-800 rounded-xl p-5 cursor-pointer overflow-hidden border border-gray-200 dark:border-neutral-700 hover:border-transparent transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
              >
                {/* Background Gradient on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Badge e Ícone na mesma linha */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${action.badgeColor} animate-pulse`}></div>
                      <span className="text-xs font-semibold text-gray-600 dark:text-neutral-400 group-hover:text-white transition-colors">
                        {action.badge}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-all group-hover:translate-x-1" />
                  </div>

                  {/* Icon */}
                  <div className={`${action.iconBg} w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:bg-white/20 transition-colors`}>
                    <action.icon className={`w-6 h-6 ${action.iconColor} group-hover:text-white transition-colors`} />
                  </div>

                  {/* Text */}
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-white transition-colors mb-1">
                    {action.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-neutral-400 group-hover:text-white/90 transition-colors">
                    {action.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Coluna da Direita - CTA Grupo de Avisos (1 coluna no lg) */}
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 rounded-xl p-6 text-center flex flex-col justify-between">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full mb-3">
                <MessageCircle className="w-3.5 h-3.5 text-white" />
                <span className="text-xs font-semibold text-white">Exclusivo</span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">
                Grupo de Avisos
              </h2>
              <p className="text-sm text-white/90 mb-4">
                Receba todas as atualizações e novidades em primeira mão
              </p>
            </div>

            <button
              onClick={() => window.open('https://chat.whatsapp.com/FqKrpy3oO4hGwKdiAflnJ8', '_blank')}
              className="relative z-10 inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-gray-100 transition-all hover:scale-105 shadow-xl"
            >
              <MessageCircle className="w-4 h-4" />
              Entrar no Grupo
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
