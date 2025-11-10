import { useState, useEffect } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { StepComponentProps, CreatedAgent } from '../../../types/agent-wizard';

export default function CreationConfirmStep({ state, onNext, onSuccess, token }: StepComponentProps) {
  const [agent, setAgent] = useState<CreatedAgent | null>(state.singleAgent.createdAgent);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [applyingTemplate, setApplyingTemplate] = useState(false);

  useEffect(() => {
    loadAgentData();
  }, []);

  const loadAgentData = async (retryCount = 0) => {
    const tempAgent = state.singleAgent.createdAgent;
    const maxRetries = 5; // Tentar até 5 vezes
    const retryDelay = 1000; // 1 segundo entre tentativas

    // Se não temos ID, vamos buscar pelo nome
    const searchById = !!tempAgent?.Id;
    const searchByName = !searchById && !!tempAgent?.nome;

    if (!searchById && !searchByName) {
      setError('Dados do agente não encontrados');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Buscar dados completos do agente criado
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/get',
        {
          headers: { token }
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar dados do agente');
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Resposta inválida do servidor');
      }

      // Procurar agente pelo ID ou nome
      let foundAgent;
      if (searchById) {
        // Buscar por ID
        foundAgent = data.find((a: any) => String(a.Id) === String(tempAgent.Id));
      } else {
        // Buscar por nome (case insensitive)
        const searchName = tempAgent.nome.trim().toLowerCase();
        const sameNameAgents = data.filter((a: any) =>
          (a.nome || '').trim().toLowerCase() === searchName
        );

        // Se encontrou, pegar o mais recente (maior ID)
        if (sameNameAgents.length > 0) {
          foundAgent = sameNameAgents.sort((a: any, b: any) => Number(b.Id) - Number(a.Id))[0];
        }
      }

      if (foundAgent) {
        // Atualizar com dados completos do backend
        const completeAgent = {
          ...foundAgent,
          templateId: tempAgent.templateId
        };
        setAgent(completeAgent);

        // Atualizar o estado global com os dados completos
        onNext({
          singleAgent: {
            ...state.singleAgent,
            createdAgent: completeAgent
          }
        });

        // Chamar onSuccess para atualizar a lista de agentes na tela principal
        onSuccess();

        setLoading(false);
      } else {
        // Se não encontrou e ainda tem tentativas, tentar novamente
        if (retryCount < maxRetries) {
          setRetryAttempt(retryCount + 1);
          setTimeout(() => {
            loadAgentData(retryCount + 1);
          }, retryDelay);
        } else {
          // Após todas as tentativas, usar dados básicos
          setAgent(tempAgent);
          setError('Agente criado, mas dados completos não foram encontrados');
          setLoading(false);
        }
      }
    } catch (err) {
      // Se ainda tem tentativas, tentar novamente
      if (retryCount < maxRetries) {
        setRetryAttempt(retryCount + 1);
        setTimeout(() => {
          loadAgentData(retryCount + 1);
        }, retryDelay);
      } else {
        setError('Não foi possível verificar os dados do agente');
        setAgent(tempAgent);
        setLoading(false);
      }
    }
  };

  const handleContinue = async () => {
    // Se for um template, aplicar o conteúdo antes de continuar
    if (state.singleAgent.creationType === 'template' && state.singleAgent.selectedTemplate && agent?.Id) {
      setApplyingTemplate(true);
      setError('');

      try {
        const template = state.singleAgent.selectedTemplate;

        // 1. Aplicar Regras
        if (template.regras) {
          await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/regras/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              token
            },
            body: JSON.stringify({
              regras: template.regras.regras || '',
              id_agente: agent.Id
            })
          });
        }

        // 2. Aplicar Etapas
        if (template.etapas && template.etapas.length > 0) {
          await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/etapas/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              token
            },
            body: JSON.stringify(
              template.etapas.map(e => ({ ...e, id_agente: agent.Id }))
            )
          });
        }

        // 3. Aplicar FAQ
        if (template.faq && template.faq.length > 0) {
          await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/faq/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              token
            },
            body: JSON.stringify(
              template.faq.map(f => ({ ...f, id_agente: agent.Id }))
            )
          });
        }

        // Passar para a próxima etapa (edit-rules) com conteúdo já carregado
        onNext({
          singleAgent: {
            ...state.singleAgent,
            editedContent: {
              regras: template.regras?.regras || '',
              etapas: template.etapas || [],
              faq: template.faq || []
            }
          },
          currentStep: 'edit-rules'
        });
      } catch (err: any) {
        console.error('Erro ao aplicar template:', err);
        setError('Erro ao aplicar modelo ao agente. Você pode configurar manualmente.');
        setApplyingTemplate(false);
      }
    } else {
      // Se não for template, ir direto para edição
      onNext({
        currentStep: 'edit-rules'
      });
    }
  };

  if (loading || applyingTemplate) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-8 max-w-md">
          {/* Spinner animado com gradiente */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 opacity-20 animate-pulse"></div>
            <div className="absolute inset-2 rounded-full bg-white dark:bg-gray-900"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-4 border-transparent border-t-purple-400 border-r-blue-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>

          {/* Texto */}
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {applyingTemplate ? 'Aplicando modelo ao agente' : 'Verificando agente criado'}
            </h3>
            <p className="text-base text-gray-600 dark:text-gray-400">
              {applyingTemplate
                ? 'Configurando regras, roteiro e perguntas frequentes...'
                : retryAttempt > 0
                ? `Buscando agente... (tentativa ${retryAttempt}/5)`
                : 'Aguarde enquanto verificamos os dados do agente'
              }
            </p>
          </div>

          {/* Barra de progresso animada */}
          <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-progress"></div>
          </div>

          {/* Pontos animados */}
          <div className="flex items-center justify-center gap-2">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>

        <style>{`
          @keyframes progress {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(400%);
            }
          }
          .animate-progress {
            animation: progress 1.5s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  if (error && !agent) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={loadAgentData}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">Erro: Agente não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ícone de sucesso */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Agente criado com sucesso!
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Seu agente foi criado e está pronto para ser configurado
        </p>
      </div>

      {/* Informações do agente criado */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Informações do Agente
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Nome</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {agent.nome}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">ID</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                #{agent.Id}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  agent.isAtivo
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                }`}>
                  {agent.isAtivo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tipo</p>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  agent.isAgentePrincipal
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                }`}>
                  {agent.isAgentePrincipal ? 'Principal' : 'Secundário'}
                </span>
              </div>
            </div>
          </div>

          {state.singleAgent.creationType === 'template' && state.singleAgent.selectedTemplate && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Modelo usado</p>
              <div className="flex items-center gap-2">
                <p className="text-base font-medium text-gray-900 dark:text-white">
                  {state.singleAgent.selectedTemplate.nome}
                </p>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 rounded">
                  {state.singleAgent.selectedTemplate.area}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Próximos passos */}
        <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="text-base font-semibold text-blue-900 dark:text-blue-300 mb-3">
            Próximos passos
          </h4>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <div className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>Configure as regras de atendimento do seu agente</p>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>Personalize o roteiro de conversa (etapas)</p>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>Adicione perguntas frequentes (FAQ)</p>
            </div>
          </div>
        </div>

        {state.singleAgent.creationType === 'scratch' && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-900 dark:text-yellow-300">
              <strong>Atenção:</strong> Como você criou o agente do zero, será necessário
              configurar todas as regras, etapas e FAQs manualmente na próxima etapa.
            </p>
          </div>
        )}
      </div>

      {/* Botão de continuar */}
      <div className="flex justify-center pt-4">
        <button
          onClick={handleContinue}
          className="px-8 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium text-lg"
        >
          Configurar Agente →
        </button>
      </div>
    </div>
  );
}
