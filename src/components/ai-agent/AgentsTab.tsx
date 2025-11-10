import { useState, useEffect, useCallback } from 'react';
import { Plus, Power, PowerOff, Loader2, Zap, Edit2, ChevronDown, ChevronRight, Bell, ShieldCheck, ListChecks, HelpCircle, AlertCircle, Search } from 'lucide-react';
import { MdAutorenew } from 'react-icons/md';
import AgentFormModal from './AgentFormModal';
import AgentConfigModal from './AgentConfigModal';
import FollowUpTab from './FollowUpTab';
import AgentFunctionsSection from './AgentFunctionsSection';
import { hasPermission } from '../../utils/permissions';
import GuimooIcon from '../GuimooIcon';
import { useToast } from '../../contexts/ToastContext';

interface Agent {
  Id: number;
  nome: string;
  isAtivo?: boolean;
  isAgentePrincipal?: boolean;
  isGatilho?: boolean;
  gatilho?: string;
  // Dados de configuração
  hasRules?: boolean;
  stepsCount?: number;
  faqCount?: number;
  hasInvalidChips?: boolean;
  invalidChipsCount?: number;
}

interface AgentsTabProps {
  token: string;
  onAgentSelect?: (agentId: number) => void;
}

type SubTab = 'agents' | 'notifications' | 'followup';

