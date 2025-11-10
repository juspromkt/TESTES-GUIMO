import { CheckCircle2, Sparkles, Users, Bot, Zap } from 'lucide-react';
import { StepComponentProps } from '../../../types/agent-wizard';
import logoLight from '../../../imgs/guimoo/icon-dark-mode.png';
import logoDark from '../../../imgs/guimoo/icone-para-tema-escuro.png';

export default function FinalConfirmationStep({ state, onClose, onSuccess }: StepComponentProps) {
  const isMultiAgent = state.mode === 'multi';

  // Dados para agente único
  const agent = state.singleAgent.createdAgent;
  const content = state.singleAgent.editedContent;

  // Dados para multiagentes
  const multiAgents = state.multiAgent.createdAgents || [];
  const totalAgents = multiAgents.length;
  const principalAgent = multiAgents.find(a => a.isAgentePrincipal);
  const specialistAgents = multiAgents.filter(a => !a.isAgentePrincipal);

  const handleFinish = () => {
    // Chamar onSuccess para atualizar a lista de agentes
    if (onSuccess) {
      onSuccess();
    }
    // Fechar o modal
    onClose();
  };

  // Layout especial para multiagentes
  if (isMultiAgent) {
    return (
      <div className="space-y-8">
        {/* Header especial */}
        <div className="text-center space-y-4">
          <div className="space-y-3">
            <h3 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 dark:from-purple-400 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Sistema Multiagente Criado!
            </h3>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {totalAgents} agentes especializados trabalhando em harmonia
            </p>
          </div>
        </div>

        {/* Cards de agentes criados */}
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Agente Principal */}
          {principalAgent && (
            <div className="p-6 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg p-2">
                  <img
                    src={logoLight}
                    alt="Guimoo"
                    className="w-full h-full object-contain dark:hidden"
                  />
                  <img
                    src={logoDark}
                    alt="Guimoo"
                    className="w-full h-full object-contain hidden dark:block"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                      {principalAgent.nome}
                    </h4>
                    <span className="px-3 py-1 bg-purple-600 dark:bg-purple-500 text-white rounded-full text-xs font-semibold">
                      Nível 1 - Recepção
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Agente principal responsável por receber e direcionar as conversas
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Grid de Agentes Especialistas */}
          {specialistAgents.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-300 dark:via-blue-700 to-transparent"></div>
                <h5 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Agentes Especialistas ({specialistAgents.length})
                </h5>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-300 dark:via-blue-700 to-transparent"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {specialistAgents.map((specialist, index) => (
                  <div
                    key={specialist.Id}
                    className="p-5 bg-white dark:bg-gray-900 border-2 border-blue-200 dark:border-blue-800 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-gray-900 dark:text-white truncate">
                          {specialist.nome}
                        </h5>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                            Nível 2
                          </span>
                        </div>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl text-center">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {totalAgents}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">Total de Agentes</p>
            </div>

            <div className="p-5 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-800 rounded-xl text-center">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                1
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">Agente Principal</p>
            </div>

            <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-center">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {specialistAgents.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">Especialistas</p>
            </div>
          </div>

          {/* Informações do que acontece agora */}
          <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-2 border-green-200 dark:border-green-800 rounded-xl">
            <h5 className="font-bold text-green-900 dark:text-green-300 mb-3 text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Sistema Ativo e Operacional
            </h5>
            <ul className="space-y-2.5 text-sm text-green-800 dark:text-green-300">
              <li className="flex items-start gap-3">
                <span className="text-green-600 dark:text-green-400 mt-0.5 text-lg">✓</span>
                <span><strong>Agente principal</strong> está recebendo e direcionando conversas automaticamente</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 dark:text-green-400 mt-0.5 text-lg">✓</span>
                <span><strong>Agentes especialistas</strong> prontos para atender casos específicos com expertise</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 dark:text-green-400 mt-0.5 text-lg">✓</span>
                <span><strong>Todas as configurações</strong> (regras, roteiros e FAQs) foram salvas com sucesso</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 dark:text-green-400 mt-0.5 text-lg">✓</span>
                <span>Você pode <strong>editar ou ajustar</strong> qualquer agente a qualquer momento</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Botão de finalizar - versão multiagente */}
        <div className="flex justify-center pt-6">
          <button
            onClick={handleFinish}
            className="px-12 py-5 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 dark:from-purple-500 dark:via-blue-500 dark:to-indigo-500 text-white rounded-xl hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 dark:hover:from-purple-600 dark:hover:via-blue-600 dark:hover:to-indigo-600 transition-all duration-200 font-bold text-xl shadow-2xl hover:shadow-3xl transform hover:scale-105"
          >
            Concluir e Fechar
          </button>
        </div>
      </div>
    );
  }

  // Layout original para agente único
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
          <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {content?.regras ? '✓' : '—'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Regras</p>
          </div>

          <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {content?.etapas && content.etapas.length > 0 ? '✓' : '—'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Etapas</p>
          </div>

          <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
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
