import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, AlertCircle, Repeat2, Activity, FlaskConical, Plus } from 'lucide-react';
import AgentConfigTab from '../components/ai-agent/AgentConfigTab';
import FollowUpTab from '../components/ai-agent/FollowUpTab';
import SessionManagementTab from '../components/ai-agent/SessionManagementTab';
import AgentTestTab from '../components/ai-agent/AgentTestTab';
import AgentSelector from '../components/ai-agent/AgentSelector';
import AgentFormModal from '../components/ai-agent/AgentFormModal';
import { hasPermission } from '../utils/permissions';

interface ServiceStep {
  ordem: number;
  nome: string;
  descricao: string;
  atribuir_lead?: boolean;
  desativar_agente?: boolean;
}

interface FAQ {
  ordem: number;
  pergunta: string;
  resposta: string;
}

interface AgentPersonality {
  descricao: string;
  area: string;
  tom: string;
  valor_negociacao: number;
}

interface Scheduling {
  isAtivo: boolean;
  id_agenda: string;
  nome: string;
  descricao: string;
  prompt_consulta_horarios: string;
  prompt_marcar_horario: string;
  duracao_horario: string | null;
  limite_agendamento_horario: number | null;
  agenda_padrao: 'GOOGLE_MEET' | 'AGENDA_INTERNA' | 'SISTEMA_EXTERNO';
  url_consulta_externa: string | null;
  url_marcacao_externa: string | null;
}

type TabType = 'followup' | 'sessions' | 'test';

