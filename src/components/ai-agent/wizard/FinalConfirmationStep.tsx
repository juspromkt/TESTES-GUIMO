import { CheckCircle2, Sparkles } from 'lucide-react';
import { StepComponentProps } from '../../../types/agent-wizard';

export default function FinalConfirmationStep({ state, onClose, onSuccess }: StepComponentProps) {
  const agent = state.singleAgent.createdAgent;
  const content = state.singleAgent.editedContent;

  const handleFinish = () => {
    // Chamar onSuccess para atualizar a lista de agentes
    if (onSuccess) {
      onSuccess();
    }
    // Fechar o modal
    onClose();
  };

  return (
    <div className="space-y-6">
      {/* Ícone de sucesso com confete */}
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="w-14 h-14 text-white" />
          </div>
          <Sparkles className="w-6 h-6 text-yellow-400 absolute top-0 right-1/3 animate-pulse" />
          <Sparkles className="w-5 h-5 text-yellow-400 absolute bottom-2 left-1/3 animate-pulse delay-100" />
        </div>

        <div className="space-y-2">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
            Parabéns! 🎉
          </h3>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Seu agente está pronto para uso!
          </p>
        </div>
      </div>

      {/* Resumo do agente criado */}
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Card principal */}
        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Resumo da Configuração
          </h4>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Nome do Agente:</span>
              <span className="text-base font-semibold text-gray-900 dark:text-white">
                {agent?.nome}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">ID:</span>
              <span className="text-base font-medium text-gray-700 dark:text-gray-300">
                #{agent?.Id}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Tipo:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                agent?.isAgentePrincipal
                  ? 'bg-blue-600 dark:bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}>
                {agent?.isAgentePrincipal ? 'Principal' : 'Secundário'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                Ativo
              </span>
            </div>

            {state.singleAgent.creationType === 'template' && (
              <div className="flex justify-between items-center pt-2 border-t border-blue-200 dark:border-blue-800">
                <span className="text-sm text-gray-600 dark:text-gray-400">Modelo Base:</span>
                <span className="text-base font-medium text-gray-900 dark:text-white">
                  {state.singleAgent.selectedTemplate?.nome}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card de configurações */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {content?.regras ? '✓' : '—'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Regras</p>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {content?.etapas && content.etapas.length > 0 ? '✓' : '—'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Etapas</p>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {content?.faq && content.faq.length > 0 ? '✓' : '—'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">FAQs</p>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="p-5 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
          <h5 className="font-semibold text-green-900 dark:text-green-300 mb-2">
            O que acontece agora?
          </h5>
          <ul className="space-y-2 text-sm text-green-800 dark:text-green-300">
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
              <span>Seu agente está ativo e pronto para receber conversas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
              <span>Todas as configurações foram salvas com sucesso</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
              <span>Você pode editar ou ajustar o agente a qualquer momento</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Botão de finalizar */}
      <div className="flex justify-center pt-6">
        <button
          onClick={handleFinish}
          className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Concluir e Fechar
        </button>
      </div>
    </div>
  );
}