export default function AgentsTab({ token, onAgentSelect }: AgentsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('agents');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAgentFormOpen, setIsAgentFormOpen] = useState(false);
  const [agentFormMode, setAgentFormMode] = useState<'create' | 'edit'>('create');
  const [selectedAgent, setSelectedAgent] = useState<Agent | undefined>();
  const [togglingAgentId, setTogglingAgentId] = useState<number | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [agentToConfig, setAgentToConfig] = useState<Agent | null>(null);
  const [notificationsKey, setNotificationsKey] = useState(0); // Key para forçar reload das notificações
  const [isActiveExpanded, setIsActiveExpanded] = useState(true);
  const [isInactiveExpanded, setIsInactiveExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const canEdit = hasPermission('can_edit_agent');
  const toast = useToast();

  // Função auxiliar para contar chips inválidos em uma descrição HTML
  const countInvalidChips = (html: string): number => {
    if (!html) return 0;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const decisionChips = tmp.querySelectorAll('.ql-smart-decision');

    let count = 0;
    for (const chip of Array.from(decisionChips)) {
      const isInvalid = chip.getAttribute('data-invalid') === 'true';
      if (isInvalid) {
        count++;
      }
    }
    return count;
  };

  // Função para buscar dados de configuração de um agente
  const fetchAgentConfigData = async (agentId: number) => {
    try {
      const [rulesRes, stepsRes, faqRes] = await Promise.all([
        fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/regras/get?id_agente=${agentId}`, {
          headers: { token }
        }),
        fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/etapas/get?id_agente=${agentId}`, {
          headers: { token }
        }),
        fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/faq/get?id_agente=${agentId}`, {
          headers: { token }
        })
      ]);

      const [rulesData, stepsData, faqData] = await Promise.all([
        rulesRes.ok ? rulesRes.json() : null,
        stepsRes.ok ? stepsRes.json() : null,
        faqRes.ok ? faqRes.json() : null
      ]);

      // Verifica se há regras
      const hasRules = rulesData && Array.isArray(rulesData) && rulesData[0]?.regras && rulesData[0].regras.trim() !== '';

      // Conta etapas e verifica chips inválidos
      const stepsCount = stepsData && Array.isArray(stepsData) ? stepsData.length : 0;
      let invalidChipsCount = 0;
      if (stepsData && Array.isArray(stepsData)) {
        invalidChipsCount = stepsData.reduce((total: number, step: any) => {
          return total + countInvalidChips(step.descricao || '');
        }, 0);
      }
      const hasInvalidChips = invalidChipsCount > 0;

      // Conta FAQs
      const faqCount = faqData && Array.isArray(faqData) ? faqData.length : 0;

      return { hasRules, stepsCount, faqCount, hasInvalidChips, invalidChipsCount };
    } catch (err) {
      console.error('Erro ao buscar dados de configuração:', err);
      return { hasRules: false, stepsCount: 0, faqCount: 0, hasInvalidChips: false, invalidChipsCount: 0 };
    }
  };

  const fetchAgents = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/get', {
        headers: { token }
      });

      if (!res.ok) throw new Error('Erro ao carregar agentes');

      const data = await res.json();
      if (Array.isArray(data)) {
        // Busca dados de configuração para cada agente
        const agentsWithConfig = await Promise.all(
          data.map(async (agent: Agent) => {
            const configData = await fetchAgentConfigData(agent.Id);
            return { ...agent, ...configData };
          })
        );
        setAgents(agentsWithConfig);
      }
    } catch (err) {
      console.error('Erro ao buscar agentes:', err);
      toast.error('Não foi possível carregar os agentes');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleToggleAgent = async (agent: Agent, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!token || !canEdit) return;

    setTogglingAgentId(agent.Id);

    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/toggle',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token: String(token),
          },
          body: JSON.stringify({ id_agente: agent.Id }),
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao alternar status do agente');
      }

      // Atualiza localmente
      setAgents(prev =>
        prev.map(a =>
          a.Id === agent.Id
            ? { ...a, isAtivo: !a.isAtivo }
            : a
        )
      );

      toast.success(`Agente ${agent.isAtivo ? 'desativado' : 'ativado'} com sucesso!`);
    } catch (err) {
      console.error('Erro ao alternar status do agente:', err);
      toast.error('Erro ao alternar status do agente');
    } finally {
      setTogglingAgentId(null);
    }
  };

  const handleCreateAgent = () => {
    setAgentFormMode('create');
    setSelectedAgent(undefined);
    setIsAgentFormOpen(true);
  };

  const handleEditAgent = (agent: Agent, e: React.MouseEvent) => {
    e.stopPropagation();
    setAgentFormMode('edit');
    setSelectedAgent(agent);
    setIsAgentFormOpen(true);
  };

  const handleAgentFormSuccess = async () => {
    await fetchAgents();
    toast.success('Agente salvo com sucesso!');
  };

  const handleCardClick = (agent: Agent) => {
    // Abre o modal de configuração
    setAgentToConfig(agent);
    setIsConfigModalOpen(true);

    // Notifica parent component se necessário
    if (onAgentSelect) {
      onAgentSelect(agent.Id);
    }
  };

  const handleAgentUpdate = useCallback(async (updatedAgent: Partial<Agent>) => {
    // Verifica se houve mudança no status de agente principal
    const principalChanged = updatedAgent.isAgentePrincipal !== undefined;

    // Se houver ID, recarrega os dados de configuração do agente
    if (updatedAgent.Id) {
      const configData = await fetchAgentConfigData(updatedAgent.Id);
      updatedAgent = { ...updatedAgent, ...configData };
    }

    setAgents(prevAgents => {
      const newAgents = prevAgents.map(agent =>
        agent.Id === updatedAgent.Id
          ? { ...agent, ...updatedAgent }
          : agent
      );

      // Se está ativando um novo agente principal, desativa o antigo
      if (principalChanged && updatedAgent.isAgentePrincipal === true) {
        return newAgents.map(agent =>
          agent.Id !== updatedAgent.Id && agent.isAgentePrincipal
            ? { ...agent, isAgentePrincipal: false }
            : agent
        );
      }

      return newAgents;
    });

    // Atualiza também o agentToConfig se for o mesmo agente
    setAgentToConfig(prev =>
      prev && prev.Id === updatedAgent.Id
        ? { ...prev, ...updatedAgent }
        : prev
    );

    // Se houve mudança de agente principal E está ativando (não desativando), força reload
    if (principalChanged && updatedAgent.isAgentePrincipal === true) {
      console.log('[AgentsTab] Novo agente principal definido, recarregando notificações...');

      // Delay para garantir que o backend processou a transferência
      setTimeout(() => {
        console.log('[AgentsTab] Incrementando notificationsKey para forçar reload...');
        setNotificationsKey(prev => {
          console.log('[AgentsTab] notificationsKey anterior:', prev, '-> novo:', prev + 1);
          return prev + 1;
        });
        fetchAgents();
      }, 1000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subTabs = [
    { id: 'agents', label: 'Agentes', icon: GuimooIcon },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'followup', label: 'Follow-up', icon: MdAutorenew },
  ] as const;

  // Função para filtrar agentes pela busca
  const filterAgents = (agentsList: Agent[]) => {
    if (!searchQuery.trim()) return agentsList;

    const query = searchQuery.toLowerCase().trim();
    return agentsList.filter(agent =>
      agent.nome.toLowerCase().includes(query) ||
      (agent.gatilho && agent.gatilho.toLowerCase().includes(query))
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Interna */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Agentes</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gerenciamento de IA</p>
        </div>

        <nav className="p-4 space-y-1">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-purple-50 dark:bg-gray-700 text-purple-700 dark:text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Área Principal */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Cabeçalho - Only show on agents tab */}
          {activeSubTab === 'agents' && (
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {/* Campo de Busca */}
                <div className="relative w-full max-w-2xl">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar agentes por nome ou gatilho..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                  />
                </div>

                {canEdit && (
                  <button
                    onClick={handleCreateAgent}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-all shadow-sm hover:shadow-md ml-4"
                  >
                    <Plus className="h-5 w-5" />
                    Novo Agente
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Conteúdo baseado na aba ativa */}
          {activeSubTab === 'agents' && (
            <>
              {/* Estado de Loading */}
              {loading && (
                <div className="flex items-center justify-center py-32">
                  <Loader2 className="h-12 w-12 animate-spin text-gray-400 dark:text-gray-600" />
                </div>
              )}

              {/* Estado Vazio */}
              {!loading && agents.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-6 shadow-lg">
                    <GuimooIcon className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Nenhum agente criado</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">Comece criando seu primeiro agente de IA</p>

                  {canEdit && (
                    <button
                      onClick={handleCreateAgent}
                      className="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-all shadow-sm hover:shadow-md"
                    >
                      <Plus className="h-5 w-5" />
                      Criar Agente
                    </button>
                  )}
                </div>
              )}

              {/* Lista de Agentes */}
              {!loading && agents.length > 0 && (() => {
                const principalFiltered = filterAgents(agents.filter(a => a.isAgentePrincipal));
                const activeFiltered = filterAgents(agents.filter(a => a.isAtivo && !a.isAgentePrincipal));
                const inactiveFiltered = filterAgents(agents.filter(a => !a.isAtivo));
                const hasResults = principalFiltered.length > 0 || activeFiltered.length > 0 || inactiveFiltered.length > 0;

                if (!hasResults && searchQuery.trim()) {
                  return (
                    <div className="flex flex-col items-center justify-center py-32">
                      <Search className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Nenhum agente encontrado
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Tente buscar por outro nome ou gatilho
                      </p>
                    </div>
                  );
                }

                return (
                <div className="space-y-6">
                  {/* Agente Principal (se existir) */}
                  {(() => {
                    const principalAgent = agents.find(a => a.isAgentePrincipal);
                    if (!principalAgent) return null;

                    // Aplica filtro de busca
                    const filteredPrincipal = filterAgents([principalAgent]);
                    if (filteredPrincipal.length === 0) return null;

                    const isToggling = togglingAgentId === principalAgent.Id;

                    return (
                      <div>
                        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                          Agente Principal
                        </h2>
                        <div className="w-96">
                          <div
                            onClick={() => handleCardClick(principalAgent)}
                            className="group relative bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer"
                          >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-12 h-12 flex items-center justify-center flex-shrink-0 bg-white/60 dark:bg-gray-800/60 rounded-lg p-2.5">
                                  <GuimooIcon className="h-full w-full" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-base font-bold text-gray-900 dark:text-white truncate mb-1">
                                    {principalAgent.nome}
                                  </h3>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                                      Principal
                                    </span>
                                    {principalAgent.isGatilho && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                                        <Zap className="h-2.5 w-2.5" />
                                        <span className="truncate max-w-[80px]">{principalAgent.gatilho}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                <button
                                  onClick={(e) => handleToggleAgent(principalAgent, e)}
                                  disabled={isToggling || !canEdit}
                                  className={`p-1.5 rounded-lg transition-all ${
                                    principalAgent.isAtivo
                                      ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                  } ${!canEdit ? 'cursor-not-allowed opacity-50' : ''}`}
                                >
                                  {isToggling ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : principalAgent.isAtivo ? (
                                    <Power className="h-3.5 w-3.5" />
                                  ) : (
                                    <PowerOff className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Grid de Configurações */}
                            <div className="space-y-2">
                              {/* Regras Gerais */}
                              <div className="flex items-center justify-between p-2 rounded-lg bg-white/40 dark:bg-gray-800/40">
                                <div className="flex items-center gap-2">
                                  <ShieldCheck className={`h-4 w-4 ${
                                    principalAgent.hasRules
                                      ? 'text-blue-600 dark:text-blue-400'
                                      : 'text-gray-400 dark:text-gray-500'
                                  }`} />
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Regras Gerais
                                  </span>
                                </div>
                                <span className={`text-xs font-semibold ${
                                  principalAgent.hasRules
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-400 dark:text-gray-500'
                                }`}>
                                  {principalAgent.hasRules ? 'Configurado' : 'Não configurado'}
                                </span>
                              </div>

                              {/* Roteiro de Atendimento */}
                              <div className="flex items-center justify-between p-2 rounded-lg bg-white/40 dark:bg-gray-800/40">
                                <div className="flex items-center gap-2">
                                  <ListChecks className={`h-4 w-4 ${
                                    principalAgent.stepsCount && principalAgent.stepsCount > 0
                                      ? principalAgent.hasInvalidChips
                                        ? 'text-yellow-600 dark:text-yellow-400'
                                        : 'text-blue-600 dark:text-blue-400'
                                      : 'text-gray-400 dark:text-gray-500'
                                  }`} />
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Roteiro
                                  </span>
                                  {principalAgent.hasInvalidChips && (
                                    <AlertCircle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" title="Contém chips inválidos" />
                                  )}
                                </div>
                                <span className={`text-xs font-semibold ${
                                  principalAgent.stepsCount && principalAgent.stepsCount > 0
                                    ? principalAgent.hasInvalidChips
                                      ? 'text-yellow-600 dark:text-yellow-400'
                                      : 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-400 dark:text-gray-500'
                                }`}>
                                  {principalAgent.stepsCount && principalAgent.stepsCount > 0 ? 'Configurado' : 'Não configurado'}
                                </span>
                              </div>

                              {/* FAQ */}
                              <div className="flex items-center justify-between p-2 rounded-lg bg-white/40 dark:bg-gray-800/40">
                                <div className="flex items-center gap-2">
                                  <HelpCircle className={`h-4 w-4 ${
                                    principalAgent.faqCount && principalAgent.faqCount > 0
                                      ? 'text-blue-600 dark:text-blue-400'
                                      : 'text-gray-400 dark:text-gray-500'
                                  }`} />
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Perguntas FAQ
                                  </span>
                                </div>
                                <span className={`text-xs font-semibold ${
                                  principalAgent.faqCount && principalAgent.faqCount > 0
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-400 dark:text-gray-500'
                                }`}>
                                  {principalAgent.faqCount && principalAgent.faqCount > 0
                                    ? `${principalAgent.faqCount} ${principalAgent.faqCount === 1 ? 'pergunta' : 'perguntas'}`
                                    : 'Nenhuma pergunta'
                                  }
                                </span>
                              </div>

                              {/* Ações Inválidas */}
                              {(principalAgent.invalidChipsCount ?? 0) > 0 && (
                                <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                  <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    <span className="text-xs font-medium text-red-700 dark:text-red-300">
                                      Ações Inválidas
                                    </span>
                                  </div>
                                  <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                                    {principalAgent.invalidChipsCount} {principalAgent.invalidChipsCount === 1 ? 'erro' : 'erros'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Agentes Ativos */}
                  {(() => {
                    const activeAgents = filterAgents(agents.filter(a => a.isAtivo && !a.isAgentePrincipal));
                    if (activeAgents.length === 0) return null;

                    return (
                      <div>
                        <button
                          onClick={() => setIsActiveExpanded(!isActiveExpanded)}
                          className="w-full flex items-center justify-between text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                          <span>Agentes Ativos ({activeAgents.length})</span>
                          {isActiveExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        {isActiveExpanded && (
                          <div className="flex flex-wrap gap-4">
                          {activeAgents.map((agent) => {
                            const isToggling = togglingAgentId === agent.Id;

                            return (
                              <div key={agent.Id} className="w-96">
                              <div
                                onClick={() => handleCardClick(agent)}
                                className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer"
                              >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 p-2.5">
                                      <GuimooIcon className="h-full w-full" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-base font-bold text-gray-900 dark:text-white truncate mb-1">
                                        {agent.nome}
                                      </h3>
                                      {agent.isGatilho && agent.gatilho && (
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                                            <Zap className="h-2.5 w-2.5" />
                                            <span className="truncate max-w-[80px]">{agent.gatilho}</span>
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                    <button
                                      onClick={(e) => handleToggleAgent(agent, e)}
                                      disabled={isToggling || !canEdit}
                                      className={`p-1.5 rounded-lg transition-all ${
                                        agent.isAtivo
                                          ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                      } ${!canEdit ? 'cursor-not-allowed opacity-50' : ''}`}
                                    >
                                      {isToggling ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : agent.isAtivo ? (
                                        <Power className="h-3.5 w-3.5" />
                                      ) : (
                                        <PowerOff className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Grid de Configurações */}
                                <div className="space-y-2">
                                  {/* Regras Gerais */}
                                  <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                    <div className="flex items-center gap-2">
                                      <ShieldCheck className={`h-4 w-4 ${
                                        agent.hasRules
                                          ? 'text-blue-600 dark:text-blue-400'
                                          : 'text-gray-400 dark:text-gray-500'
                                      }`} />
                                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Regras Gerais
                                      </span>
                                    </div>
                                    <span className={`text-xs font-semibold ${
                                      agent.hasRules
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-gray-400 dark:text-gray-500'
                                    }`}>
                                      {agent.hasRules ? 'Configurado' : 'Não configurado'}
                                    </span>
                                  </div>

                                  {/* Roteiro de Atendimento */}
                                  <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                    <div className="flex items-center gap-2">
                                      <ListChecks className={`h-4 w-4 ${
                                        agent.stepsCount && agent.stepsCount > 0
                                          ? agent.hasInvalidChips
                                            ? 'text-yellow-600 dark:text-yellow-400'
                                            : 'text-blue-600 dark:text-blue-400'
                                          : 'text-gray-400 dark:text-gray-500'
                                      }`} />
                                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Roteiro
                                      </span>
                                      {agent.hasInvalidChips && (
                                        <AlertCircle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" title="Contém chips inválidos" />
                                      )}
                                    </div>
                                    <span className={`text-xs font-semibold ${
                                      agent.stepsCount && agent.stepsCount > 0
                                        ? agent.hasInvalidChips
                                          ? 'text-yellow-600 dark:text-yellow-400'
                                          : 'text-blue-600 dark:text-blue-400'
                                        : 'text-gray-400 dark:text-gray-500'
                                    }`}>
                                      {agent.stepsCount && agent.stepsCount > 0 ? 'Configurado' : 'Não configurado'}
                                    </span>
                                  </div>

                                  {/* FAQ */}
                                  <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                    <div className="flex items-center gap-2">
                                      <HelpCircle className={`h-4 w-4 ${
                                        agent.faqCount && agent.faqCount > 0
                                          ? 'text-blue-600 dark:text-blue-400'
                                          : 'text-gray-400 dark:text-gray-500'
                                      }`} />
                                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Perguntas FAQ
                                      </span>
                                    </div>
                                    <span className={`text-xs font-semibold ${
                                      agent.faqCount && agent.faqCount > 0
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-gray-400 dark:text-gray-500'
                                    }`}>
                                      {agent.faqCount && agent.faqCount > 0
                                        ? `${agent.faqCount} ${agent.faqCount === 1 ? 'pergunta' : 'perguntas'}`
                                        : 'Nenhuma pergunta'
                                      }
                                    </span>
                                  </div>

                                  {/* Ações Inválidas */}
                                  {(agent.invalidChipsCount ?? 0) > 0 && (
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                      <div className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                        <span className="text-xs font-medium text-red-700 dark:text-red-300">
                                          Ações Inválidas
                                        </span>
                                      </div>
                                      <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                                        {agent.invalidChipsCount} {agent.invalidChipsCount === 1 ? 'erro' : 'erros'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              </div>
                            );
                          })}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Agentes Inativos */}
                  {(() => {
                    const inactiveAgents = filterAgents(agents.filter(a => !a.isAtivo));
                    if (inactiveAgents.length === 0) return null;

                    return (
                      <div>
                        <button
                          onClick={() => setIsInactiveExpanded(!isInactiveExpanded)}
                          className="w-full flex items-center justify-between text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                          <span>Agentes Inativos ({inactiveAgents.length})</span>
                          {isInactiveExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        {isInactiveExpanded && (
                          <div className="flex flex-wrap gap-4">
                          {inactiveAgents.map((agent) => {
                            const isToggling = togglingAgentId === agent.Id;

                            return (
                              <div key={agent.Id} className="w-96">
                              <div
                                onClick={() => handleCardClick(agent)}
                                className="group relative bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4 hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer opacity-75 hover:opacity-100"
                              >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 p-2.5">
                                      <GuimooIcon className="h-full w-full opacity-60" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-base font-bold text-gray-600 dark:text-gray-400 truncate mb-1">
                                        {agent.nome}
                                      </h3>
                                      {agent.isGatilho && agent.gatilho && (
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                                            <Zap className="h-2.5 w-2.5" />
                                            <span className="truncate max-w-[80px]">{agent.gatilho}</span>
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                    <button
                                      onClick={(e) => handleToggleAgent(agent, e)}
                                      disabled={isToggling || !canEdit}
                                      className={`p-1.5 rounded-lg transition-all ${
                                        agent.isAtivo
                                          ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                      } ${!canEdit ? 'cursor-not-allowed opacity-50' : ''}`}
                                    >
                                      {isToggling ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : agent.isAtivo ? (
                                        <Power className="h-3.5 w-3.5" />
                                      ) : (
                                        <PowerOff className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Grid de Configurações */}
                                <div className="space-y-2">
                                  {/* Regras Gerais */}
                                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/40 dark:bg-gray-700/30">
                                    <div className="flex items-center gap-2">
                                      <ShieldCheck className={`h-4 w-4 ${
                                        agent.hasRules
                                          ? 'text-blue-600 dark:text-blue-400'
                                          : 'text-gray-400 dark:text-gray-500'
                                      }`} />
                                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                        Regras Gerais
                                      </span>
                                    </div>
                                    <span className={`text-xs font-semibold ${
                                      agent.hasRules
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-gray-400 dark:text-gray-500'
                                    }`}>
                                      {agent.hasRules ? 'Configurado' : 'Não configurado'}
                                    </span>
                                  </div>

                                  {/* Roteiro de Atendimento */}
                                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/40 dark:bg-gray-700/30">
                                    <div className="flex items-center gap-2">
                                      <ListChecks className={`h-4 w-4 ${
                                        agent.stepsCount && agent.stepsCount > 0
                                          ? agent.hasInvalidChips
                                            ? 'text-yellow-600 dark:text-yellow-400'
                                            : 'text-blue-600 dark:text-blue-400'
                                          : 'text-gray-400 dark:text-gray-500'
                                      }`} />
                                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                        Roteiro
                                      </span>
                                      {agent.hasInvalidChips && (
                                        <AlertCircle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" title="Contém chips inválidos" />
                                      )}
                                    </div>
                                    <span className={`text-xs font-semibold ${
                                      agent.stepsCount && agent.stepsCount > 0
                                        ? agent.hasInvalidChips
                                          ? 'text-yellow-600 dark:text-yellow-400'
                                          : 'text-blue-600 dark:text-blue-400'
                                        : 'text-gray-400 dark:text-gray-500'
                                    }`}>
                                      {agent.stepsCount && agent.stepsCount > 0 ? 'Configurado' : 'Não configurado'}
                                    </span>
                                  </div>

                                  {/* FAQ */}
                                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/40 dark:bg-gray-700/30">
                                    <div className="flex items-center gap-2">
                                      <HelpCircle className={`h-4 w-4 ${
                                        agent.faqCount && agent.faqCount > 0
                                          ? 'text-blue-600 dark:text-blue-400'
                                          : 'text-gray-400 dark:text-gray-500'
                                      }`} />
                                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                        Perguntas FAQ
                                      </span>
                                    </div>
                                    <span className={`text-xs font-semibold ${
                                      agent.faqCount && agent.faqCount > 0
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-gray-400 dark:text-gray-500'
                                    }`}>
                                      {agent.faqCount && agent.faqCount > 0
                                        ? `${agent.faqCount} ${agent.faqCount === 1 ? 'pergunta' : 'perguntas'}`
                                        : 'Nenhuma pergunta'
                                      }
                                    </span>
                                  </div>

                                  {/* Ações Inválidas */}
                                  {(agent.invalidChipsCount ?? 0) > 0 && (
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                      <div className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                        <span className="text-xs font-medium text-red-700 dark:text-red-300">
                                          Ações Inválidas
                                        </span>
                                      </div>
                                      <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                                        {agent.invalidChipsCount} {agent.invalidChipsCount === 1 ? 'erro' : 'erros'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              </div>
                            );
                          })}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                );
              })()}
            </>
          )}

          {/* Aba de Notificações */}
          {activeSubTab === 'notifications' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-32">
                  <Loader2 className="h-12 w-12 animate-spin text-gray-400 dark:text-gray-600" />
                </div>
              ) : (
                <AgentFunctionsSection
                  key={notificationsKey} // Força remontagem quando muda o agente principal
                  token={token}
                  idAgente={agents.find(a => a.isAgentePrincipal)?.Id ?? 0}
                  canEdit={canEdit}
                />
              )}
            </div>
          )}

          {activeSubTab === 'followup' && (
            <FollowUpTab token={token} canViewAgent={canEdit} />
          )}
        </div>
      </main>

      {/* Modal de Criação/Edição */}
      <AgentFormModal
        isOpen={isAgentFormOpen}
        onClose={() => setIsAgentFormOpen(false)}
        onSuccess={handleAgentFormSuccess}
        token={token}
        mode={agentFormMode}
        existingAgent={selectedAgent}
        agents={agents}
      />

      {/* Modal de Configuração */}
      <AgentConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        agent={agentToConfig}
        token={token}
        onAgentUpdate={handleAgentUpdate}
      />
    </div>
  );
}
