import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Loader2, AlertCircle } from 'lucide-react';
import AgentConfigTab from '../components/ai-agent/AgentConfigTab';
import FollowUpTab from '../components/ai-agent/FollowUpTab';
import AutoMovementTab from '../components/ai-agent/AutoMovementTab';
import SessionManagementTab from '../components/ai-agent/SessionManagementTab';
import AgentTestTab from '../components/ai-agent/AgentTestTab';
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

type TabType = 'config' | 'followup' | 'movement' | 'sessions' | 'test';

const AIAgent = () => {
  const [activeTab, setActiveTab] = useState<TabType>('config');
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [savingPersonality, setSavingPersonality] = useState(false);
  const [savingSteps, setSavingSteps] = useState(false);
  const [savingFAQs] = useState(false);
  const [savingScheduling] = useState(false);
  const [togglingAgent, setTogglingAgent] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const canEdit = hasPermission('can_edit_agent');

  const handleSuccess = useCallback(async () => {
    await fetchInitialData();
  }, []);
  
  const [personality, setPersonality] = useState<AgentPersonality>({
    descricao: '',
    area: '',
    tom: 'professional',
    valor_negociacao: 0
  });

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

  const tabs: { id: TabType; label: string }[] = [
    { id: 'config', label: 'Configurações do Agente' },
    { id: 'followup', label: 'Follow-up' },
    { id: 'movement', label: 'Movimentação automática' },
    { id: 'test', label: 'Teste de Agente' }
  ];

  useEffect(() => {
    if (initialLoad) {
      fetchInitialData();
      setInitialLoad(false);
    }
  }, [initialLoad]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch agent status
      const statusResponse = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/isAtivo', {
        headers: { token }
      });
      const statusData = await statusResponse.json();
      setIsEnabled(statusData.isAgenteAtivo);

      // Fetch personality data
      const personalityResponse = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/personalidade/get', {
        headers: { token }
      });
      const personalityData = await personalityResponse.json();
      
      if (Array.isArray(personalityData) && personalityData.length > 0) {
        setPersonality(personalityData[0]);
      }

      // Fetch service steps
      const stepsResponse = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/etapas/get', {
        headers: { token }
      });
      const stepsData = await stepsResponse.json();
      
      if (Array.isArray(stepsData)) {
        setServiceSteps(stepsData);
      }

      // Fetch FAQs
      const faqsResponse = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/faq/get', {
        headers: { token }
      });
      const faqsData = await faqsResponse.json();
      
      if (Array.isArray(faqsData)) {
        setFaqs(faqsData);
      }

      // Fetch scheduling data
      const schedulingResponse = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/agendamento/get', {
        headers: { token }
      });
      if (schedulingResponse.ok) {
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
            limite_agendamento_horario:
              data.limite_agendamento_horario ?? 1,
          } as Scheduling);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar configurações do agente');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAgent = async () => {
    setTogglingAgent(true);
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao alternar status do agente');
      }

      setIsEnabled(!isEnabled);
    } catch (err) {
      console.error('Erro ao alternar status do agente:', err);
      setError('Erro ao alternar status do agente');
    } finally {
      setTogglingAgent(false);
    }
  };

  const handleSavePersonality = async () => {
    setSavingPersonality(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/personalidade/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(personality)
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar personalidade do agente');
      }

      setSuccess('Personalidade do agente salva com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar personalidade:', err);
      setError('Erro ao salvar personalidade do agente');
    } finally {
      setSavingPersonality(false);
    }
  };

  const handleAddStep = () => {
    const newOrder = serviceSteps.length + 1;
    setServiceSteps([
      ...serviceSteps,
      { ordem: newOrder, nome: '', descricao: '', atribuir_lead: false, desativar_agente: false }
    ]);
  };

  const handleRemoveStep = (ordem: number) => {
    const updatedSteps = serviceSteps
      .filter(step => step.ordem !== ordem)
      .map((step, index) => ({
        ...step,
        ordem: index + 1
      }));
    setServiceSteps(updatedSteps);
  };

  const handleUpdateStep = useCallback((ordem: number, field: 'nome' | 'descricao' | 'atribuir_lead' | 'desativar_agente', value: string | boolean) => {
    setServiceSteps(prevSteps =>
      prevSteps.map(step =>
        step.ordem === ordem ? { ...step, [field]: value } : step
      )
    );
  }, []);

  const handleReorderSteps = useCallback((updatedSteps: ServiceStep[]) => {
    setServiceSteps(updatedSteps);
  }, []);

  const handleSaveSteps = async () => {
    setSavingSteps(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/etapas/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(serviceSteps)
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar etapas de atendimento');
      }

      const updatedResponse = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/etapas/get', {
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

      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/upload', {
        method: 'POST',
        headers: { token },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erro ao fazer upload da mídia');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center text-red-600">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p>{error}</p>
          <button
            onClick={() => {
              setInitialLoad(true);
              setError('');
            }}
            className="mt-4 px-4 py-2 text-white bg-gray-500 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agente de IA</h1>
            <p className="text-sm text-gray-500 mt-1">Configure o comportamento do seu agente inteligente</p>
          </div>
        </div>

        {canEdit && (
        <label className="relative inline-flex items-center cursor-pointer">
  <input
    type="checkbox"
    className="sr-only peer"
    checked={isEnabled}
    onChange={handleToggleAgent}
    disabled={togglingAgent}
  />

          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-500"></div>
          <span className="ml-3 text-sm font-medium text-gray-700">
            {togglingAgent ? 'Alternando...' : isEnabled ? 'Ativado' : 'Desativado'}
          </span>
        </label>
        )}
      </div>

      {success && (
        <div className="mb-4 px-4 py-3 text-gray-600 bg-gray-50 border border-gray-200 rounded-md">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-8 border-b border-gray-200">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-gray-500 text-gray-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'config' ? (
        <AgentConfigTab
          personality={personality}
          setPersonality={setPersonality}
          savingPersonality={savingPersonality}
          handleSavePersonality={handleSavePersonality}
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
        />
      ) : activeTab === 'followup' ? (
        <FollowUpTab
          token={token}
          canViewAgent={canEdit}
        />
      ) : activeTab === 'movement' ? (
        <AutoMovementTab
        token={token}
                  canViewAgent={canEdit}
                  />
      ) : (
        <AgentTestTab token={token} />
      )}
    </div>
  );
}

export default AIAgent;