import { useState, useEffect } from 'react';
import { Info, CheckCircle, XCircle } from 'lucide-react';
import { StepComponentProps } from '../../../types/agent-wizard';

export default function DefineNameStep({ state, onNext, onBack, token }: StepComponentProps) {
  const [agentName, setAgentName] = useState(state.singleAgent.agentName || '');
  const [isAgentePrincipal, setIsAgentePrincipal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingName, setCheckingName] = useState(false);
  const [nameAvailable, setNameAvailable] = useState(true);
  const [existingAgents, setExistingAgents] = useState<any[]>([]);
  const [currentPrincipalAgent, setCurrentPrincipalAgent] = useState<any>(null);
  const [showPrincipalWarning, setShowPrincipalWarning] = useState(false);

  // Carregar agentes existentes ao montar
  useEffect(() => {
    loadExistingAgents();
  }, []);

  // Verificar nome em tempo real
  useEffect(() => {
    if (agentName.trim()) {
      checkNameAvailability(agentName);
    } else {
      setNameAvailable(true);
    }
  }, [agentName, existingAgents]);

  const loadExistingAgents = async () => {
    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/get',
        { headers: { token } }
      );
      if (response.ok) {
        const agents = await response.json();
        if (Array.isArray(agents)) {
          setExistingAgents(agents);
          // Verificar se já existe um agente principal
          const principalAgent = agents.find((agent: any) => agent.isAgentePrincipal);
          setCurrentPrincipalAgent(principalAgent || null);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar agentes:', err);
    }
  };

  const checkNameAvailability = (name: string) => {
    const trimmedName = name.trim().toLowerCase();
    const exists = existingAgents.some(
      (agent: any) => agent.nome.trim().toLowerCase() === trimmedName
    );
    setNameAvailable(!exists);
  };

  const handleCreate = async () => {
    setError('');

    // Validação
    if (!agentName.trim()) {
      setError('Nome do agente é obrigatório');
      return;
    }

    if (!nameAvailable) {
      setError('Já existe um agente com este nome. Por favor, escolha outro nome.');
      return;
    }

    setLoading(true);

    try {
      // Se está marcando como principal e já existe outro principal, remover o antigo
      if (isAgentePrincipal && currentPrincipalAgent) {
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
              isAgentePrincipal: false, // Remove como principal
              isGatilho: currentPrincipalAgent.isGatilho,
              gatilho: currentPrincipalAgent.gatilho || ''
            })
          }
        );
      }

      const requestBody = {
        nome: agentName,
        isAtivo: true, // Sempre ativo por padrão
        isAgentePrincipal, // Escolha do usuário
        isGatilho: false, // Sempre desativado por padrão
        gatilho: ''
      };

      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao criar agente');
      }

      const createResponse = await response.json().catch(() => ({}));

      // Extrair ID do agente criado (API pode retornar ou não)
      const agentId = createResponse.Id || createResponse.id || createResponse.agentId ||
                      createResponse.data?.Id || createResponse.data?.id || null;

      // Passar para próxima etapa
      // CreationConfirmStep vai buscar pelo ID (se houver) ou pelo nome
      onNext({
        singleAgent: {
          ...state.singleAgent,
          agentName,
          createdAgent: {
            Id: agentId,
            nome: agentName,
            isAtivo: true,
            isAgentePrincipal,
            isGatilho: false,
            gatilho: '',
            templateId: state.singleAgent.selectedTemplate?.id
          }
        },
        currentStep: 'creation-confirm'
      });
    } catch (err: any) {
      console.error('Erro ao criar agente:', err);
      setError(err.message || 'Erro ao criar agente. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Tela de loading durante a criação
  if (loading) {
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
              Criando agente
            </h3>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Aguarde enquanto configuramos <strong className="text-gray-900 dark:text-white">"{agentName}"</strong>
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

  return (
    <div className="space-y-6">
      {/* Título e instruções */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Defina o nome do seu agente
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {state.singleAgent.creationType === 'template'
            ? `Baseado no modelo: ${state.singleAgent.selectedTemplate?.nome}`
            : 'Criando agente do zero'}
        </p>
      </div>

      {/* Formulário */}
      <div className="space-y-5 max-w-xl mx-auto">
        {error && (
          <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Nome do agente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nome do Agente <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="Ex: Atendimento Comercial, Suporte BPC, etc."
              className={`w-full px-4 py-3 pr-10 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:border-transparent ${
                agentName.trim() && !nameAvailable
                  ? 'border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400'
                  : agentName.trim() && nameAvailable
                  ? 'border-green-500 dark:border-green-400 focus:ring-green-500 dark:focus:ring-green-400'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400'
              }`}
              disabled={loading}
            />
            {agentName.trim() && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {nameAvailable ? (
                  <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
                )}
              </div>
            )}
          </div>
          {agentName.trim() && !nameAvailable ? (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Já existe um agente com este nome
            </p>
          ) : agentName.trim() && nameAvailable ? (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Nome disponível
            </p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Escolha um nome descritivo e fácil de identificar
            </p>
          )}
        </div>

        {/* Agente Principal */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isAgentePrincipal}
              onChange={(e) => {
                setIsAgentePrincipal(e.target.checked);
                setShowPrincipalWarning(e.target.checked && !!currentPrincipalAgent);
              }}
              className="w-5 h-5 mt-0.5 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800"
              disabled={loading}
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900 dark:text-white block mb-1">
                Definir como Agente Principal
              </span>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                O agente principal é o primeiro a ser acionado quando um novo contato chega.
                Apenas um agente pode ser principal por vez.
              </p>
            </div>
          </label>

          {/* Aviso de troca de agente principal */}
          {showPrincipalWarning && currentPrincipalAgent && (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex gap-2">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-300">
                  <p className="font-medium mb-1">Atenção: Troca de Agente Principal</p>
                  <p>
                    O agente atual "<strong>{currentPrincipalAgent.nome}</strong>" será automaticamente
                    desmarcado como principal e este novo agente assumirá essa função.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Informações adicionais */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-300 space-y-2">
              <p className="font-medium">Configurações padrão:</p>
              <ul className="space-y-1 text-xs">
                <li>✓ Agente será criado como <strong>ativo</strong></li>
                <li>✓ Gatilhos estarão <strong>desativados</strong> inicialmente</li>
                {state.singleAgent.creationType === 'template' && (
                  <li>✓ Regras, roteiro e FAQ do modelo serão aplicados</li>
                )}
              </ul>
            </div>
          </div>
        </div>
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
          onClick={handleCreate}
          disabled={!agentName.trim() || !nameAvailable}
          className="px-6 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Criar Agente →
        </button>
      </div>
    </div>
  );
}
