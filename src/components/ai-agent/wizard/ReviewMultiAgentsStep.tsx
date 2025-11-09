import { Users, User, ArrowRight } from 'lucide-react';
import { StepComponentProps } from '../../../types/agent-wizard';

export default function ReviewMultiAgentsStep({ state, onNext, onBack }: StepComponentProps) {
  const selectedTemplates = state.multiAgent.selectedTemplates;
  const totalAgents = selectedTemplates.length + 1; // +1 para o agente principal

  const handleContinue = () => {
    onNext({
      currentStep: 'batch-creation'
    });
  };

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Revise seu sistema de multiagentes
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {totalAgents} agentes serão criados automaticamente
        </p>
      </div>

      {/* Card do Agente Principal (Nível 1) */}
      <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-600 dark:bg-purple-500 rounded-lg">
            <User className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Agente Principal - Recepção
              </h4>
              <span className="px-2 py-1 bg-purple-600 dark:bg-purple-500 text-white text-xs font-medium rounded">
                Nível 1
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Responsável por recepcionar leads, entender demandas e direcionar para o agente especialista adequado
            </p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 rounded border border-purple-200 dark:border-purple-700">
                ✓ Ativo por padrão
              </span>
              <span className="px-2 py-1 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 rounded border border-purple-200 dark:border-purple-700">
                ✓ Agente Principal
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Seta indicando fluxo */}
      <div className="flex justify-center">
        <ArrowRight className="w-6 h-6 text-gray-400" />
      </div>

      {/* Cards dos Agentes Especialistas (Nível 2) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Agentes Especialistas ({selectedTemplates.length})
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
          {selectedTemplates.map((template, index) => (
            <div
              key={template.id}
              className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {template.nome}
                  </h5>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                    {template.area}
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 rounded">
                      Nível 2
                    </span>
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-xs text-green-700 dark:text-green-400 rounded">
                      Ativo
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Informações importantes */}
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-sm text-yellow-900 dark:text-yellow-300">
          <strong>Importante:</strong> Todos os agentes serão criados com as seguintes configurações padrão:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-yellow-800 dark:text-yellow-400">
          <li>• Status: <strong>Ativo</strong></li>
          <li>• Gatilhos: <strong>Desativados</strong></li>
          <li>• Agente Nível 1 será definido como <strong>Principal</strong></li>
          <li>• Regras, roteiro e FAQ dos modelos serão aplicados</li>
        </ul>
      </div>

      {/* Botões de navegação */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Voltar
        </button>
        <button
          onClick={handleContinue}
          className="px-6 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
        >
          Criar {totalAgents} Agentes →
        </button>
      </div>
    </div>
  );
}
