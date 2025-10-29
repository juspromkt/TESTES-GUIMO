import React from 'react';
import { createPortal } from 'react-dom';
import { X, Crown, Check, Zap, Shield, Sparkles, MessageCircle, Users, TrendingUp, Headphones, Star } from 'lucide-react';
import logoReduzida from '../imgs/guimoo/logo-reduzida.png';
import logoDarkMode from '../imgs/guimoo/logo-dark-mode.png';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  if (!isOpen) return null;

  const handleUpgradeClick = () => {
    window.open('https://wa.me/556281363050', '_blank');
  };

  const benefits = [
    {
      icon: Users,
      title: "Acesso Ilimitado",
      description: "Use todos os módulos sem restrições — CRM, Conversas, IA, Funis e muito mais",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Zap,
      title: "Performance Premium",
      description: "Respostas de IA mais rápidas e priorização nos servidores da Guimoo",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: Headphones,
      title: "Suporte Prioritário",
      description: "Atendimento direto com o time da Guimoo via WhatsApp, 7 dias por semana",
      color: "from-amber-600 to-amber-700"
    },
    {
      icon: Star,
      title: "Recursos Exclusivos",
      description: "Acesso antecipado a novos recursos, testes beta e ferramentas em lançamento",
      color: "from-green-500 to-green-600"
    }
  ];

  return createPortal(
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-8 z-[10001] animate-fadeIn">
      <div
        className="bg-gradient-to-br from-white via-white to-orange-50/50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900 rounded-3xl shadow-2xl w-full max-w-[1400px] aspect-video overflow-hidden border border-orange-300/50 dark:border-orange-600/50 transition-theme relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-orange-500/20 to-purple-500/20 rounded-full blur-3xl"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2.5 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-white/80 dark:hover:bg-neutral-800/80 rounded-xl transition-all z-10 backdrop-blur-sm border border-gray-200 dark:border-neutral-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content - Layout Horizontal 16:9 */}
        <div className="relative z-10 h-full flex items-stretch">
          {/* Coluna Esquerda - Header e Benefícios */}
          <div className="flex-1 p-10 flex flex-col justify-center">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-3">
                <img
                  src={logoReduzida}
                  alt="Guimoo"
                  className="w-14 h-14 flex-shrink-0 dark:hidden"
                />
                <img
                  src={logoDarkMode}
                  alt="Guimoo"
                  className="w-14 h-14 flex-shrink-0 hidden dark:block"
                />
                <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 dark:from-orange-400 dark:to-purple-400 bg-clip-text text-transparent leading-tight">
                  Desbloqueie Todo o Potencial da Guimoo
                </h2>
              </div>
              <p className="text-base text-gray-700 dark:text-neutral-300 font-medium leading-relaxed">
                Transforme sua demonstração em uma experiência completa com todos os recursos ativos
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="group bg-white dark:bg-neutral-800 backdrop-blur-sm rounded-xl p-4 border border-gray-300 dark:border-neutral-600 hover:border-orange-400 dark:hover:border-orange-500 transition-all hover:shadow-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                      <benefit.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-neutral-100 mb-1 leading-tight">
                        {benefit.title}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-neutral-300 leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Note */}
            <p className="text-sm text-gray-600 dark:text-neutral-400 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              Resposta imediata pelo WhatsApp — nossa equipe está pronta pra te ajudar!
            </p>
          </div>

          {/* Coluna Direita - Features e CTA */}
          <div className="w-[440px] bg-gradient-to-br from-orange-50/80 to-purple-50/80 dark:from-neutral-800/80 dark:to-neutral-800/80 backdrop-blur-sm border-l border-gray-200 dark:border-neutral-700 p-10 flex flex-col justify-center">
            {/* Additional Features */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 dark:text-neutral-100 mb-5 flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                O que você ganha ao assinar:
              </h3>
              <ul className="space-y-3">
                {[
                  "Sistema completo de Multi-Agentes de IA",
                  "Funil e CRM automáticos em cada novo lead",
                  "Relatórios e análises de desempenho de agentes, leads e conversas",
                  "Integrações premium com outras plataformas",
                  "Mensagens rápidas e automações inteligentes",
                  "Acompanhamento de leads e negociações em tempo real",
                  "Atualizações contínuas e novos recursos sem custo adicional"
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-gray-800 dark:text-neutral-200 font-medium leading-relaxed">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleUpgradeClick}
                className="w-full px-6 py-4 bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700 text-white font-bold text-base rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group"
              >
                <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Falar com Especialista
              </button>

              <button
                onClick={onClose}
                className="w-full px-4 py-3 text-sm text-gray-600 dark:text-neutral-300 hover:text-gray-800 dark:hover:text-neutral-100 transition-colors font-medium"
              >
                ou continuar com a demonstração
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