const AIAgent = () => {
  const [activeTab, setActiveTab] = useState<TabType | null>(null);
  const [agents, setAgents] = useState<Array<{
    Id: number;
    nome: string;
    isAtivo?: boolean;
    isAgentePrincipal?: boolean;
    isGatilho?: boolean;
    gatilho?: string;
  }>>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAgentFormOpen, setIsAgentFormOpen] = useState(false);
  const [agentFormMode, setAgentFormMode] = useState<'create' | 'edit'>('create');

  const [savingSteps, setSavingSteps] = useState(false);
  const [savingFAQs] = useState(false);
  const [savingScheduling] = useState(false);
  const [togglingAgent, setTogglingAgent] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [serviceStepsLoading, setServiceStepsLoading] = useState(true);
  const [faqsLoading, setFaqsLoading] = useState(true);
  const [schedulingLoading, setSchedulingLoading] = useState(true);
  const canEdit = hasPermission('can_edit_agent');
  const [agentsLoading, setAgentsLoading] = useState(true);

  const setGenericError = useCallback(() => {
    setError((prev) =>
      prev || 'Não foi possível carregar todas as informações do agente.'
    );
  }, []);

  const [serviceSteps, setServiceSteps] = useState<ServiceStep[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [scheduling, setScheduling] = useState<Scheduling>({
    isAtivo: false,
    id_agenda: '',
    nome: '',
    descricao: '',
    prompt_consulta_horarios: '',
    prompt_marcar_horario: '',
    duracao_horario: null,
    limite_agendamento_horario: 1,
    agenda_padrao: 'GOOGLE_MEET',
    url_consulta_externa: null,
    url_marcacao_externa: null
  });

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  const fixedTabs: { id: TabType; label: string; description: string; icon: React.ElementType }[] = [
    { id: 'followup', label: 'Follow-up', description: 'Configure mensagens de acompanhamento', icon: Repeat2 },
    { id: 'sessions', label: 'Sessões', description: 'Gerencie sessões ativas', icon: Activity },
    { id: 'test', label: 'Teste', description: 'Teste o comportamento do agente', icon: FlaskConical }
  ];

  const handleCreateAgent = () => {
    setAgentFormMode('create');
    setIsAgentFormOpen(true);
  };

  const handleUpdateAgent = () => {
    setAgentFormMode('edit');
    setIsAgentFormOpen(true);
  };

  const handleAgentFormSuccess = async () => {
    await fetchMultiAgents();
    setSuccess('Agente salvo com sucesso!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const fetchMultiAgents = useCallback(async () => {if (!token) return;
    try {
      setAgentsLoading(true);
      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/get', {
        headers: { token }
      });
      if (!res.ok) throw new Error('Erro ao carregar multiagente');
      const data = await res.json();
      if (Array.isArray(data)) {
        setAgents(data);
        const principal = data.find((a: any) => a.isAgentePrincipal);
        const sel = (principal?.Id ?? data[0]?.Id) ?? null;
        setSelectedAgentId(sel);
        const cur = data.find((a: any) => a.Id === sel);
        setIsEnabled(Boolean(cur?.isAtivo));
      }
        } catch (err) {
          console.error('Erro ao buscar multiagente:', err);
        } finally {
          setAgentsLoading(false);

        }
      }, [token]);

  const withAgentId = (url: string) => {
    if (!selectedAgentId) return url;
    const hasQuery = url.includes('?');
    return `${url}${hasQuery ? '&' : '?'}id_agente=${selectedAgentId}`;
  };

  const fetchServiceSteps = useCallback(async () => {
    if (!token) {
      setServiceStepsLoading(false);
      return;
    }

    setServiceStepsLoading(true);
    try {
      const stepsResponse = await fetch(
        withAgentId('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/etapas/get'),
        {
          headers: { token }
        }
      );
      if (!stepsResponse.ok) {
        throw new Error('Erro ao carregar etapas');
      }
      const stepsData = await stepsResponse.json();

      if (Array.isArray(stepsData)) {
        setServiceSteps(stepsData);
      } else {
        setServiceSteps([]);
      }
    } catch (err) {
      console.error('Erro ao carregar etapas:', err);
      setGenericError();
    } finally {
      setServiceStepsLoading(false);
    }
  }, [token, setGenericError, selectedAgentId]);

  const fetchFaqs = useCallback(async () => {
    if (!token) {
      setFaqsLoading(false);
      return;
    }

    setFaqsLoading(true);
    try {
      const faqsResponse = await fetch(
        withAgentId('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/faq/get'),
        {
          headers: { token }
        }
      );
      if (!faqsResponse.ok) {
        throw new Error('Erro ao carregar FAQs');
      }
      const faqsData = await faqsResponse.json();

      if (Array.isArray(faqsData)) {
        setFaqs(faqsData);
      } else {
        setFaqs([]);
      }
    } catch (err) {
      console.error('Erro ao carregar FAQs:', err);
      setGenericError();
    } finally {
      setFaqsLoading(false);
    }
  }, [token, setGenericError, selectedAgentId]);

  const fetchScheduling = useCallback(async () => {
    if (!token) {
      setSchedulingLoading(false);
      return;
    }

    setSchedulingLoading(true);
    try {
      const schedulingResponse = await fetch(
        withAgentId('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/agendamento/get'),
        {
          headers: { token: String(token) },
        }
      );
      if (!schedulingResponse.ok) {
        throw new Error('Erro ao carregar agendamento');
      }

      let schedulingData: unknown = [];
      try {
        const text = await schedulingResponse.text();
        schedulingData = text ? JSON.parse(text) : [];
      } catch {
        schedulingData = [];
      }

      if (Array.isArray(schedulingData) && schedulingData.length > 0) {
        const data = schedulingData[0] as Partial<Scheduling>;
        setScheduling({
          ...data,
          limite_agendamento_horario: data.limite_agendamento_horario ?? 1,
        } as Scheduling);
      }
    } catch (err) {
      console.error('Erro ao carregar agendamento:', err);
      setGenericError();
    } finally {
      setSchedulingLoading(false);
    }
  }, [token, setGenericError, selectedAgentId]);

  const fetchInitialData = useCallback(async () => {
    setError('');
    if (!selectedAgentId) return;
    await Promise.all([
      fetchServiceSteps(),
      fetchFaqs(),
      fetchScheduling(),
    ]);
  }, [
    fetchFaqs,
    fetchScheduling,
    fetchServiceSteps,
    selectedAgentId,
  ]);

  const handleSuccess = useCallback(async () => {
    await Promise.all([
      fetchServiceSteps(),
      fetchFaqs(),
      fetchScheduling(),
    ]);
  }, [fetchFaqs, fetchScheduling, fetchServiceSteps]);

  const initialLoadedRef = useRef(false);
  useEffect(() => {
    if (!initialLoadedRef.current) {
      initialLoadedRef.current = true;
      fetchMultiAgents();
    }
  }, [fetchMultiAgents]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleToggleAgent = async () => {
    if (!token || !selectedAgentId) {
      setError('Token ou agente nÃ£o selecionado.');
      return;
    }

    setTogglingAgent(true);
    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/toggle',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token: String(token),
          },
          body: JSON.stringify({ id_agente: selectedAgentId }),
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao alternar status do agente');
      }

      setIsEnabled(prev => !prev);
      await fetchMultiAgents();
    } catch (err) {
      console.error('Erro ao alternar status do agente:', err);
      setError('Erro ao alternar status do agente');
    } finally {
      setTogglingAgent(false);
    }
  };

  const handleAddStep = () => {
    const newOrder = serviceSteps.length + 1;
    setServiceSteps([
      ...serviceSteps,
      { ordem: newOrder, nome: '', descricao: '', atribuir_lead: false, desativar_agente: false },
    ]);
  };

  const handleRemoveStep = (ordem: number) => {
    const updatedSteps = serviceSteps
      .filter(step => step.ordem !== ordem)
      .map((step, index) => ({
        ...step,
        ordem: index + 1,
      }));
    setServiceSteps(updatedSteps);
  };

  const handleUpdateStep = useCallback(
    (
      ordem: number,
      field: 'nome' | 'descricao' | 'atribuir_lead' | 'desativar_agente',
      value: string | boolean
    ) => {
      setServiceSteps(prevSteps =>
        prevSteps.map(step => (step.ordem === ordem ? { ...step, [field]: value } : step))
      );
    },
    []
  );

  const handleReorderSteps = useCallback((updatedSteps: ServiceStep[]) => {
    setServiceSteps(updatedSteps);
  }, []);

  const handleSaveSteps = async () => {
    setSavingSteps(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/etapas/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(serviceSteps.map(s => ({ ...s, id_agente: selectedAgentId })))
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar etapas de atendimento');
      }

      const updatedResponse = await fetch(withAgentId('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/etapas/get'), {
        headers: { token }
      });

      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        if (Array.isArray(updatedData)) {
          setServiceSteps(updatedData);
        }
      }

      setSuccess('Etapas de atendimento salvas com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar etapas:', err);
      setError('Erro ao salvar etapas de atendimento');
    } finally {
      setSavingSteps(false);
    }
  };

  const handleMediaUpload = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(withAgentId('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/upload'), {
        method: 'POST',
        headers: { token },
        body: (() => { formData.append('id_agente', String(selectedAgentId ?? '')); return formData; })()
      });

      if (!response.ok) {
        throw new Error('Erro ao fazer upload da mÃ­dia');
      }

      const { url } = await response.json();
      return url;
    } catch (err) {
      console.error('Error uploading media:', err);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const selectedAgent = agents.find(a => a.Id === selectedAgentId);
  const hasAgents = agents.some(a => a && typeof a.Id === 'number');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {agentsLoading && (
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-16 text-center shadow-lg">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
          <p className="text-base font-semibold text-slate-900">Carregando agentes...</p>
          <p className="text-sm text-slate-500 mt-2">Aguarde um momento</p>
        </div>
        )}
        {!agentsLoading && !hasAgents && (
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-16 text-center shadow-lg">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
            <AlertCircle className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Nenhum agente configurado</h2>
          <p className="text-base text-slate-600 mb-10 max-w-md mx-auto">
            Crie seu primeiro agente de IA para começar a automatizar seu atendimento
          </p>
          <button
            onClick={handleCreateAgent}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-4 text-base font-semibold text-white hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="h-5 w-5" />
            Criar primeiro agente
          </button>
        </div>
        )}
        {hasAgents && (
          <>
            {/* Header Section - Agent Specific */}
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl mb-8 overflow-hidden shadow-lg">
              <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-dark-50 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shadow-md">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      Configuração do Agente
                    </h1>
                    <p className="text-sm text-slate-600 ml-[52px]">
                      Configurações individuais por agente
                    </p>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-md">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={isEnabled}
                          onChange={handleToggleAgent}
                          disabled={togglingAgent}
                        />
                        <div className="relative w-11 h-6 bg-slate-800 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-dark-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md peer-checked:bg-gradient-to-r peer-checked:from-slate-600 peer-checked:to-slate-600"></div>
                      </label>
                      <span className="text-sm font-semibold text-slate-700 min-w-[75px]">
                        {togglingAgent ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                            <span className="text-slate-500">...</span>
                          </span>
                        ) : isEnabled ? (
                          <span className="text-black-600">✓ Ativo</span>
                        ) : (
                          <span className="text-slate-400">Inativo</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8">
                {/* Agent Selector */}
                <AgentSelector
                  agents={agents}
                  selectedAgentId={selectedAgentId}
                  onSelectAgent={(id) => {
                    setSelectedAgentId(id);
                    const agent = agents.find(a => a.Id === id);
                    setIsEnabled(Boolean(agent?.isAtivo));
                  }}
                  onCreateAgent={handleCreateAgent}
                  onUpdateAgent={handleUpdateAgent}
                  canEdit={canEdit}
                />

                {/* Agent Info Banner */}
                {selectedAgent && selectedAgent.isGatilho && selectedAgent.gatilho && (
                  <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span className="font-semibold text-amber-900">Gatilho configurado:</span>
                      <span className="text-amber-800 font-mono text-sm bg-white px-3 py-1.5 rounded-lg border border-amber-200 shadow-sm">
                        "{selectedAgent.gatilho}"
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mb-8 flex items-start gap-4 rounded-xl border border-red-300 bg-gradient-to-r from-red-50 to-rose-50 p-5 text-red-700 shadow-md">
                <div className="mt-0.5 h-10 w-10 flex-shrink-0 rounded-xl bg-red-500 flex items-center justify-center shadow-sm">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold mb-1">Erro ao carregar</p>
                  <p className="text-sm">{error}</p>
                  <button
                    onClick={() => {
                      fetchInitialData();
                    }}
                    className="mt-3 text-sm font-semibold text-red-700 hover:text-red-800 underline underline-offset-4"
                  >
                    Tentar novamente →
                  </button>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-8 flex items-start gap-4 px-5 py-4 text-emerald-700 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-300 rounded-xl shadow-md">
                <div className="mt-0.5 h-10 w-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-sm">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-semibold mt-2">{success}</p>
              </div>
            )}

            {/* Content Area - Agent Configuration */}
            {activeTab === null && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-8 py-5">
                  <h2 className="text-base font-bold text-slate-900">Configurações do Agente</h2>
                  <p className="text-sm text-slate-600 mt-1">Personalize comportamento e funcionalidades</p>
                </div>
                <div className="p-8">
                  <AgentConfigTab
                    idAgente={selectedAgentId ?? 0}
                    token={token}
                    serviceSteps={serviceSteps}
                    handleAddStep={handleAddStep}
                    handleRemoveStep={handleRemoveStep}
                    handleUpdateStep={handleUpdateStep}
                    handleReorderSteps={handleReorderSteps}
                    savingSteps={savingSteps}
                    handleSaveSteps={handleSaveSteps}
                    faqs={faqs}
                    setFaqs={setFaqs}
                    savingFAQs={savingFAQs}
                    scheduling={scheduling}
                    setScheduling={setScheduling}
                    savingScheduling={savingScheduling}
                    onMediaUpload={handleMediaUpload}
                    isUploading={isUploading}
                    onSuccess={handleSuccess}
                    isServiceStepsLoading={serviceStepsLoading}
                    isFaqsLoading={faqsLoading}
                    isSchedulingLoading={schedulingLoading}
                  />
                </div>
              </div>
            )}

            {/* Global Tools Section */}
            {activeTab !== null && (
              <>
                <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl mb-6 overflow-hidden shadow-lg">
                  <div className="px-8 py-5 bg-gradient-to-r from-slate-600 to-slate-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                          </div>
                          Ferramentas Globais
                        </h2>
                        <p className="text-sm text-indigo-100 mt-1 ml-12">
                          Independente do agente selecionado
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab(null)}
                        className="text-sm font-semibold text-white hover:text-indigo-100 transition-colors px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                      >
                        ← Voltar para agente
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                    <nav className="flex gap-2">
                      {fixedTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center justify-center gap-2 flex-1 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                              isActive
                                ? 'bg-white text-indigo-600 shadow-md border border-indigo-200'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
                  <div className="p-8">
                    {activeTab === 'followup' && <FollowUpTab token={token} canViewAgent={canEdit} />}
                    {activeTab === 'sessions' && <SessionManagementTab token={token} canDelete={canEdit} />}
                    {activeTab === 'test' && <AgentTestTab token={token} />}
                  </div>
                </div>
              </>
            )}

            {/* Access Global Tools */}
            {activeTab === null && (
              <div className="mt-8 bg-gradient-to-br from-slate-600 via-slate-600 to-slate-600 border border-indigo-400 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      Ferramentas Globais
                    </h3>
                    <p className="text-sm text-indigo-100 mb-6 ml-[52px]">
                      Recursos que funcionam para todos os agentes
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {fixedTabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="inline-flex items-center gap-2 px-5 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      <AgentFormModal
        isOpen={isAgentFormOpen}
        onClose={() => setIsAgentFormOpen(false)}
        onSuccess={handleAgentFormSuccess}
        token={token}
        mode={agentFormMode}
        existingAgent={agentFormMode === 'edit' ? selectedAgent : undefined}
        agents={agents}
      />
      </div>
    </div>
  );
};

export default AIAgent;



