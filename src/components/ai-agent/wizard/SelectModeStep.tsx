import { Users, User } from 'lucide-react';
import { StepComponentProps } from '../../../types/agent-wizard';

export default function SelectModeStep({ state, onNext }: StepComponentProps) {
  const handleSelectMode = (mode: 'single' | 'multi') => {
    onNext({
      mode,
      currentStep: mode === 'single' ? 'select-creation-type' : 'select-templates'
    });
  };

  return (
    <div className="space-y-6">
      {/* Título e instruções */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Como você deseja criar seus agentes?
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Escolha entre criar um agente único ou um sistema completo de multiagentes
        </p>
      </div>

      {/* Opções de seleção */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Opção: Agente Único */}
        <button
          onClick={() => handleSelectMode('single')}
          className="group relative p-8 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all duration-200 text-left bg-white dark:bg-gray-800"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
              <User className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                Agente Único
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Perfeito para necessidades simples e específicas
              </p>
            </div>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 text-left w-full">
              <li className="flex items-start gap-2">
                <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                <span>Criar do zero ou usar um modelo pronto</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                <span>Configuração rápida e direta</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                <span>Ideal para casos de uso únicos</span>
              </li>
            </ul>
          </div>
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-6 h-6 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
              <span className="text-white text-sm">→</span>
            </div>
          </div>
        </button>

        {/* Opção: Sistema de Multiagentes */}
        <button
          onClick={() => handleSelectMode('multi')}
          className="group relative p-8 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all duration-200 text-left bg-white dark:bg-gray-800"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-full group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-colors">
              <Users className="w-12 h-12 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                Sistema de Multiagentes
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Solução completa com agentes especializados
              </p>
            </div>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 text-left w-full">
              <li className="flex items-start gap-2">
                <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                <span>Agente principal de recepção (Nível 1)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                <span>Agentes especialistas por área (Nível 2)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                <span>Sistema inteligente de direcionamento</span>
              </li>
            </ul>
          </div>
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-6 h-6 rounded-full bg-purple-600 dark:bg-purple-500 flex items-center justify-center">
              <span className="text-white text-sm">→</span>
            </div>
          </div>
        </button>
      </div>

      {/* Dica informativa */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
              i
            </div>
          </div>
          <div className="text-sm text-blue-900 dark:text-blue-300">
            <p className="font-medium mb-1">Dica:</p>
            <p>
              Se você precisa atender diferentes áreas (ex: Bancário, Trabalhista, BPC),
              escolha o <strong>Sistema de Multiagentes</strong>. Para uma única área ou
              necessidade específica, o <strong>Agente Único</strong> é mais adequado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
