import { Sparkles, FileText } from 'lucide-react';
import { StepComponentProps } from '../../../types/agent-wizard';

export default function SelectCreationTypeStep({ state, onNext, onBack }: StepComponentProps) {
  const handleSelectType = (type: 'scratch' | 'template') => {
    onNext({
      singleAgent: {
        ...state.singleAgent,
        creationType: type
      },
      currentStep: type === 'template' ? 'select-template' : 'define-name'
    });
  };

  return (
    <div className="space-y-6">
      {/* Título e instruções */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Como você quer criar seu agente?
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Escolha começar do zero ou usar um de nossos modelos prontos
        </p>
      </div>

      {/* Opções de seleção */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Opção: Criar do Zero */}
        <button
          onClick={() => handleSelectType('scratch')}
          className="group relative p-8 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all duration-200 text-left bg-white dark:bg-gray-900"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
              <Sparkles className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                Criar do Zero
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total liberdade para personalizar
              </p>
            </div>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 text-left w-full">
              <li className="flex items-start gap-2">
                <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                <span>Comece com um agente em branco</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                <span>Configure regras, roteiro e FAQ do zero</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                <span>Ideal para necessidades muito específicas</span>
              </li>
            </ul>
          </div>
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-6 h-6 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
              <span className="text-white text-sm">→</span>
            </div>
          </div>
        </button>

        {/* Opção: Usar Modelo Pronto */}
        <button
          onClick={() => handleSelectType('template')}
          className="group relative p-8 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all duration-200 text-left bg-white dark:bg-gray-900"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-full group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors">
              <FileText className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                Usar Modelo Pronto
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Comece com modelos testados e aprovados
              </p>
            </div>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 text-left w-full">
              <li className="flex items-start gap-2">
                <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                <span>Modelos prontos para diversas áreas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                <span>Regras, roteiros e FAQs já configurados</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                <span>Personalize depois se precisar</span>
              </li>
            </ul>
          </div>
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-6 h-6 rounded-full bg-green-600 dark:bg-green-500 flex items-center justify-center">
              <span className="text-white text-sm">→</span>
            </div>
          </div>
        </button>
      </div>

      {/* Dica informativa */}
      <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="w-5 h-5 rounded-full bg-yellow-600 dark:bg-yellow-500 flex items-center justify-center text-white text-xs font-bold">
              💡
            </div>
          </div>
          <div className="text-sm text-yellow-900 dark:text-yellow-300">
            <p className="font-medium mb-1">Recomendação:</p>
            <p>
              Para agilizar o processo, recomendamos usar um <strong>Modelo Pronto</strong>.
              Nossos modelos já incluem as melhores práticas e você pode personalizar depois.
            </p>
          </div>
        </div>
      </div>

      {/* Botão Voltar */}
      <div className="flex justify-start pt-4">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Voltar
        </button>
      </div>
    </div>
  );
}
