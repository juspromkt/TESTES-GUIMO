import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { StepComponentProps, CreatedAgent } from '../../../types/agent-wizard';

interface AgentCreationStatus {
  templateId: string;
  templateNome: string;
  createdNome?: string; // Nome único gerado (pode ter sufixo)
  status: 'pending' | 'creating' | 'success' | 'error';
  agentId?: number;
  error?: string;
}

export default function BatchCreationStep({ state, onNext, onSuccess, token }: StepComponentProps) {
  const [creationStatuses, setCreationStatuses] = useState<AgentCreationStatus[]>([]);
  const [currentAgentIndex, setCurrentAgentIndex] = useState(-1);
  const [principalAgentCreated, setPrincipalAgentCreated] = useState(false);
  const [principalAgent, setPrincipalAgent] = useState<CreatedAgent | null>(null);
  const [allComplete, setAllComplete] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);
  const [loadingIds, setLoadingIds] = useState(false);

  // useRef persiste entre re-renders e não causa re-render quando muda
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Prevenir execução dupla - useRef não reseta no React Strict Mode
    if (hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;

    // Inicializar status de criação para cada template selecionado
    const initialStatuses: AgentCreationStatus[] = state.multiAgent.selectedTemplates.map(template => ({
      templateId: template.id,
      templateNome: template.nome,
      status: 'pending'
    }));

    setCreationStatuses(initialStatuses);
    startBatchCreation();
  }, []);

  const startBatchCreation = async () => {
    // Buscar agentes existentes para verificar duplicações de nome
    let existingAgents: any[] = [];
    try {
      const getResponse = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/get',
        { headers: { token } }
      );
      if (getResponse.ok) {
        const agents = await getResponse.json();
        if (Array.isArray(agents)) {
          existingAgents = agents;
        }
      }
    } catch (err) {
      console.error('Erro ao buscar agentes existentes:', err);
    }

    // Primeiro, criar o agente principal (Nível 1)
    await createPrincipalAgent(existingAgents);

    // Depois, criar todos os agentes especialistas (Nível 2)
    for (let i = 0; i < state.multiAgent.selectedTemplates.length; i++) {
      setCurrentAgentIndex(i);
      await createSpecialistAgent(i, existingAgents);
    }

    setAllComplete(true);

    // Atualizar lista de agentes APENAS UMA VEZ ao final
    onSuccess();
  };

  const getUniqueName = (baseName: string, existingAgents: any[]): string => {
    const existingNames = existingAgents.map((a: any) => a.nome.trim().toLowerCase());
    let finalName = baseName;
    let counter = 2;

    while (existingNames.includes(finalName.trim().toLowerCase())) {
      finalName = `${baseName} (${counter})`;
      counter++;
    }

    return finalName;
  };

  const createPrincipalAgent = async (existingAgents: any[]) => {
    try {
      // Verificar se já existe um agente principal
      const currentPrincipalAgent = existingAgents.find((agent: any) => agent.isAgentePrincipal);

      // Se existe, remover como principal
      if (currentPrincipalAgent) {
        await fetch(
          'https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/update',
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              token
            },
            body: JSON.stringify({
              Id: currentPrincipalAgent.Id,
              nome: currentPrincipalAgent.nome,
              isAtivo: currentPrincipalAgent.isAtivo,
              isAgentePrincipal: false,
              isGatilho: currentPrincipalAgent.isGatilho,
              gatilho: currentPrincipalAgent.gatilho || ''
            })
          }
        );
      }

      // Usar nome customizado ou padrão
      const customName = state.multiAgent.customAgentNames?.get('principal');
      const uniqueName = customName || 'Recepção - Agente Principal';

      const createResponse = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token
          },
          body: JSON.stringify({
            nome: uniqueName,
            isAtivo: true,
            isAgentePrincipal: true,
            isGatilho: false,
            gatilho: ''
          })
        }
      );

      if (!createResponse.ok) {
        throw new Error('Erro ao criar agente principal');
      }

      const createdData = await createResponse.json().catch(() => ({}));
      const agentId = createdData.Id || createdData.id || createdData.agentId ||
                      createdData.data?.Id || createdData.data?.id || null;

      const newPrincipalAgent: CreatedAgent = {
        Id: agentId,
        nome: uniqueName,
        isAtivo: true,
        isAgentePrincipal: true,
        isGatilho: false,
        gatilho: ''
      };

      setPrincipalAgent(newPrincipalAgent);
      setPrincipalAgentCreated(true);

      // TODO: Aplicar template de agente principal (se houver)
      // Por enquanto, apenas criamos sem template
    } catch (error) {
      console.error('Erro ao criar agente principal:', error);
      setHasErrors(true);
    }
  };

  const createSpecialistAgent = async (index: number, existingAgents: any[]) => {
    const template = state.multiAgent.selectedTemplates[index];

    // Atualizar status para "creating"
    setCreationStatuses(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: 'creating' };
      return updated;
    });

    try {
      // Usar nome customizado ou nome do template
      const customName = state.multiAgent.customAgentNames?.get(template.id);
      const uniqueName = customName || template.nome;

      // Criar agente (SEM aplicar template ainda)
      const createResponse = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token
          },
          body: JSON.stringify({
            nome: uniqueName,
            isAtivo: true,
            isAgentePrincipal: false,
            isGatilho: false,
            gatilho: ''
          })
        }
      );

      if (!createResponse.ok) {
        throw new Error(`Erro ao criar agente ${template.nome}`);
      }

      const createdData = await createResponse.json().catch(() => ({}));
      let agentId = createdData.Id || createdData.id || createdData.agentId ||
                    createdData.data?.Id || createdData.data?.id || null;

      // Se não retornou ID, tentar buscar pelo nome único gerado
      if (!agentId) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const getResponse = await fetch(
          'https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/get',
          { headers: { token } }
        );

        if (getResponse.ok) {
          const agents = await getResponse.json();
          if (Array.isArray(agents)) {
            const searchName = uniqueName.trim().toLowerCase();
            const sameNameAgents = agents.filter((a: any) =>
              (a.nome || '').trim().toLowerCase() === searchName
            );
            if (sameNameAgents.length > 0) {
              const foundAgent = sameNameAgents.sort((a: any, b: any) => Number(b.Id) - Number(a.Id))[0];
              agentId = foundAgent.Id;
            }
          }
        }
      }

      // Adicionar o agente recém-criado à lista de existentes para evitar duplicação nos próximos
      existingAgents.push({ nome: uniqueName, Id: agentId });

      if (!agentId) {
        throw new Error('ID do agente não retornado');
      }

      // Atualizar status para "success" com o nome criado
      setCreationStatuses(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          status: 'success',
          agentId,
          createdNome: uniqueName // Armazenar o nome único gerado
        };
        return updated;
      });
    } catch (error: any) {
      console.error(`Erro ao criar agente ${uniqueName || template.nome}:`, error);
      setCreationStatuses(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          status: 'error',
          error: error.message || 'Erro desconhecido'
        };
        return updated;
      });
      setHasErrors(true);
    }
  };

  const handleContinue = async () => {
    setLoadingIds(true);
    try {
      // Buscar todos os agentes da API para obter os IDs corretos
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/get',
        { headers: { token } }
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar agentes criados');
      }

      const allAgents = await response.json();

      // Criar lista de nomes criados (principal + especialistas)
      const principalName = state.multiAgent.customAgentNames?.get('principal') || 'Recepção - Agente Principal';
      const createdNames = [
        principalName,
        ...creationStatuses
          .filter(s => s.status === 'success')
          .map(s => s.createdNome || s.templateNome)
      ];

      // Buscar os agentes criados pelo nome
      const createdAgentsWithIds = createdNames
        .map(nome => {
          const agent = allAgents.find((a: any) => a.nome.trim().toLowerCase() === nome.trim().toLowerCase());
          if (!agent) {
            console.warn(`Agente "${nome}" não encontrado na API`);
            return null;
          }
          return {
            Id: agent.Id,
            nome: agent.nome,
            isAtivo: agent.isAtivo,
            isAgentePrincipal: agent.isAgentePrincipal,
            isGatilho: agent.isGatilho,
            gatilho: agent.gatilho || ''
          };
        })
        .filter(Boolean); // Remove nulls

      if (createdAgentsWithIds.length === 0) {
        throw new Error('Nenhum agente encontrado na API');
      }

      onNext({
        multiAgent: {
          ...state.multiAgent,
          createdAgents: createdAgentsWithIds as any[],
          currentEditingIndex: 0 // Começar editando o primeiro agente (principal)
        },
        currentStep: 'edit-multi-agent'
      });
    } catch (error) {
      console.error('Erro ao buscar IDs dos agentes:', error);
      alert('Erro ao buscar os agentes criados. Por favor, tente novamente.');
    } finally {
      setLoadingIds(false);
    }
  };

  const totalAgents = state.multiAgent.selectedTemplates.length + 1; // +1 para principal
  const successCount = creationStatuses.filter(s => s.status === 'success').length + (principalAgentCreated ? 1 : 0);
  const errorCount = creationStatuses.filter(s => s.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {allComplete ? 'Criação Concluída!' : 'Criando Sistema de Multiagentes'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {allComplete
            ? `${successCount} de ${totalAgents} agentes criados com sucesso`
            : 'Aguarde enquanto criamos todos os agentes...'}
        </p>
      </div>

      {/* Barra de progresso geral */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Progresso</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {successCount + errorCount} / {totalAgents}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${((successCount + errorCount) / totalAgents) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Status do Agente Principal */}
      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
        <div className="flex items-center gap-3">
          {principalAgentCreated ? (
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
          ) : (
            <Loader2 className="w-6 h-6 text-purple-600 dark:text-purple-400 animate-spin flex-shrink-0" />
          )}
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Agente Principal - Recepção
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {principalAgentCreated ? 'Criado com sucesso' : 'Criando...'}
            </p>
          </div>
        </div>
      </div>

      {/* Status dos Agentes Especialistas */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          Agentes Especialistas ({state.multiAgent.selectedTemplates.length})
        </h4>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {creationStatuses.map((status, index) => (
            <div
              key={status.templateId}
              className={`p-3 border rounded-lg transition-all ${
                status.status === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : status.status === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : status.status === 'creating'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                {status.status === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : status.status === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                ) : status.status === 'creating' ? (
                  <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0"></div>
                )}
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                    {status.templateNome}
                  </h5>
                  {status.status === 'error' && status.error && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                      {status.error}
                    </p>
                  )}
                  {status.status === 'success' && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                      Agente criado com sucesso
                    </p>
                  )}
                  {status.status === 'creating' && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                      Criando agente...
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mensagem de erro geral */}
      {hasErrors && allComplete && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-900 dark:text-yellow-300">
            <strong>Atenção:</strong> Alguns agentes não puderam ser criados. Os agentes criados com sucesso
            serão configurados nas próximas etapas.
          </p>
        </div>
      )}

      {/* Informação sobre próximos passos */}
      {allComplete && !hasErrors && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-300">
            <strong>Próxima etapa:</strong> Você irá configurar as regras, roteiro e FAQ de cada agente individualmente.
          </p>
        </div>
      )}

      {/* Botão de continuar (só aparece quando completo) */}
      {allComplete && (
        <div className="flex justify-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleContinue}
            disabled={loadingIds}
            className="px-8 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loadingIds ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Buscando IDs dos agentes...
              </>
            ) : (
              'Configurar Agentes →'
            )}
          </button>
        </div>
      )}

      {/* Spinner enquanto não está completo */}
      {!allComplete && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
