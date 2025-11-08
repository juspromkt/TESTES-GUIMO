import { useState, useEffect, useCallback } from 'react';
import { Plus, Power, PowerOff, Loader2, Zap, Edit2, ChevronDown, ChevronRight, Bell } from 'lucide-react';
import { IoLogoWhatsapp } from 'react-icons/io5';
import { MdAutorenew } from 'react-icons/md';
import AgentFormModal from './AgentFormModal';
import AgentConfigModal from './AgentConfigModal';
import FollowUpTab from './FollowUpTab';
import AgentFunctionsSection from './AgentFunctionsSection';
import { hasPermission } from '../../utils/permissions';
import GuimooIcon from '../GuimooIcon';

interface Agent {
  Id: number;
  nome: string;
  isAtivo?: boolean;
  isAgentePrincipal?: boolean;
  isGatilho?: boolean;
  gatilho?: string;
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
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isAgentFormOpen, setIsAgentFormOpen] = useState(false);
  const [agentFormMode, setAgentFormMode] = useState<'create' | 'edit'>('create');
  const [selectedAgent, setSelectedAgent] = useState<Agent | undefined>();
  const [togglingAgentId, setTogglingAgentId] = useState<number | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [agentToConfig, setAgentToConfig] = useState<Agent | null>(null);
  const [notificationsKey, setNotificationsKey] = useState(0); // Key para forçar reload das notificações
  const [isActiveExpanded, setIsActiveExpanded] = useState(true);
  const [isInactiveExpanded, setIsInactiveExpanded] = useState(false);

  const canEdit = hasPermission('can_edit_agent');

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
        setAgents(data);
      }
    } catch (err) {
      console.error('Erro ao buscar agentes:', err);
      setError('Não foi possível carregar os agentes');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
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

      setSuccess(`Agente ${agent.isAtivo ? 'desativado' : 'ativado'} com sucesso!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao alternar status do agente:', err);
      setError('Erro ao alternar status do agente');
      setTimeout(() => setError(''), 3000);
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
    setSuccess('Agente salvo com sucesso!');
    setTimeout(() => setSuccess(''), 3000);
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

  const handleAgentUpdate = useCallback((updatedAgent: Partial<Agent>) => {
    // Verifica se houve mudança no status de agente principal
    const principalChanged = updatedAgent.isAgentePrincipal !== undefined;

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
  }, [fetchAgents]);

  const subTabs = [
    { id: 'agents', label: 'Agentes', icon: GuimooIcon },
    { id: 'notifications', label: 'Notificações', icon: IoLogoWhatsapp },
    { id: 'followup', label: 'Follow-up', icon: MdAutorenew },
  ] as const;

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
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agentes</h1>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie seus assistentes virtuais</p>
                </div>

                {canEdit && (
                  <button
                    onClick={handleCreateAgent}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-all shadow-sm hover:shadow-md"
                  >
                    <Plus className="h-5 w-5" />
                    Novo Agente
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Mensagens de Feedback */}
          {success && (
            <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-xl">
              <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl">
              <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full" />
              <p className="text-sm font-medium">{error}</p>
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
              {!loading && agents.length > 0 && (
                <div className="space-y-6">
                  {/* Agente Principal (se existir) */}
                  {(() => {
                    const principalAgent = agents.find(a => a.isAgentePrincipal);
                    if (!principalAgent) return null;

                    const isToggling = togglingAgentId === principalAgent.Id;

                    return (
                      <div>
                        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                          Agente Principal
                        </h2>
                        <div
                          onClick={() => handleCardClick(principalAgent)}
                          className="group relative bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            {/* Ícone */}
                            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                              <GuimooIcon className="h-full w-full" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                                {principalAgent.nome}
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                                  Principal
                                </span>
                                {principalAgent.isGatilho && (
                                  <>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                                      <Zap className="h-3 w-3" />
                                      {principalAgent.gatilho}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {canEdit && (
                                <button
                                  onClick={(e) => handleEditAgent(principalAgent, e)}
                                  className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => handleToggleAgent(principalAgent, e)}
                                disabled={isToggling || !canEdit}
                                className={`p-2 rounded-lg transition-all ${
                                  principalAgent.isAtivo
                                    ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                } ${!canEdit ? 'cursor-not-allowed opacity-50' : ''}`}
                              >
                                {isToggling ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : principalAgent.isAtivo ? (
                                  <Power className="h-4 w-4" />
                                ) : (
                                  <PowerOff className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Agentes Ativos */}
                  {(() => {
                    const activeAgents = agents.filter(a => a.isAtivo && !a.isAgentePrincipal);
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
                          <div className="space-y-2">
                          {activeAgents.map((agent) => {
                            const isToggling = togglingAgentId === agent.Id;

                            return (
                              <div
                                key={agent.Id}
                                onClick={() => handleCardClick(agent)}
                                className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer"
                              >
                                <div className="flex items-center gap-3">
                                  {/* Status */}
                                  <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400 flex-shrink-0" />

                                  {/* Ícone */}
                                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 p-1">
                                    <GuimooIcon className="h-full w-full" />
                                  </div>

                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {agent.nome}
                                    </h3>
                                    {agent.isGatilho && agent.gatilho && (
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <Zap className="h-3 w-3 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate font-mono">
                                          {agent.gatilho}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {canEdit && (
                                      <button
                                        onClick={(e) => handleEditAgent(agent, e)}
                                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-all opacity-0 group-hover:opacity-100"
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => handleToggleAgent(agent, e)}
                                      disabled={isToggling || !canEdit}
                                      className={`p-1.5 rounded-lg transition-all ${
                                        agent.isAtivo
                                          ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                                          : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                                      } ${!canEdit ? 'cursor-not-allowed opacity-50' : ''}`}
                                    >
                                      {isToggling ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : agent.isAtivo ? (
                                        <Power className="h-4 w-4" />
                                      ) : (
                                        <PowerOff className="h-4 w-4" />
                                      )}
                                    </button>
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
                    const inactiveAgents = agents.filter(a => !a.isAtivo);
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
                          <div className="space-y-2">
                          {inactiveAgents.map((agent) => {
                            const isToggling = togglingAgentId === agent.Id;

                            return (
                              <div
                                key={agent.Id}
                                onClick={() => handleCardClick(agent)}
                                className="group relative bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-lg p-3 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer opacity-75 hover:opacity-100"
                              >
                                <div className="flex items-center gap-3">
                                  {/* Status */}
                                  <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />

                                  {/* Ícone */}
                                  <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 p-1">
                                    <GuimooIcon className="h-full w-full opacity-60" />
                                  </div>

                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                                      {agent.nome}
                                    </h3>
                                    {agent.isGatilho && agent.gatilho && (
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <Zap className="h-3 w-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                        <span className="text-xs text-gray-400 dark:text-gray-500 truncate font-mono">
                                          {agent.gatilho}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {canEdit && (
                                      <button
                                        onClick={(e) => handleEditAgent(agent, e)}
                                        className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-all opacity-0 group-hover:opacity-100"
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => handleToggleAgent(agent, e)}
                                      disabled={isToggling || !canEdit}
                                      className={`p-1.5 rounded-lg transition-all ${
                                        agent.isAtivo
                                          ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                                          : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                                      } ${!canEdit ? 'cursor-not-allowed opacity-50' : ''}`}
                                    >
                                      {isToggling ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : agent.isAtivo ? (
                                        <Power className="h-4 w-4" />
                                      ) : (
                                        <PowerOff className="h-4 w-4" />
                                      )}
                                    </button>
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
              )}
            </>
          )}

          {/* Aba de Notificações */}
          {activeSubTab === 'notifications' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-32">
                  <Loader2 className="h-12 w-12 animate-spin text-gray-400 dark:text-gray-600" />
                </div>
              ) : !agents.find(a => a.isAgentePrincipal) ? (
                <div className="flex flex-col items-center justify-center py-32">
                  <Bell className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Nenhum agente principal configurado
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Configure um agente como principal para gerenciar notificações globais
                  </p>
                </div>
              ) : (
                <AgentFunctionsSection
                  key={notificationsKey} // Força remontagem quando muda o agente principal
                  token={token}
                  idAgente={agents.find(a => a.isAgentePrincipal)!.Id}
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
